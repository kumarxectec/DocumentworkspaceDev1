// lib/api.js
import axios from "axios";
import useStore from "@/store/useStore";
import { fileToBase64 } from "@/lib/constants";

// Axios Instances
const getApiInstance = () => {
  const { configs } = useStore.getState();
  return axios.create({
    baseURL: configs?.NEXT_PUBLIC_DFX_API_BASE_URL || "",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
};

const getApi2Instance = () => {
  const { configs } = useStore.getState();
  return axios.create({
    baseURL: configs?.NEXT_PUBLIC_DFX_API_UI_BASE_URL || "",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
};

const getApi3Instance = () => {
  const { configs } = useStore.getState();
  return axios.create({
    baseURL: configs?.NEXT_PUBLIC_DFX_API_CLIENT_FOLDER_BASE_URL || "",
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
};

const getRepoName = () => {
  const { configs } = useStore.getState();
  return configs?.NEXT_PUBLIC_REPOSITORY_NAME || "";
};

// ------------------ API FUNCTIONS ------------------

export const fetchUser = () => {
  const { configs } = useStore.getState();
  const api = getApiInstance();
  return api.get(configs?.FETCH_USER_SERVICE_ENDPOINT || "App/User");
};

export const fetchUserSecurityGroup = () => {
  const { configs } = useStore.getState();
  const api = getApiInstance();
  return api.get(configs?.FETCH_USER_SECURITY_GROUP_SERVICE_ENDPOINT || "/App/User/GroupsForUI");
};

export const fetchDocumentData = (documentId) => {
  const { configs } = useStore.getState();
  const api = getApiInstance();
  const REPO_NAME = getRepoName();
  return api.post(`${configs?.FETCH_DOCUMENT_DATA_SERVICE_ENDPOINT}/${REPO_NAME}/${documentId}`);
};

export const fetchDocumentsList = (ids = [], ColumnDetailMasterID) => {
  const { configs } = useStore.getState();
  const api = getApiInstance();
  const REPO_NAME = getRepoName();

  const payload = {
    Repository: REPO_NAME,
    Columns: [[{
      SearchFieldType: 0,
      BaseField: "ID",
      Value: ids.join(","),
      Condition: 0,
    }]],
    Page: 1,
    No: 25,
    ColumnSortType: 1,
    ColumnName: "CreationDateTime",
    ColumnSortOrder: 0,
    AllData: false,
    CacheId: "50TVwyv3ef",
    DeletedFiles: false,
  };

  return api.post(`${configs?.FETCH_DOCUMENT_LIST_SERVICE_ENDPOINT}/${ColumnDetailMasterID}`, payload);
};

export const fetchTabsList = (id) => {
  const { configs } = useStore.getState();
  const api2 = getApi2Instance();
  return api2.get(`${configs?.FETCH_TABS_LIST_SERVICE_ENDPOINT}?DashboarId=${id}`);
};



export const uploadFiles = async (files, startAiChat) => {
  const { configs } = useStore.getState();
  const api = getApiInstance();
  const REPO_NAME = getRepoName();
  const filePromises = files.map((file) => fileToBase64(file));

  try {
    const base64Files = await Promise.all(filePromises);
    const fileData = base64Files.map((base64Data, index) => ({
      File: files[index].name,
      LocalFile: "",
      Filename: "",
      SecCode: "",
      Data: base64Data,
      VolumeID: -1,
      IsNew: false,
    }));

    const payload = {
      Repository: REPO_NAME,
      Files: fileData,
      EnableAI: startAiChat ? "Y" : "N"
    };

    const response = await api.post(configs?.UPLOAD_FILES_SERVICE_ENDPOINT, payload);
    console.log(response, "this is in API");
    return response;
  } catch (error) {
    console.error(error);
    return new Error(error.message || "Something went wrong");
  }
};

export const uploadFilesToClientFolder = async (payload, endpoint) => {
  const api = getApiInstance();
  try {
    const response = await api.post(endpoint, payload);
    console.log("Upload successful:", response);
    return response;
  } catch (error) {
    console.error("Upload error:", error);
    return new Error(error.message || "Something went wrong");
  }
};


export const fetchWorkspaceCollections = () => {
  const { configs } = useStore.getState();
  const api = getApi3Instance();
  return api.get(configs?.FETCH_WORKSPACE_COLLECTION_SERVICE_ENDPOINT);
};

export const saveWorkSpaceCollection = async (payload) => {
  const { configs } = useStore.getState();
  const api = getApi3Instance();
  try {
    const res = await api.post(configs?.SAVE_NEW_WORKSPACE_COLLECTION_SERVICE_ENDPOINT, payload);
    console.log(res, "workspace save method res");
    return res;
  } catch (error) {
    console.error(error);
    return new Error(error.message || "something went wrong");
  }
};

export const fetchClientFolders = async ({ search = "%", page = 1 }) => {
  const { configs } = useStore.getState();
  const api = getApi3Instance();
  const REPO_NAME = getRepoName();
  const encodedSearch = encodeURIComponent(search);
  console.log(encodedSearch, 'search parama')

  const url = `${configs?.FETCH_CLIENT_FOLDER_LIST_SERVICE_ENDPOINT}&search=${encodedSearch}&page=${page}`;

  console.log("🔁 Fetching folders:", api.defaults.baseURL + url);

  return api.get(url)
    .then((res) => res.data)
    .catch((err) => {
      console.error("❌ Error fetching folders:", err);
      throw err;
    });
};

export const fetchFolderTree = (rawPath = "") => {
  const { configs } = useStore.getState();
  const api = getApi3Instance();
  const REPO_NAME = getRepoName();

  // Clean the path:
  const cleanPath = rawPath
    .replace(/\\\\/g, "\\") // Convert double backslashes to single
    .replace(/\s+$/g, "")   // Trim trailing whitespace
    .replace(/\\+$/, ""); // Ensure exactly one trailing slash

  const payload = {
    profileId: 0,
    isVirtual: true,
    clientId: "string",
    clientName: "string",
    parentFolder:
      cleanPath ||
      '',
    repository: REPO_NAME,
    allData: true,
    page: 0,
    start: 0,
    listType: "string",
    listField: "string",
    documentTypes: "string",
    includeSubFolder: true,
    fileName: "string",
    searchText: "string",
  };

  return api.post(configs?.FETCH_FOLDER_DATA_SERVICE_ENDPOINT, payload);
};
// #region Fetch Full folder
export const fetchFullFolderTree = (rawPath = "") => {
  const { configs } = useStore.getState();
  const api = getApi3Instance();
  const REPO_NAME = getRepoName();

  // Clean the path:
  const cleanPath = rawPath
    .replace(/\\\\/g, "\\") // Convert double backslashes to single
    .replace(/\s+$/g, "")   // Trim trailing whitespace
    .replace(/\\+$/, ""); // Ensure exactly one trailing slash

  const payload = {
    profileId: 0,
    isVirtual: true,
    clientId: "",
    clientName: "",
    parentFolder:
      cleanPath ||
      '',
    repository: REPO_NAME,
    allData: true,
    page: 0,
    start: 0,
    listType: "",
    listField: "",
    documentTypes: "",
    includeSubFolder: true,
    fileName: "",
    searchText: "",
  };

  return api.post(configs?.FETCH_FULL_FOLDER_DATA_SERVICE_ENDPOINT, payload);
};

export const fetchFrontOfficeTabs = async () => {
   const { configs } = useStore.getState();
   const api = getApi2Instance();
   const url = configs?.FETCH_FRONT_OFFICE_TABS

  return api.post(url)
  .then((res) => res.data)
  .catch((err) => {
    console.error("Error fetching front office tabs:", err)
    throw err
  });
}

export const fetchFrontOfficeFolders = async (folderType, path) => {
  try {
    const { configs } = useStore.getState();
    const api = getApi2Instance();

    if (!configs?.FETCH_FRONT_OFFICE_FOLDERS) {
      throw new Error("FETCH_FRONT_OFFICE_FOLDERS URL is not defined in configs");
    }

    const url = configs.FETCH_FRONT_OFFICE_FOLDERS;

    const payload = {
      folderType,
      path,
    };

    const response = await api.post(url, payload);
    return response.data;
  } catch (err) {
    console.error("❌ Error fetching front office folders:", err);
    throw err;
  }
};

export const fetchFOClientsList = async () => {
  try{
    const { configs } = useStore.getState();
    const api = getApi2Instance();

    if(!configs.FETCH_FRONT_OFFICE_CLIENTS_LIST){
      throw new Error("FETCH_FRONT_OFFICE_CLIENTS_LIST is not defined in configs")
    }

    const url = configs.FETCH_FRONT_OFFICE_CLIENTS_LIST;

    const res = api.get(url);
    return res
  } catch (err) {
    console.error("Error fetching front office clients list:", err);
    throw err ;
  }
}

export const fetchFOClientLawMetadata = async () => {
  try{
    const { configs } = useStore.getState();
    const api = getApi2Instance();

    if(!configs.FETCH_FRONT_OFFICE_LAW_METADATA){
      throw new Error("FETCH_FRONT_OFFICE_LAW_METADATA is not defined in configs")
    }

    const url = configs.FETCH_FRONT_OFFICE_LAW_METADATA;

    const res = api.get(url);
    return res
  } catch (err) {
    console.error("Error fetching front office clients law metadata:", err);
    throw err ;
  }
}

export const uploadFilesToActiveClientFolder = async (files, folder, properties) => {
  const { configs } = useStore.getState();
  const api = getApiInstance();
  const REPO_NAME = getRepoName();
  const filePromises = files.map((file) => fileToBase64(file));

  try {
    const base64Files = await Promise.all(filePromises);
    const fileData = base64Files.map((base64Data, index) => ({
      FromID: "",
      CopyFromTemplate: "",
      File: files[index].name,
      Actions: properties,
      FolderProperties: folder,
      ClientType: 1,
      Properties: [],
      LocalFile: "",
      Filename: "",
      SecCode: "",
      Tags: [],
      Data: base64Data,
      VolumeID: -1,
      IsNew: true,
      Folder: "",
      TemplateName: "",
    }));

    const payload = {
      Repository: REPO_NAME,
      Files: fileData,
      // EnableAI: startAiChat ? "Y" : "N",
      CreateTemplate: "N",
      WithVirtualFolder: 'Y',
      VirtualFolder: folder || ""
    };

    console.log("Final payload:", payload);
    const response = await api.post(configs?.UPLOAD_TO_CLIENT_FOLDER_SERVICE_ENDPOINT, payload);
    console.log("Upload successful:", response);
    return response;
  } catch (error) {
    console.error("Upload error:", error);
    return new Error(error.message || "Something went wrong");
  }
};

export const uploadNewFilesToActiveClientFolder = async (payload) => {
  const { configs } = useStore.getState();
  const api = getApiInstance();
  const REPO_NAME = getRepoName();
  
  console.log('📦 Upload payload received:', payload);

  try {
    const { uploadType, files, folder, properties } = payload;

    let fileData = [];

    // Build file data based on upload type
    switch (uploadType) {
      case 'local':
        // Regular file upload with base64 content
        fileData = files.map((file) => ({
          FromID: "",
          CopyFromTemplate: "N",
          Actions: JSON.stringify(properties) || {},
          FolderProperties: JSON.stringify(folder) || {},
          ClientType: 1,
          Folder: "",
          File: file.name,
          LocalFile: "",
          IsNew: false,
          Filename: file.name,
          SecCode: "",
          TemplateName: "",
          Properties: [],
          Tags: [],
          Data: file.content, // base64 content already prepared in store
          VolumeID: -1,
          Clients: [],
          EntityId: "",
        }));
        break;

      case 'blank':
        // Blank document creation
        fileData = files.map((file) => ({
          FromID: "",
          CopyFromTemplate: "N",
          Actions: JSON.stringify(properties) || {},
          FolderProperties: JSON.stringify(folder) || {},
          ClientType: 1,
          Folder: "",
          File: `${file.name}.${file.extension}`,
          LocalFile: "",
          IsNew: true,
          Filename: `${file.name}.${file.extension}`,
          SecCode: "",
          TemplateName: "",
          Properties: [],
          Tags: [],
          Data: "", // Empty data for new blank doc
          VolumeID: -1,
          Clients: [],
          EntityId: "",
        }));
        break;

      case 'template':
        // Template-based document creation
        fileData = files.map((file) => ({
          FromID: file.templateId || "",
          CopyFromTemplate: "Y",
          Actions: JSON.stringify(properties) || {},
          FolderProperties: JSON.stringify(folder) || {},
          ClientType: 1,
          Folder: "",
          File: `${file.name}.${file.extension}`,
          LocalFile: "",
          IsNew: true,
          Filename: `${file.name}.${file.extension}`,
          SecCode: "",
          TemplateName: file.name,
          Properties: [],
          Tags: [],
          Data: "", // Empty data for template copy
          VolumeID: -1,
          Clients: [],
          EntityId: "",
        }));
        break;

      default:
        throw new Error(`Invalid upload type: ${uploadType}`);
    }

    // Build final request payload
    const requestPayload = {
      Repository: REPO_NAME,
      Files: fileData,
      CreateTemplate: uploadType === 'blank' || uploadType === 'template' ? "Y" : "N",
      WithVirtualFolder: "Y",
      VirtualFolder: folder.fullPath || folder || "",
    };

    console.log(`📤 Uploading ${uploadType} files:`, requestPayload);

    const response = await api.post(
      configs?.UPLOAD_TO_CLIENT_FOLDER_SERVICE_ENDPOINT,
      requestPayload
    );

    console.log("✅ Upload successful:", response);
    return response;

  } catch (error) {
    console.error("❌ Upload error:", error);
    throw new Error(error.message || "Something went wrong");
  }
};


export const deleteFolder = async (folderType, folderId) => {
  try{
    const { configs } = useStore.getState();
    const api = getApi2Instance();
    if(!configs?.DELETE_FOLDER_SERVICE_ENDPOINT){
      throw new Error("DELETE_FOLDER_SERVICE_ENDPOINT URL is not defined in configs");
    }

    const url = configs.DELETE_FOLDER_SERVICE_ENDPOINT;

    const response = await api.delete(`${url}?FolderName=${folderId}&FolderType=${folderType}`);

    return response.data
  }catch (error){
    console.error("Error deleting folder:", error);
    throw error;
  }
};


export const addFolder = async (payload) => {
  try{
    const { configs } = useStore.getState();
    const api = getApi2Instance();
    
    if(!configs?.UPSERT_FOLDER_SERVICE_ENDPOINT){
      throw new Error("UPSERT_FOLDER_SERVICE_ENDPOINT URL is not defined in configs");
    }

    const url = configs.UPSERT_FOLDER_SERVICE_ENDPOINT;

    const response = await api.post(url, payload)
    return response.data
  }catch(error){
    console.error("Error upserting folder:", error);
    throw error;
  }
}

export const updateFolderName = async (formValues, payload) => {
  try{
    const { configs } = useStore.getState();
    const api = getApi2Instance();
    
    if(!configs?.UPSERT_FOLDER_SERVICE_ENDPOINT){
      throw new Error("UPSERT_FOLDER_SERVICE_ENDPOINT URL is not defined in configs");
    }

    const url = `${configs.RENAME_FOLDER_SERVICE_ENDPOINT}?RenameFolder=${formValues?.name}&FolderType=${[payload?.folderType]}`;

    const response = await api.post(url, payload)
    return response.data
  }catch(error){
    console.error("Error upserting folder:", error);
    throw error;
  }
}

export const searchFolder = async (folderType, searchQuery) => {
  try {
    const { configs } = useStore.getState();
    const api = getApi2Instance();

    if (!configs?.SEARCH_FOLDER_SERVICE_ENDPOINT) {
      throw new Error("SEARCH_FOLDER_SERVICE_ENDPOINT URL is not defined in configs");
    }

    const url = `${configs.SEARCH_FOLDER_SERVICE_ENDPOINT}?SearchText=${encodeURIComponent(searchQuery)}&FolderType=${folderType}`;
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    console.error("Error searching folder:", error);
    throw error;
  }
};

export const fetchNewDocumentTemplates = async (userGroup) => {
  try{
    const { configs } = useStore.getState();
    const api = getApi2Instance();

    if(!configs?.FETCH_NEW_DOCUMENT_TEMPLATES){
      throw new Error("FETCH_NEW_DOCUMENT_TEMPLATES URL is not defined in configs");
    }

    const url = `${configs?.FETCH_NEW_DOCUMENT_TEMPLATES}?userGroup=${userGroup}`;
    const response = await api.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
}

export const fetchFolderClientName = async (clientName) => {
  const { configs } = useStore.getState();
   const api = getApi2Instance();
   const url = `${configs?.FETCH_FOLDER_CLIENT_NAME_ENDPOINT}?clientName=${clientName}`

  return api.get(url)
  .then((res) => res.data.clientNameLst)
  .catch((err) => {
    console.error("Error fetching client name:", err)
    throw err
  }); 
}

export const fetchFolderClientId = async (clientName) => {
  const { configs } = useStore.getState();
   const api = getApi2Instance();
   const url = `${configs?.FETCH_FOLDER_CLIENT_ID_ENDPOINT}?clientName=${clientName}`

  return api.get(url)
  .then((res) => res.data.clientIdLst)
  .catch((err) => {
    console.error("Error fetching client Id:", err)
    throw err
  }); 
}

export const fetchFolderDocumentType = async (documentType) => {
  const { configs } = useStore.getState();
   const api = getApi2Instance();
   const url = `${configs?.FETCH_FOLDER_DOCUMENT_TYPE_ENDPOINT}?documentType=${documentType}`

  return api.get(url)
  .then((res) => res.data.documentTypeLst)
  .catch((err) => {
    console.error("Error fetching folder document type:", err)
    throw err
  }); 
}

export const fetchFolderDocumentSubType = async (documentSubType) => {
  const { configs } = useStore.getState();
   const api = getApi2Instance();
   const url = `${configs?.FETCH_FOLDER_DOCUMENT_SUBTYPE_ENDPOINT}?documentSubType=${documentSubType}`

  return api.get(url)
  .then((res) => res.data.documentSubTypeLst)
  .catch((err) => {
    console.error("Error fetching folder document Subtype:", err)
    throw err
  }); 
}
