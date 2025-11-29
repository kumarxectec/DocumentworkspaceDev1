import {
  fileToBase64,
  getMockFOClientsList,
  getMockFOClientSubfolders,
  getMockFOTabsList,
  mockFrontOfficeGetTabs,
  mockFrontOfficeRootFolder,
} from "@/lib/constants";
import {
  addFolder,
  deleteFolder,
  fetchFOClientLawMetadata,
  fetchFOClientsList,
  fetchFolderClientId,
  fetchFolderClientName,
  fetchFolderDocumentSubType,
  fetchFolderDocumentType,
  fetchFrontOfficeFolders,
  fetchFrontOfficeTabs,
  fetchNewDocumentTemplates,
  searchFolder,
  updateFolderName,
  uploadFilesToActiveClientFolder,
  uploadNewFilesToActiveClientFolder,
  upsertFolder,
} from "@/services/api";
import useStore from "./useStore";
import { debounce } from "@/lib/utils";

const { create } = require("zustand");

function buildTreeFromSearchResults(results) {
  const root = {};

  results.forEach((item) => {
    const doc = item.document || item;
    const parts = doc.FullPath.split("\\").filter(Boolean);
    let current = root;

    parts.forEach((part, idx) => {
      if (!current[part]) {
        current[part] = {
          id: parts.slice(0, idx + 1).join("\\"),
          name: part,
          fullPath: doc.FullPath,
          parent: doc.Parent,
          clientName: doc.ClientName,
          clientId: doc.ClientId,
          documentType: doc.DocumentType,
          documentSubType: doc.DocumentSubType,
          template: doc.Template,
          folderType: doc.FolderType,
          children: {},
          canCreate: doc.CanCreate,
          canUpload: doc.CanUpload,
        };
      }
      current = current[part].children;
    });
  });

  const convert = (nodeMap) =>
    Object.values(nodeMap).map((node) => ({
      id: node.id,
      name: node.name,
      fullPath: node.fullPath,
      parent: node.parent,
      clientName: node.clientName,
      clientId: node.clientId,
      documentType: node.documentType,
      documentSubType: node.documentSubType,
      template: node.template,
      folderType: node.folderType,
      children: convert(node.children),
      hasChildren: Object.keys(node.children).length > 0,
      canCreate: node.canCreate,
      canUpload: node.canUpload,
      type: "folder",
    }));

  return convert(root);
}

const appendChildrenToPath = (nodes, targetPath, newChildren) => {
  return nodes.map((node) => {
    if (node.fullPath === targetPath) {
      return {
        ...node,
        children: node.children?.length
          ? [...node.children, ...newChildren]
          : newChildren,
      };
    }

    if (node.children?.length) {
      return {
        ...node,
        children: appendChildrenToPath(node.children, targetPath, newChildren),
      };
    }

    return node;
  });
};

const updateFolderNameInTree = (nodes, id, newName) => {
  return nodes.map((node) =>
    node.id === id
      ? { ...node, name: newName }
      : node.children
      ? {
          ...node,
          children: updateFolderNameInTree(node.children, id, newName),
        }
      : node
  );
};

const removeFolderFromTree = (nodes, id) => {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: removeFolderFromTree(node.children, id) }
        : node
    );
};

const useFrontOfficeStore = create((set, get) => ({
  loading: true,
  apiError: null,
  frontOfficeUITab: "upload",
  frontOfficeTabsList: null,
  isFrontOffice: false,
  selectedFolderTab: null,
  folderData: [],
  selectedFolder: null,
  folderTemplatesList: null,
  selectedFolderTemplatesList: null,
  selectedFolderTemplate: null,
  clientNameData: null,
  clientIdData: null,
  documentTypeData: null,
  documentSubTypeData: null,
  selectedClientName: null,
  selectedClientId: null,
  selectedDocumentType: null,
  selectedDocumentSubType: null,
  clientsList: null,
  selectedClient: null,
  selectedClientFolderData: null,

  // Simplified upload state
  uploadState: {
    type: null, // 'local' | 'blank' | 'template'
    status: "idle", // 'idle' | 'preparing' | 'uploading' | 'success' | 'error'
    files: [],
    error: null,
  },

  documentsList: null,
  activeTab: "upload",
  manageFolderMode: "idle",
  newDocumentTemplates: null,

  // Search
  searchResults: [],
  searchTerm: "",
  isSearching: false,
  searchError: null,

  // Upload state setters
  setUploadType: (type) =>
    set((state) => ({
      uploadState: { ...state.uploadState, type, status: "preparing" },
    })),

  setUploadStatus: (status) =>
    set((state) => ({
      uploadState: { ...state.uploadState, status },
    })),

  setUploadFiles: (files) =>
    set((state) => ({
      uploadState: { ...state.uploadState, files },
    })),

  setUploadError: (error) =>
    set((state) => ({
      uploadState: { ...state.uploadState, error, status: "error" },
    })),

  resetUpload: () =>
    set({
      uploadState: {
        type: null,
        status: "idle",
        files: [],
        error: null,
      },
    }),

  // Other setters
  setNewDocumentTemplates: (value) => set({ newDocumentTemplates: value }),
  setManageFolderMode: (value) => set({ manageFolderMode: value }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveTab: (value) => set({ activeTab: value }),
  setFrontOfficeTab: (tab) => set({ frontOfficeUITab: tab }),
  setIsFrontOffice: (value) => set({ isFrontOffice: value }),
  setSelectedFolderTab: (tab) => set({ selectedFolderTab: tab }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setSelectedFolderTemplatesList: (templates) =>
    set({ selectedFolderTemplatesList: templates }),
  setSelectedFolderTemplate: (template) =>
    set({ selectedFolderTemplate: template }),
  setSelectedClientName: (value) => set({ selectedClientName: value }),
  setSelectedClientId: (value) => set({ selectedClientId: value }),
  setSelectedDocumentType: (value) => set({ selectedDocumentType: value }),
  setSelectedDocumentSubType: (value) =>
    set({ selectedDocumentSubType: value }),
  setDocumentsList: (docs) => set({ documentsList: docs }),
  setClientsList: (clients) => set({ clientsList: clients }),
  setSelectedClient: (client) => set({ selectedClient: client }),
  setSelectedClientFolderData: (value) =>
    set({ selectedClientFolderData: value }),

  // Helper function to convert file to base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  },

  // Main unified upload function
  // Enhanced unified upload function supporting mixed file types
  uploadFiles: async (folder, properties) => {
  const { uploadState, fileToBase64 } = get();
  const { files } = uploadState;

  if (!files?.length) {
    console.error("No files to upload");
    return null;
  }

  set((state) => ({
    uploadState: { ...state.uploadState, status: "uploading", error: null },
    documentsList: null,
    apiError: null,
  }));

  try {
    const localFiles = files.filter(f => f.uploadType === 'local');
    const blankFiles = files.filter(f => f.uploadType === 'blank');
    const templateFiles = files.filter(f => f.uploadType === 'template');

    let allDocuments = [];

    // 1️⃣ Upload Local Files
    if (localFiles.length > 0) {
      const processedLocalFiles = await Promise.all(
        localFiles.map(async (file) => ({
          name: file.name,
          content: await fileToBase64(file.file || file),
          size: file.size,
          mimeType: file.type,
        }))
      );

      const res = await uploadNewFilesToActiveClientFolder({
        uploadType: "local",
        folder: folder.fullPath,
        properties,
        files: processedLocalFiles
      });

      if (res?.data?.Status !== "Success") throw new Error(res?.data?.Message || "Local upload failed");
      allDocuments.push(...(res?.data?.DocumentList || []));
    }

    // 2️⃣ Upload Blank Files
    if (blankFiles.length > 0) {
      const processedBlankFiles = blankFiles.map(file => ({
        name: file.name,
        extension: file.type,
        isNew: true,
      }));

      const res = await uploadNewFilesToActiveClientFolder({
        uploadType: "blank",
        folder: folder.fullPath,
        properties,
        files: processedBlankFiles
      });

      if (res?.data?.Status !== "Success") throw new Error(res?.data?.Message || "Blank upload failed");
      allDocuments.push(...(res?.data?.DocumentList || []));
    }

    // 3️⃣ Upload Template Files
    if (templateFiles.length > 0) {
      const processedTemplateFiles = templateFiles.map(file => ({
        name: file.name,
        templateId: file.templateId,
        extension: file.type,
        isTemplate: true,
      }));

      const res = await uploadNewFilesToActiveClientFolder({
        uploadType: "template",
        folder: folder.fullPath,
        properties,
        files: processedTemplateFiles
      });

      if (res?.data?.Status !== "Success") throw new Error(res?.data?.Message || "Template upload failed");
      allDocuments.push(...(res?.data?.DocumentList || []));
    }

    // ✅ Combine all uploaded documents
    set((state) => ({
      uploadState: { ...state.uploadState, status: "success" },
      documentsList: allDocuments,
    }));

    console.log("✅ All files uploaded successfully:", allDocuments);
    return { data: { Status: "Success", DocumentList: allDocuments } };

  } catch (error) {
    console.error("❌ Upload error:", error);
    set((state) => ({
      uploadState: { ...state.uploadState, status: "error", error: error.message },
      apiError: error.message,
    }));
    throw error;
  }
},


  // API: Fetch Tabs
  fetchFrontOfficeTabsList: async () => {
    set({ loading: true, apiError: null });

    try {
      // const res = await fetchFrontOfficeTabs();
      const res = await getMockFOTabsList()
      const tabs = res.folders || [];

      const activeClientTab =
        tabs.find((tab) => tab.displayName === "Active Clients") || tabs[0];

      set({
        frontOfficeTabsList: tabs,
        selectedFolderTab: activeClientTab || null,
        folderTemplatesList: res.folderTemplateMapping,
        loading: false,
      });

      return res;
    } catch (err) {
      set({
        frontOfficeTabsList: null,
        selectedFolderTab: null,
        loading: false,
        apiError: err.message,
      });
    }
  },

  // API: Fetch Folders
  fetchFrontOfficeFolders: async (folderType, path) => {
    const { folderData } = get();
    set({ loading: true, apiError: null });

    try {
      const res = await fetchFrontOfficeFolders(folderType, path);
      const folders = res.folders || [];

      const formatted = folders.map((item) => ({
        id: item.id,
        name: item.name,
        parent: item.parent,
        fullPath: item.fullPath,
        clientName: item.clientName,
        clientId: item.clientId,
        documentType: item.documentType,
        documentSubType: item.documentSubType,
        hasChildren: true,
        folderType: item.folderType,
        children: [],
        type: "folder",
        canUpload: item.canUpload,
        canCreate: item.canCreate,
        template: item.template,
      }));

      let updatedTree;
      if (path === "\\" || path === "" || path === "ROOT") {
        updatedTree = formatted;
        set({ originalFolderData: formatted });
      } else {
        updatedTree = appendChildrenToPath(folderData, path, formatted);
      }

      set({
        folderData: updatedTree,
        loading: false,
      });

      return res;
    } catch (err) {
      set({ loading: false, apiError: err.message });
    }
  },

  fetchFOClientsList: async () => {
    set({ loading: true, apiError: null });
    const { setClientsList } = get();

    try {
      const res = await fetchFOClientsList()
      // const res = getMockFOClientsList();
      console.log(res, "client list res");

      if (res?.data.status === "Success") {
        setClientsList(res.data.clients);
        console.log(res.data.clients, "client list res");
      }
    } catch (err) {
      set({ loading: false, apiError: err.message });
    }
  },

  fetchFOLawMetadata: async () => {
    set({ loading: true, apiError: null });
    const { setSelectedClientFolderData } = get();

    try {
      const res = await fetchFOClientLawMetadata();
      // const res = getMockFOClientSubfolders()
      console.log(res, "client metadata folders res");

      if (res?.data.status === "Success") {
        setSelectedClientFolderData(res.data.metadata);
        console.log(res.data.metadata, "client list res");
      }
    } catch (err) {
      set({ loading: false, apiError: err.message });
    }
  },

  // Fetch folder metadata
  fetchFolderData: async ({
    clientName,
    clientId,
    documentType,
    documentSubType,
  }) => {
    set({ loading: true, error: null });

    try {
      const results = {};
      const promises = [];

      if (clientName) {
        promises.push(
          fetchFolderClientName(clientName).then((res) => {
            results.clientName = res;
          })
        );
      }

      if (clientId) {
        promises.push(
          fetchFolderClientId(clientId).then((res) => {
            results.clientId = res;
          })
        );
      }

      if (documentType) {
        promises.push(
          fetchFolderDocumentType(documentType).then((res) => {
            results.documentType = res;
          })
        );
      }

      if (documentSubType) {
        promises.push(
          fetchFolderDocumentSubType(documentSubType).then((res) => {
            results.documentSubType = res;
          })
        );
      }

      await Promise.all(promises);

      set((state) => ({
        ...state,
        clientNameData: results.clientName ?? state.clientNameData,
        clientIdData: results.clientId ?? state.clientIdData,
        documentTypeData: results.documentType ?? state.documentTypeData,
        documentSubTypeData:
          results.documentSubType ?? state.documentSubTypeData,
        loading: false,
      }));

      return results;
    } catch (err) {
      console.error("❌ Error fetching folder data:", err);
      set({ error: err, loading: false });
      throw err;
    }
  },

  addNewClientFolder: async (folderName) => {
    set({ loading: true, apiError: null });
    const folderType = get().selectedFolderTab?.folderType;
    const fetchFrontOfficeFolders = get().fetchFrontOfficeFolders;
    try {
      const payload = {
        id: "-1",
        folderType: folderType,
        name: folderName,
        parent: "ROOT",
        ClientId: "",
        ClientName: "",
        DocumentSubType: "",
        DocumentType: "",
        Template: "",
        canUpload: "",
        canCreate: "",
      };
      const res = await addFolder(payload);
      fetchFrontOfficeFolders(folderType, "ROOT");
      return res;
    } catch (error) {
      console.error(error);
    }
  },

  addNewSubFolder: async (folder) => {
    set({ loading: true, apiError: null });
    const folderType = get().selectedFolderTab?.folderType;
    const path = get().selectedFolder?.fullPath;
    try {
      const payload = {
        id: "-1",
        folderType: folderType,
        name: folder.name,
        parent: path,
        ClientId: folder.clientId ?? "",
        ClientName: folder.clientName ?? "",
        DocumentSubType: folder.documentSubType ?? "",
        DocumentType: folder.documentType ?? "",
        Template: folder.template ?? "",
        canUpload: folder.canUpload ?? true,
        canCreate: folder.canCreate ?? true,
      };
      const res = await addFolder(payload);
      return res;
    } catch (error) {
      console.error(error);
    }
  },

  updateFolderName: async (folder, formValues) => {
    set({ loading: true, apiError: null });

    const folderType = get().selectedFolderTab?.folderType;
    const path = get().selectedFolder?.fullPath;
    const id = get().selectedFolder?.id;

    try {
      const payload = {
        id: folder.id || id || "",
        name: folder.name || "",
        parent: folder.parent || "",
        fullPath: folder.fullPath || path || "",
        clientName: formValues.clientName || "",
        clientId: formValues.clientId || "",
        documentType: formValues.documentType || "",
        documentSubType: formValues.documentSubType || "",
        template: formValues.template || "",
        folderType: folder.folderType || folderType || "",
        canCreate: typeof formValues.canCreate === "boolean" ? true : false,
        canUpload: typeof formValues.canUpload === "boolean" ? true : false,
      };

      const res = await updateFolderName(formValues, payload);
      return res;
    } catch (error) {
      console.error(error);
    }
  },

  deleteFolder: async () => {
    set({ loading: true, apiError: null });
    const fullPath = get().selectedFolder?.fullPath;
    const folderType = get().selectedFolderTab?.folderType;
    try {
      const res = await deleteFolder(folderType, fullPath);
      return res;
    } catch (error) {
      set({ loading: false, apiError: error.message });
    }
  },

  searchFolders: debounce(async (folderType, query) => {
    if (!query || query.length < 3) {
      set({ searchResults: null, searchError: null, isSearching: false });
      return;
    }

    set({ isSearching: true, searchError: null });

    try {
      const results = await searchFolder(folderType, query);
      const parsed = JSON.parse(results?.data || "[]");
      const rebuiltTree = buildTreeFromSearchResults(parsed);

      set({
        searchResults: rebuiltTree,
        isSearching: false,
      });
    } catch (error) {
      set({
        searchError: error.message || "Search failed",
        isSearching: false,
      });
    }
  }, 400),

  clearSearch: () =>
    set({
      folderData: get().originalFolderData,
      isSearching: false,
      searchError: null,
    }),

  getNewDocumentTemplates: async (userGroup = "L1_FOUS") => {
    const setNewDocumentTemplates = get().setNewDocumentTemplates;
    try {
      const res = await fetchNewDocumentTemplates(userGroup);
      if (res.status === "Success") {
        setNewDocumentTemplates(res.templates);
      }
    } catch (error) {
      console.error("error fetching templates:", error);
    }
  },

  setOriginalFolders: (folders) => set({ originalFolderData: folders }),
}));

export default useFrontOfficeStore;
