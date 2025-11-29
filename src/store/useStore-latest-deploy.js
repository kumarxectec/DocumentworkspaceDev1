// store/useStore.js
import { create } from "zustand";
import {
  getMockCollections,
  getMockTabsResponse,
  getMockUploadDocumentResponse,
  mockTabsData,
  getMockClientFolderResponse,
  getMockClientFolderList,
  mockFolderTreeResponse,
  mockClientFolderDocumentUploadResponse,
  errorToastObj,
  fileToBase64,
} from "@/lib/constants";
import {
  fetchUser,
  fetchDocumentData,
  fetchDocumentsList,
  fetchTabsList,
  uploadFiles,
  saveWorkSpaceCollection,
  fetchWorkspaceCollections,
  fetchFolderContents,
  fetchClientFolders,
  fetchFolderTree,
  uploadFilesToClientFolder,
  fetchUserSecurityGroup,
  pasteDocumentPath,
} from "@/services/api";
import { devtools, persist } from "zustand/middleware";
import { toast } from "sonner";

const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        securityGroup: null,
        configs: {},
        apiError: null,
        loading: true,
        dashboardId: null,

        //tabs
        tabsList: null,
        selectedTabs: { options: [] },


        setSelectedTabs: (tabs) => set({ selectedTabs: tabs }),

        //documents
        documentsList: null,
        selectedDocumentId: null,
        documentData: null,
        selectedDocument: null,
        aiPrompt: null,
        setAiPrompt: (value) => set({ aiPrompt: value }),
        setSelectedDocument: (value) => set({ selectedDocument: value }),

        //UI ( dialogs and sidebar )
        isAddSourceDialogOpen: false,
        isUploadDocumentDialogOpen: false,
        isDeleteCollectionDialogOpen: false,
        isEditCollectionDialogOpen: false,
        isSourcesDialogOpen: false,
        isCollapsed: false,
        isUploadable: false,

        //collections ( existing collection / new collection )
        collections: [],
        selectedCollection: null,
        newCollectionName: "",
        showNewCollectionInput: false,



        //tags (search doc ID tags)
        tags: [],
        collectionTags: [],

        //drag-and-drop
        uploadedFiles: [],
        activeTab: "upload", // state of client-folder-upload-tab
        setActiveTab: (value) => set({ activeTab: value }), // state of client-folder-upload-tab

        //folder
        clientFolderOptions: [],
        clientFolderPage: 1,
        hasMoreClientFolders: true,
        clientFolderSearch: "",
        isClientFolderLoading: false,
        selectedFolder: null,
        documentWorkspaceTemplatesResponse: null,
        folderTemplatesList: null,
        selectedFolderTemplates: null,
        selectedUploadFolder: null,
        showClientDropdown: false,
        fileDocumentTitles: {},
        setShowClientDropdown: (value) => set({ showClientDropdown: value }),

        setFileDocumentTitle: (fileName, value) => {
          set((state) => ({
            fileDocumentTitles: {
              ...state.fileDocumentTitles,
              [fileName]: value,
            },
          }));
        },

        setFileDocumentTitles: (titles) => set({ fileDocumentTitles: titles }),

        resetFileDocumentTitles: () => {
          set({ fileDocumentTitles: {} });
        },

        selectedFolderNode: null,
        setSelectedFolderNode: (folder) => set({ selectedFolderNode: folder }),
        selectedClient: null,
        setSelectedClient: (client) => set({ selectedClient: client  }),
        setIsClientFolderLoading: (status) => set({ isClientFolderLoading: status }),
        setSelectedFolder: (folder) => set({ selectedFolder: folder }),
        setFolderTemplatesList: (templatesList) => set({ folderTemplatesList: templatesList }),
        setSelectedFolderTemplates: (templates) => set({ selectedFolderTemplates: templates }),
        folderLoading: {}, // map of path -> true/false
        setFolderLoading: (path, isLoading) =>
          set((state) => ({
            folderLoading: {
              ...state.folderLoading,
              [path]: isLoading,
            },
          })),
        selectedClientFolder: null,
        setSelectedClientFolder: (folder) =>
          set({ selectedClientFolder: folder }),



        // Setters
        setIsUploadable: (value) => set({ isUploadable: value }),
        uploadedViaAddSource: false,
        setUploadedViaAddSource: (value) =>
          set({ uploadedViaAddSource: value }),

        uploadSource: null,
     
        selectedDocumentId: null,
        collectionTabClosed: false,
        selectedTabs: { options: [] },

        setUploadSource: (value) => set({ uploadSource: value }),
        setUser: (user) => set({ user }),
        setSecurityGroup: (value) => set({ securityGroup: value }),
        clearUser: () => set({ user: null }),
        setConfigs: (data) => set({ configs: data }),
        setDashboardId: (id) => set({ dashboardId: id }),
        setCollectionTabClosed: (value) => set({ collectionTabClosed: value }),
        setSelectedTabs: (tabs) => set({ selectedTabs: tabs }),
        clearDocumentsList: () => set({ documentsList: [] }),
        setAddSourceDialog: (value) => set({ isAddSourceDialogOpen: value }),
        setUploadDocumentDialog: (value) =>
          set({ isUploadDocumentDialogOpen: value }),
        setDeleteCollectionDialog: (value) =>
          set({ isDeleteCollectionDialogOpen: value }),
        setEditCollectionDialog: (value) =>
          set({ isEditCollectionDialogOpen: value }),
        setIsSourcesDialogOpen: (value) => set({ isSourcesDialogOpen: value }),

        setTags: (values) => set({ tags: values }),
        setCollectionTags: (values) => set({ collectionTags: values }),

        sortCollections: (collections, isSorted) => {
          const updatedCollections = isSorted
            ? [...collections].sort((a, b) =>
              b.workspaceName.localeCompare(a.workspaceName)
            )
            : [...collections].sort((a, b) =>
              a.workspaceName.localeCompare(b.workspaceName)
            );

          set(() => ({ collections: updatedCollections }));
        },

        setSelectedCollection: (value) => set({ selectedCollection: value }),
        setNewCollectionName: (value) => set({ newCollectionName: value }),
        setShowNewCollectionInput: (value) =>
          set({ showNewCollectionInput: value, collectionTags: [] }),

        setUploadedFiles: (values) => set({ uploadedFiles: values }),

        setIsCollapsed: (value) =>
          set((state) => {
            let updatedTabs = { ...state.selectedTabs };

            if (!value && updatedTabs.options.length >= 3) {
              updatedTabs.options = updatedTabs.options.filter(
                (tab) => tab.name !== "Chat"
              );
            } else if (value && updatedTabs.options.length >= 3) {
              updatedTabs.options = mockTabsData;
            }

            return {
              isCollapsed: value,
              selectedTabs: updatedTabs,
            };
          }),

        toggleItem: (category, item) =>
          set((state) => {
            const categoryItems = state.selectedTabs[category] || [];
            const updatedItems = categoryItems.some((i) => i.id === item.id)
              ? categoryItems.filter((i) => i.id !== item.id)
              : [...categoryItems, item];

            const shouldCollapse =
              updatedItems.length === 3 ? true : state.isCollapsed;

            return {
              selectedTabs: {
                ...state.selectedTabs,
                [category]: updatedItems,
              },
              isCollapsed: shouldCollapse,
            };
          }),










        // API Calls
        fetchUser: async () => {
          set({ loading: true, apiError: null });

          try {
            const res = await fetchUser();
            set({ user: res.data, loading: false });
          } catch (err) {
            set({ user: null, loading: false, apiError: err.message });
          }
        },

        fetchSecurityGroup: async () => {
          set({ loading: true, apiError: null });
          const setSecurityGroup = get().setSecurityGroup

          try {
            const res = await fetchUserSecurityGroup();
            setSecurityGroup(res?.data.Groups)
          } catch (err) {
            setSecurityGroup(null)
            set({ loading: false, apiError: err.message });
          }
        },

        clearDocumentSelection: async () => {
          const { selectedTabs } = get();

          // Keep ClientUpload tab if it exists
          const clientUploadTab = selectedTabs?.options?.find(t => t.name === "ClientUpload");

          await set({
            selectedDocumentId: null,
            documentData: null,
            apiError: null,
            isCollapsed: true,
            selectedTabs: {
              options: clientUploadTab ? [clientUploadTab] : []
            },
          });
        },

        setSelectedDocumentId: async (id) => {
          const {
            tabsList,
            selectedFolder,
            selectedClientFolder,
            selectedDocumentId,
            clearDocumentSelection,
            selectedTabs,
            setSelectedDocument,
            selectedDocument
          } = get();

          // Check if we're in client folder mode
          const isClientMode = selectedFolder || selectedClientFolder;
          const clientUploadTab = selectedTabs.options.find(t => t.name === "ClientUpload");
          const clientMetadataTab = selectedTabs.options.find(t => t.name === "Client Metadata");

          // Only get "Metadata" tab if we're in normal mode
          const normalMetadataTab = !isClientMode
            ? selectedTabs.options.find(t => t.name === "Metadata")
            : null;

          // CASE 1: If the same document is selected again — unselect it
          if (selectedDocumentId === id && !isClientMode) {
            await clearDocumentSelection();
            return;
          }

          // Preserve client-related tabs (always)
          const preservedTabs = [];
          if (clientUploadTab) preservedTabs.push(clientUploadTab);
          if (clientMetadataTab) preservedTabs.push(clientMetadataTab);

          // CASE 2: New document selected
          await set({
            selectedDocumentId: id,
            documentData: null,
            apiError: null,
            isCollapsed: !isClientMode,
            selectedTabs: { options: preservedTabs }
          });

          // In client mode: update the "Client Metadata" tab URL
          console.log(isClientMode, 'checking mode in store')
          if (isClientMode && clientMetadataTab) {
            const updatedMetadataTab = {
              ...clientMetadataTab,
              url: `https://10.115.14.14/DFXDMSLite/dfxweb/Email/Mailproperty?readonlyflag=1&newfile=ikfvcn.dat&showallmenu=true&showpreview=true&documentai=true&application=dfxsearch&activetab=documentai&repository=stonehage&id=${id}`
            };

            set({
              selectedTabs: {
                options: [
                  ...preservedTabs.filter(t => t.name !== "Client Metadata"),
                  updatedMetadataTab
                ]
              }
            });
          }

          // Normal mode: show Preview + Chat + (persist Metadata tab if it existed)

          else if (!isClientMode) {
            set(() => {
              const previousTabs = selectedTabs?.options || [];

              // Only preserve previous tabs if they are Preview, Metadata, or Chat
              const preservedTabs = previousTabs.filter(tab =>
                ["Preview", "Metadata", "Chat"].includes(tab.name)
              );

              // Check if Metadata already exists
              const hasMetadata = preservedTabs.some(tab => tab.name === "Metadata");

              // Tabs to add for the new document
              const newTabs = (tabsList || []).filter(tab => tab.name === "Preview" || tab.name === "Chat"
              );

              // Include normalMetadataTab if not already present
              if (normalMetadataTab && !hasMetadata) {
                newTabs.push(normalMetadataTab);
              }

              // Merge preservedTabs + newTabs
              const mergedTabs = [...preservedTabs, ...newTabs];

              // Remove duplicates by tab.name
              const uniqueTabs = mergedTabs.filter(
                (tab, index, self) => index === self.findIndex(t => t.name === tab.name)
              );

              return {
                selectedTabs: {
                  options: uniqueTabs
                }
              };
            });
          }


          // Fetch document data
          try {
            const res = await fetchDocumentData(id);
            set({ documentData: res.data });
          } catch (err) {
            set({ apiError: err.message });
          }
        },



        collectionTabClosed: false,
        clientMetaTabClosed: false,

        setCollectionTabClosed: (val) => set({ collectionTabClosed: val }),
        setClientMetaTabClosed: (val) => set({ clientMetaTabClosed: val }),
        setDocumentsList: async (ids = [], columnDetailMasterId) => {
          set({ documentsList: null, apiError: null });

          if (!ids?.length) {
            set({ apiError: "IDs are required" });
            return;
          }

          try {
            const res = await fetchDocumentsList(ids, columnDetailMasterId);
            set({
              selectedDocumentId: null,
              selectedTabs: { options: [] },
              documentsList: res.data.Documents,
              isCollapsed: true,
            });
            return res;
          } catch (err) {
            set({ apiError: err.message });
          }
        },

        clearDocumentsList: () => set({ documentsList: [] }),

        fetchTabsListForDashboard: async () => {
          set({ tabsList: null, apiError: null });

          const dashboardId = get().dashboardId;

          if (!dashboardId) {
            set({ apiError: "Dashboard ID is required" });
            return;
          }

          try {
            const res = await fetchTabsList(dashboardId);
            // const res = await getMockTabsResponse();
            set({ tabsList: res?.data.dashboardPageColumn, documentWorkspaceTemplatesResponse: res?.data.templates });
            console.log(tabsList);
          } catch (err) {
            set({ apiError: err.message });
          }
        },

        uploadFilesFromDnD: async (files, startAiChat) => {
          set({ documentsList: null, apiError: null });
          if (files.length != 0) {
            try {
              const res = await uploadFiles(files, startAiChat);
              // const res = await getMockUploadDocumentResponse();
              console.log(res?.data.DocumentList, "pppppppppppppppppppp");
              set({ documentsList: res?.data.DocumentList });
              return res;
            } catch (error) {
              set({ apiError: error.message });
            }
          }
        },

        pasteDocumentMainPath: async (payload) => {
           try {
              const res = await pasteDocumentPath(payload);
              console.log(res, "paste response");
              return res;
            } catch (error) {
              set({ apiError: error.message });
            }
        },

        getWorkspaceCollections: async () => {
          set({ collections: [], apiError: null });

          try {
            //  const res = getMockCollections();
            const res = await fetchWorkspaceCollections();
            console.log(res, "from fetchWorkspace");
            set({ collections: res?.data.workspaces });
            return res?.data.workspaces;
          } catch (error) {
            set({ apiError: error.message });
          }
        },

        saveWorkSpaceCollection: async (
          tags,
          workspaceId,
          workspaceName,
          isNew,
          userId,
          workSpace
        ) => {
          set({ apiError: null });

          const newInputTags = get().tags;
          const collectionTags = get().collectionTags;
          const getWorkspaceCollections = get().getWorkspaceCollections;

          const updatedExistingWorkspaceDocuments = workSpace?.documents.map(
            (doc) => {
              if (!collectionTags.includes(doc.documentID)) {
                return { ...doc, status: "I" };
              }
              return doc;
            }
          );

          const NewDocuments = newInputTags?.map((tag, index) => {
            return {
              id: -1,
              workspaceId: -1,
              status: "A",
              documentID: tag,
              // createdOn: "2025-05-28T20:36:40.327Z",
              // modifiedOn: "2025-05-28T20:36:40.327Z",
            };
          });

          const payload = {
            id: isNew ? -1 : workSpace.id,
            workspaceName: workspaceName,
            userId: userId,
            status: "A",
            // createdOn: "2025-05-28T20:36:40.327Z",
            // modifiedOn: "2025-05-28T20:36:40.327Z",
            documents: isNew
              ? NewDocuments
              : [...updatedExistingWorkspaceDocuments, ...NewDocuments],
          };

          try {
            const res = await saveWorkSpaceCollection(payload);
            await getWorkspaceCollections();
            console.log(payload, "this is sample payload of workspace");
            return;
          } catch (error) { }
        },

        deleteWorkSpaceCollection: async (workSpace) => {
          set({ apiError: null });

          const getWorkspaceCollections = get().getWorkspaceCollections;

          const payload = { ...workSpace, status: "I" };

          try {
            const res = await saveWorkSpaceCollection(payload);
            await getWorkspaceCollections();
            console.log(payload, "delete payload");
            return;
          } catch (error) { }
        },

        updateWorkSpaceCollection: async (newName, workSpace) => {
          set({ apiError: null });
          const getWorkspaceCollections = get().getWorkspaceCollections;
          const payload = { ...workSpace, workspaceName: newName };

          try {
            await saveWorkSpaceCollection(payload);
            await getWorkspaceCollections();
            console.log(payload, "edit payload");

            return;
          } catch (err) { }
        },

        saveUploadedFilesToCollection: async (
          ids,
          workspaceId,
          workspaceName,
          isNew,
          userId,
          WorkSpace
        ) => {
          set({ apiError: null });
          const getWorkspaceCollections = get().getWorkspaceCollections;

          const uploadedDocuments = ids?.map((id) => {
            return {
              id: -1,
              workspaceId: isNew ? -1 : workspaceId,
              status: "A",
              documentID: id,
              // createdOn: "2025-05-28T20:36:40.327Z",
              // modifiedOn: "2025-05-28T20:36:40.327Z"
            };
          });

          const payload = {
            id: isNew ? -1 : workspaceId,
            workspaceName: workspaceName,
            userId: userId,
            status: "A",
            // createdOn: "2025-05-28T20:36:40.327Z",
            // modifiedOn: "2025-05-28T20:36:40.327Z",
            documents: uploadedDocuments,
          };

          try {
            const res = await saveWorkSpaceCollection(payload);
            await getWorkspaceCollections();
            console.log(
              payload,
              "this is sample payload of upload documents save collection"
            );
            return;
          } catch (error) { }
        },


        setSelectedTabs: (updater) =>
          set((state) => ({
            selectedTabs:
              typeof updater === "function"
                ? updater(state.selectedTabs)
                : updater,
          })),

        handleFolderClick: (folder) => {
          set({ selectedFolder: folder });
        },
        handleUploadFolderClick: (folder) => {
          set({ selectedUploadFolder: folder });
        },

        clearSelectedFolder: () => {
          set({ selectedFolder: null, selectedFolderTree: null, selectedClientFolder: null });
        },

        getClientFoldersList: async ({ search, page = 1, append = false }) => {
          try {
            set({ isClientFolderLoading: true });

            const res = await fetchClientFolders({ search, page });
            // const res = getMockClientFolderList;

            set((state) => ({
              clientFolderOptions: append
                ? [...state.clientFolderOptions, ...res.results]
                : res.results,
              hasMoreClientFolders: res.pagination?.more ?? false,
              clientFolderPage: page,
            }));
          } catch(error) {
            console.error("Error fetching client folders:", error);
            set({ clientFolderOptions: [] });
          } finally {
            set({ isClientFolderLoading: false });
          }
        },


        getFolderTreeByPath: async (path, includeSubfolders = false) => {
          const setFolderLoading = get().setFolderLoading;

          try {
            if (!path) throw new Error("Path required");
            console.log(path, '📂 path in getFolderTreeByPath');

            setFolderLoading(path, true);

            const { selectedFolderTree } = get();
            const folderData = await fetchFolderTree(path, includeSubfolders);
            // const folderData = mockFolderTreeResponse
            const folderFromApi = folderData?.data?.folder || folderData?.data;
            // const folderFromApi = folderData?.folder || folderData?.data;

            if (!folderFromApi || Object.keys(folderFromApi).length === 0) {
              toast.error("No Data Found!", errorToastObj);
              set({ selectedFolderTree: null });
              return;
            }

            // If we already have a tree, merge it with the new one
            if (selectedFolderTree && selectedFolderTree.folder) {
              const mergeFolders = (currentFolder, newFolder) => {
                if (currentFolder.path === newFolder.path) {
                  return {
                    ...currentFolder,
                    ...newFolder,
                    childFolder: newFolder?.childFolder || currentFolder?.childFolder || [],
                  };
                }

                if (currentFolder?.childFolder) {
                  return {
                    ...currentFolder,
                    childFolder: currentFolder.childFolder.map(child =>
                      mergeFolders(child, newFolder)
                    ),
                  };
                }

                return currentFolder;
              };

              const mergedTree = {
                ...selectedFolderTree,
                folder: mergeFolders(selectedFolderTree.folder, folderFromApi),
              };

              set({ selectedFolderTree: mergedTree });

            } else {
              // First time folder tree
              set({
                selectedFolderTree: {
                  folder: folderFromApi,
                },
              });


            }

            return folderData

          } catch (error) {
            console.error("❌ Error in getFolderTreeByPath:", error.message);
            set({ selectedFolderTree: null });
          } finally {
            setFolderLoading(path, false);
          }
        },

        getTemplatesOnFolderSelect: async (path, includeSubfolders = false) => {
          const setFolderLoading = get().setFolderLoading;

          try {
            if (!path) throw new Error("Path required");
            console.log(path, '📂 path in getTemplatesOnFolderSelect');

            const { selectedFolderTree } = get();
            const folderData = await fetchFolderTree(path, includeSubfolders);
            // const folderData = mockFolderTreeResponse
            const folderFromApi = folderData?.data?.folder || folderData?.data;
            // const folderFromApi = folderData?.folder || folderData?.data;

            if (!folderFromApi || Object.keys(folderFromApi).length === 0) {
              toast.error("No Data Found!", errorToastObj);
              set({ selectedFolderTree: null });
              return;
            }

            // // If we already have a tree, merge it with the new one
            // if (selectedFolderTree && selectedFolderTree.folder) {
            //   const mergeFolders = (currentFolder, newFolder) => {
            //     if (currentFolder.path === newFolder.path) {
            //       return {
            //         ...currentFolder,
            //         ...newFolder,
            //         childFolder: newFolder?.childFolder || currentFolder?.childFolder || [],
            //       };
            //     }

            //     if (currentFolder?.childFolder) {
            //       return {
            //         ...currentFolder,
            //         childFolder: currentFolder.childFolder.map(child =>
            //           mergeFolders(child, newFolder)
            //         ),
            //       };
            //     }

            //     return currentFolder;
            //   };

            //   const mergedTree = {
            //     ...selectedFolderTree,
            //     folder: mergeFolders(selectedFolderTree.folder, folderFromApi),
            //   };

            //   set({ selectedFolderTree: mergedTree });

            // } else {
            //   // First time folder tree
            //   set({
            //     selectedFolderTree: {
            //       folder: folderFromApi,
            //     },
            //   });
            // }

            console.log(folderData, 'folderdata in getTemplatesOnFolderSelect')


          } catch (error) {
            console.error("❌ Error in getFolderTreeByPath:", error.message);
            set({ selectedFolderTree: null });
          } finally {
            setFolderLoading(path, false);
          }
        },

        updateFolderChildren: (folderPath, children) => {
          const findAndupdateFolder = (folder) => {
            if (folder.path === folderPath) {
              return { ...folder, childFolder: children };
            }
            if (folder?.childFolder) {
              return {
                ...folder,
                childFolder: folder?.childFolder.map(findAndupdateFolder),
              };
            }
            return folder;
          };

          set((state) => ({
            selectedFolderTree: state.selectedFolderTree
              ? {
                ...state.selectedFolderTree,
                folder: findAndupdateFolder(state.selectedFolderTree.folder),
              }
              : null,
          }));
        },

        uploadInProgressFilesFromDnD: async (files, folder, startAiChat, documentTitles) => {
        set({ documentsList: null, apiError: null });
        const selectedFolderTemplates = get().selectedFolderTemplates;
        const { configs } = get();

        console.log(folder, documentTitles, "folder in upload func in storeeeeeeeeeeee");

        const getRepoName = () => {
          const { configs } = useStore.getState();
          return configs?.NEXT_PUBLIC_REPOSITORY_NAME || "";
        };
        const REPO_NAME = getRepoName();

        if (files.length !== 0) {
          try {
            const filePromises = files.map((file) => fileToBase64(file));
            const base64Files = await Promise.all(filePromises);

            const fileData = base64Files.map((base64Data, index) => {
              const fileName = files[index].name;
              const title = documentTitles?.[fileName] || ""; // match document title if exists

              return {
                FromID: "",
                CopyFromTemplate: "",
                Actions: JSON.stringify({}), // required object
                FolderProperties: JSON.stringify({}), // required object
                ClientType: 1,
                Folder: folder || "",
                File: fileName,
                LocalFile: "",
                IsNew: false,
                Filename: fileName,
                SecCode: "",
                TemplateName: selectedFolderTemplates || "",
                Properties: [], // array of property objects if available
                Tags: [], // array of tags if available
                Data: base64Data,
                VolumeID: -1,
                Clients: [], // required array
                EntityId: "",
                DocumentTitle: title, // ✅ added title inside each file
              };
            });

            const payload = {
              Repository: REPO_NAME,
              Files: fileData, // now each file contains its own DocumentTitle
              IsCreated: true,
              EnableAI: startAiChat ? "Y" : "N",
              CreateTemplate: "Y",
              WithVirtualFolder: "N",
              VirutalFolder: "", // spelling kept as in schema
            };

            console.log("Final payload (DnD):", payload);

            const res = await uploadFilesToClientFolder(
              payload,
              configs?.UPLOAD_TO_CLIENT_FOLDER_SERVICE_ENDPOINT
            );

            set({ documentsList: res?.data.DocumentList });
            return res;
          } catch (error) {
            console.error("error uploading to client folder", error);
            set({ apiError: error.message });
          }
        }
      },




      }),
      {
        name: "zustand-storage",
        partialize: (state) => ({}),
      }
    ),
    {
      name: "ZustandStore,",
    }
  )
);

export default useStore;
