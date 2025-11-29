"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableRow } from "../ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

import useStore from "@/store/useStore";
import {
  getFileIcon,
  getMockData,
  mockData,
  successToastObj,
} from "@/lib/constants";

import UploadDocument from "../uploadDocuments/upload-document";
import AddSource from "../addSource/add-source";
import { Checkbox } from "../ui/checkbox";
import {
  BookType,
  Copy,
  Delete,
  EllipsisVertical,
  FileText,
  Globe,
  PanelLeft,
  Plus,
  Trash,
  Upload,
  FolderPlus,
  CircleArrowUp,
  FolderOpen,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import Link from "next/link";
import SourcesDialog from "../sources/sources-dialog";
import ClientDropdown from "../clientFolder/select-clientfolder";
import { clientFolderOptions } from "@/lib/constants";
import FolderTree from "../clientFolder/folder-tree";
import FileDropper from "../file-dropper";
import UploadTab from "./upload-tab";

const DocumentSearchTab = ({ title, content, activeTab }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedAction, setSelectedAction] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFolderTree, setShowFolderTree] = useState(false);
  const [hasSelectedClient, setHasSelectedClient] = useState(false);
  const [showAddSourceButton, setShowAddSourceButton] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const menuRef = useRef(null);
  const plusButtonRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const selectAllRef = useRef(null);
  const [tooltipCopiedOrNot, setTooltipCopiedOrNot] = useState({});

  const LOCAL_STORAGE_KEY = "CopyData";
  // const [multiSelectedDocs,setMultiSelectedDocs]= useState([])

  const {
    selectedDocumentId,
    setSelectedDocumentId,
    toggleItem,
    setTags,
    setCollectionTags,
    documentsList,
    setUploadedFiles,
    isCollapsed,
    isSourcesDialogOpen,
    setIsSourcesDialogOpen,
    setIsCollapsed,
    configs,
    showClientDropdown,
    setShowClientDropdown,
    setDocumentsList,
    setSelectedCollection,
    setSelectedFolder,
      multiSelectedDocs, 
  setMultiSelectedDocs,  
    setSelectedClientFolder,
    setShowNewCollectionInput,
    setNewCollectionName,
    setSelectedDocument,
  } = useStore();

  const triggerUploadToMyDocuments = () => {
    const {
      setSelectedTabs,
      selectedTabs,
      setCollectionTabClosed,
      setUploadSource,
      isCollapsed,
      setDocumentsList,
      clearDocumentsList,
      setUploadedFiles,
      setSelectedCollection,
      setNewCollectionName,
      setShowNewCollectionInput,
      setSelectedFolderTemplates
    } = useStore.getState();

    const alreadySelected = selectedTabs?.options?.some(
      (tab) => tab.name === "UploadDocuments"
    );

    if (!alreadySelected) {
      setSelectedTabs({
        options: [
          { id: 9997, name: "UploadDocuments", seq: 1 },
        ],
      });
    }

    setUploadSource("myDocuments");
    setCollectionTabClosed(false);
    setShowClientDropdown(false);
    setShowFolderTree(false);
    setUploadedFiles([]);
    clearDocumentsList();
    setNewCollectionName('')
    setSelectedCollection(null),
      setSelectedFolderTemplates(null)
    setShowNewCollectionInput(false)
    if (!isCollapsed) {
      toggleCollapse();
    }
  }

  const triggerUploadToClientFolder = () => {
    // Destructure state actions and values from your store
    const {
      setSelectedTabs,
      selectedTabs,
      setCollectionTabClosed,
      setUploadSource,
      setDocumentsList,
      clearDocumentsList,
      setSelectedCollection,
      setShowNewCollectionInput,
      setNewCollectionName,
      setSelectedFolderTemplates,
    } = useStore.getState();

    // Ensure selectedTabs.options is always an array
    const options = Array.isArray(selectedTabs?.options)
      ? selectedTabs.options
      : [];

    // Filter out unwanted tabs safely
    const updatedTabs = options.filter(
      (tab) =>
        tab.name !== "UploadDocuments" &&
        tab.name !== "Collection" &&
        tab.name !== "Preview" &&
        tab.name !== "Chat" &&
        tab.name !== "Metadata" &&
        tab.name !== "Client Metadata"
    );

    // Check if "ClientUpload" tab already exists
    const alreadySelected = options.some((tab) => tab.name === "ClientUpload");

    // Clear and set upload source only if not already selected
    if (!alreadySelected) {
      clearDocumentsList();
      setUploadSource("clientFolder");
    }

    // Update tab list
    setSelectedTabs({ options: updatedTabs });

    // Reset various states for clean context
    setDocumentsList([]);
    setUploadSource("clientFolder");
    setCollectionTabClosed(false);
    setShowClientDropdown(true); // ✅ assuming this is defined in component scope
    setShowFolderTree(false); // ✅ same assumption
    setShowNewCollectionInput(false);
    setNewCollectionName("");
    clearDocumentsList();
    setSelectedCollection(null);
    setSelectedFolderTemplates(null);

    // Expand panel if collapsed
    if (isCollapsed) {
      toggleCollapse();
    }
  }
  // Add this to your component to debug
useEffect(() => {
  console.log("multiSelectedDocs array:", multiSelectedDocs);
}, [multiSelectedDocs]);

  const triggerSearchDMSById = () => {

    const {
      setUploadSource,
      isSourcesDialogOpen,
      clearDocumentsList,
      setSelectedCollection,
      setShowNewCollectionInput,
      setDocumentsList,
      setSelectedTabs,
      setNewCollectionName,
      setSelectedFolderTemplates,
      clearDocumentSelection,
    } = useStore.getState();


    setUploadSource("addSource");
    setShowClientDropdown(false);
    setShowFolderTree(false);
    setShowAddSourceButton(true);
    setIsSourcesDialogOpen(true);
    setDocumentsList(null);
    setSelectedCollection(null);
    setSelectedFolderTemplates(null);
    setSelectedClientFolder(null);
    setShowNewCollectionInput(false);
    setNewCollectionName('')
    setSelectedFolder(null);
    setSelectedTabs([]);
    setDocuments([]);
    clearDocumentSelection();
    handleClearAllClick()

    const updatedTabs = useStore
      .getState()
      .selectedTabs.options.filter(
        (tab) =>
          tab.name !== "UploadDocuments" &&
          tab.name !== "Collection" &&
          tab.name !== "Client Metadata"
      );
  }

  useEffect(() => {
    if (configs?.DEFAULT_TAB_OPTION === 'mydocuments') {
    triggerUploadToMyDocuments();
  } else if (configs?.DEFAULT_TAB_OPTION === 'clientfolder') {
    triggerUploadToClientFolder();
  } else if (configs?.DEFAULT_TAB_OPTION === 'searchDMSById') {
    triggerSearchDMSById();
  }
  },[configs])

  useEffect(() => {
    if (activeTab === 'clientFolder') {
      setShowClientDropdown(true);
      setIsCollapsed(false);
    }
  }, [activeTab, setShowClientDropdown, setIsCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (
          plusButtonRef.current &&
          !plusButtonRef.current.contains(event.target)
        ) {
          setShowPlusMenu(false);
          setMenuHovered(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (documentsList) {
      const mappedDocuments = documentsList?.map((doc) => ({
        id: doc.ID,
        name: doc.FileName,
        createdBy: doc.CreatedBy,
        createdAt: doc.CreationDateTime,
        downloadUrl: doc.URL,
        extension: doc.Extension,
      }));
      setDocuments(mappedDocuments);
    }
  }, [documentsList]);

  // ⚙️ Manage select all checkbox (checked/indeterminate)
  useEffect(() => {
    if (selectAllRef.current) {
      const allSelected = selectedIds.length === documents.length;
      const someSelected =
        selectedIds.length > 0 && selectedIds.length < documents.length;
      selectAllRef.current.checked = allSelected;
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [selectedIds, documents]);

  // 💾 Helper to persist data to localStorage
  const updateLocalStorage = (ids) => {
    if (ids.length > 0) {
      const payload = {
        DocType: "D",
        ID: ids,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      setIsSelectAll(true);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setIsSelectAll(false);
    }
  };

  // 🖱 Handle Select All toggle
  // const handleSelectAll = () => {
  //   let newIds = [];
  //   if (selectedIds.length !== documents.length) {
  //     newIds = documents.map((item) => item.id); // select all
  //   }
  //   setSelectedIds(newIds);
  //   updateLocalStorage(newIds);
  // };
const handleSelectAll = () => {
  let newDocs = [];

  // If all selected → unselect all
  if (multiSelectedDocs.length === documents.length) {
    newDocs = [];
  } else {
    // Select all documents
    newDocs = documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
    }));
  }

  // Update store
  setMultiSelectedDocs(newDocs);

  // If you want to maintain selectedIds for UI checkbox logic
  const newIds = newDocs.map((d) => d.id);
  setSelectedIds(newIds);
  updateLocalStorage(newIds); // if you need local persistence
};



  const handleCopyName = async (name) => {
    try {
      await navigator.clipboard.writeText(name);
      toast.success("Copied to clipboard!", successToastObj);
    } catch (err) {
      toast.error("Failed to copy name.");
    }
  };

  const handleRemoveDocument = (id) => {
    setDocuments((prevDocuments) =>
      prevDocuments.filter((doc) => doc.id !== id)
    );
    toast.success("Document removed successfully !", successToastObj);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

const handleSelectDocument = async (item, event) => {
  event.stopPropagation();

  // MULTI SELECT
  if (event.ctrlKey || event.metaKey) {

  let updatedDocs = [];

    setMultiSelectedDocs((prev) => {
      console.log("Prev",prev)
      const exists = prev.some((doc) => doc.id === item.id);
      setTooltipCopiedOrNot()
      updatedDocs = exists
        ? prev.filter((doc) => doc.id !== item.id)
        : [...prev, { id: item.id, name: item.name }];

      return updatedDocs;
    });
    setTooltipCopiedOrNot((prev) => ({
      ...prev,
      [item.id]: updatedDocs.some((d) => d.id === item.id) ? "Copied" : "Not Copied"
    }));

    // Now run async code OUTSIDE setState
    const newIds = updatedDocs.map((d) => d.id);
    setSelectedIds(newIds);
    updateLocalStorage(newIds);
    return;
  }

  // SINGLE SELECT
  const single = [{ id: item.id, name: item.name }];
  setMultiSelectedDocs(single);
  setSelectedIds([item.id]);
  updateLocalStorage([item.id]);

  setSelectedDocumentId(item.id);
  setSelectedDocument(item);
};




  const handleClearAllClick = () => {
    const { clearDocumentSelection } = useStore.getState();
    setDocuments([]);
    clearDocumentSelection();
  };

  // Get selected document name for collapsed view
  const selectedDoc = documents?.find((doc) => doc.id === selectedDocumentId);

  

  return (
    <Card
      className={`text-slate-800 bg-white flex flex-col rounded-2xl shadow-lg transition-all ease-in-out duration-300 ${isCollapsed
        ? "h-12 w-16 md:h-full md:w-16 min-w-16" // Collapsed state (mobile: full width, desktop: icon size)
        : "h-[calc(100vh-4rem)] min-w-[clamp(300px,35%,400px)] md:h-full md:w-[clamp(300px,35%,400px)]" // Expanded state
        }`}
    >
      <CardHeader>
        <CardTitle className="border-b border-slate-300 p-1">
          <div className="flex justify-between items-center">
            {!isCollapsed && (
              <p className="text-muted-foreground text-sm font-medium pl-2 md:pl-4">
                Sources
              </p>
            )}
            {!isCollapsed && activeTab !== 'clientFolder' && (
              <TooltipProvider delayDuration={300}>
                <div className="flex gap-2 items-center justify-center w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={triggerUploadToMyDocuments}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <Upload
                          size={18}
                          className="text-muted-foreground/80 hover:text-muted-foreground transition-colors"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={8}
                      className="text-xs font-medium"
                    >
                      Upload to My Documents
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="icon"
                        onClick={triggerUploadToClientFolder}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <FolderPlus
                          size={18}
                          className="text-muted-foreground/80 hover:text-muted-foreground transition-colors"
                        />
                      </Button>

                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={8}
                      className="text-xs font-medium"
                    >
                      Add to Client Folder
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={triggerSearchDMSById}
                        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
                      >
                        <Search
                          size={18}
                          className="text-muted-foreground/80 hover:text-muted-foreground transition-colors"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={8}
                      className="text-xs font-medium"
                    >
                      Search DMS
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
            <div
              className={`flex items-center ${isCollapsed
                ? "flex-col items-center justify-center w-full"
                : "flex-row-reverse gap-2"
                }`}
            >
              <Button
                variant="icon"
                className={`text-muted-foreground cursor-pointer transition-colors duration-200 ${isCollapsed
                  ? "h-9 w-full flex items-center justify-center rounded-t-lg hover:bg-gray-100/50"
                  : "w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 "
                  }`}
                onClick={toggleCollapse}
                disabled={showClientDropdown}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {isCollapsed ? (
                        <PanelLeft
                          size={16}
                          className="text-muted-foreground/80 hover:text-muted-foreground transition-colors"
                        />
                      ) : (
                        <PanelLeft
                          size={18}
                          className="text-muted-foreground/80 hover:text-muted-foreground transition-colors"
                        />
                      )}
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      sideOffset={8}
                      className="text-xs font-medium"
                    >
                      {isCollapsed ? "Expand panel" : "Collapse panel"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      {isCollapsed && activeTab !== 'clientFolder' ? (
        <CardContent className="md:flex flex-col justify-center items-center gap-3">
          <div>{isSourcesDialogOpen && <SourcesDialog />}</div>
          <div className="relative">
            <TooltipProvider delayDuration={300}>
              <div
                className="relative group"
                ref={plusButtonRef}
                onMouseEnter={() => setShowPlusMenu(true)}
                onMouseLeave={() => {
                  if (!menuHovered) {
                    setTimeout(() => setShowPlusMenu(false), 400);
                  }
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-8 h-8 flex items-center justify-center rounded-md shadow-xs bg-gray-100 text-muted-foreground hover:bg-gray-200 transition-colors cursor-pointer">
                      <Plus size={18} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Add Source</TooltipContent>
                </Tooltip>

                {/* Hover Menu */}
                {showPlusMenu && (
                  <div
                    ref={menuRef}
                    className="absolute left-full ml-2 -top-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex items-center gap-1 z-50 animate-in fade-in zoom-in-95"
                    onMouseEnter={() => {
                      setMenuHovered(true);
                      setShowPlusMenu(true);
                    }}
                    onMouseLeave={() => {
                      setMenuHovered(false);
                      setTimeout(() => setShowPlusMenu(false), 200);
                    }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="icon"
                          onClick={triggerUploadToMyDocuments}
                          className="p-2 hover:bg-gray-100 text-muted-foreground rounded-lg"
                        >
                          <Upload size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Upload to My Documents
                      </TooltipContent>
                    </Tooltip>

                    {/* <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="icon"
                          onClick={() => {
                            setShowClientDropdown(true);
                            setShowFolderTree(false);
                          }}
                          className="p-2 text-muted-foreground hover:bg-gray-100 rounded-lg"
                        >
                          <FolderOpen size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Save to Matter Folder
                      </TooltipContent>
                    </Tooltip> */}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="icon"
                          onClick={triggerUploadToClientFolder}
                          className="p-2 text-muted-foreground hover:bg-gray-100 rounded-lg"
                        >
                          <FolderPlus size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Add to Client Folder
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="icon"
                          onClick={triggerSearchDMSById}
                          className="p-2 text-muted-foreground hover:bg-gray-100 rounded-lg"
                        >
                          <Search size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Search DMS</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>
          {!showClientDropdown && (
            <>
              <div
                key={selectedDocumentId}
                className={`${selectedDocumentId && selectedDoc
                  ? "flex justify-center items-center bg-white  shadow-xs rounded-md animate-pop-in"
                  : "hidden"
                  }`}
              >
                <div className="relative group">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleSelectDocument(selectedDoc)}
                        className="cursor-pointer h-8 w-8 flex flex-col items-center justify-center text-sm text-gray-700 hover:bg-gray-50 bg-gray-100 border border-gray-300  rounded-md p-2 transition-colors"
                      >
                        {getFileIcon(selectedDoc?.extension, selectedDoc?.name)}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Unselect
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="w-[15px] bg-gray-300 h-[1px] my-2"> </div>
              <div>
                {documents.length > 0 ? (
                  <div className="md:flex flex-col justify-center items-center gap-2">
                    {documents.slice(0, 10).map((doc) =>
                      selectedDocumentId != doc.id ? (
                        <div
                          key={doc.id}
                          onClick={() => handleSelectDocument(doc)}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="cursor-pointer flex flex-col p-2 items-center justify-center text-sm text-slate-100 rounded-md hover:bg-gray-100">
                                  {getFileIcon(doc.extension, doc.name)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {doc.name} (ID: {doc.id})
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : null
                    )}

                    {documents.length > 10 && (
                      <div
                        className="text-slate-400 text-sm mt-1 cursor-pointer hover:bg-gray-100 rounded-md"
                        onMouseEnter={toggleCollapse}
                      >
                        ...
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      ) : (
        <CardContent className="flex flex-col  h-[calc(100vh-8rem)] overflow-hidden justify-start items-start gap-3 md:gap-5">
          {isSourcesDialogOpen && <SourcesDialog />}

          <div className="w-full h-full flex flex-col justify-start items-start  gap-3">
            {showClientDropdown && (
              <div className="w-full h-full flex flex-col">
                <ClientDropdown />
              </div>
            )}

            {/* Documents Header + List */}
            {documents.length > 0 && !showClientDropdown && activeTab !== 'clientFolder' && (
              <div className="w-full h-full flex flex-col gap-3 p-4">
                <div className="flex w-full items-start">
                  <div className="w-full pt-1 text-muted-foreground font-semibold text-sm mb-2">
                    Select a document
                  </div>
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSelectAll}
                          className="text-xs h-7 hover:shadow-sm hover:text-muted-foreground text-muted-foreground font-medium hover:bg-gray-100 bg-gray-100/70 px-4 py-1 rounded-xl"
                        >
                          Copy All
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Copy all files
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleClearAllClick}
                          className="text-xs h-7 hover:shadow-sm hover:text-muted-foreground text-muted-foreground font-medium hover:bg-gray-100 bg-gray-100/70 px-4 py-1 rounded-xl"
                        >
                          Clear All
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Clear all files
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex flex-col h-full overflow-y-auto rounded-2xl rounded-t-none py-1 space-y-1 bg-white relative">
                  {documents.map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => handleSelectDocument(item,e)}
                       className={`
    flex items-center justify-between gap-3 
    w-full px-3 py-2 rounded-xl cursor-pointer 
    transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
    group
    ${
      multiSelectedDocs.some((doc) => doc.id === item.id)
        ? "bg-gray-100"
        : "bg-white hover:bg-gray-100/80"
    }
  `}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="min-w-[24px] min-h-[24px] flex items-center justify-center shrink-0">
                          {getFileIcon(item.extension, item.name)}
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="flex-1 text-sm text-muted-foreground font-medium truncate">
                                {item.name}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
  {tooltipCopiedOrNot[item.id] ?? `${item.name} (ID: ${item.id})`}
</TooltipContent>
                            <TooltipContent>
                              {item.name} (ID: {item.id})
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* More Actions */}
                      <TooltipProvider>
                        <Tooltip>
                          <DropdownMenu>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <EllipsisVertical
                                  size={22}
                                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200/70 rounded-full p-1 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">More</TooltipContent>

                            <DropdownMenuContent
                              align="right"
                              className="w-fit p-2 text-muted-foreground font-medium text-sm rounded-2xl"
                            >
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyName(item.name);
                                }}
                                className="hover:bg-gray-100/80"
                              >
                                <Copy className="mr-2" /> Copy Name
                              </DropdownMenuItem>

                              <DropdownMenuItem className="hover:bg-gray-100/80 w-full">
                                <Link
                                  href={configs?.TRANSLATE_URL + item.id}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full flex gap-2"
                                >
                                  <BookType /> Translate
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="text-red-600/70 hover:bg-red-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveDocument(item.id);
                                }}
                              >
                                <Trash className="text-red-600/70 mr-2" /> Remove Document
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {documents.length === 0 && !showClientDropdown && !showFolderTree && activeTab !== 'clientFolder' && (
              <div className="h-full w-full flex flex-col gap-4 justify-center items-center px-4 overflow-y-auto">
                <div className="flex flex-col items-center text-center max-w-xs">
                  <FileText size={48} className="text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-4">
                    Get started by clicking the action buttons below:
                  </p>
                  <div className="grid gap-3 w-full text-sm">
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 hover:shadow-sm"
                      onClick={triggerUploadToMyDocuments}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <Upload size={14} className="text-blue-500" />
                      </div>
                      <span className="text-gray-600 text-nowrap">
                        <span className="font-medium">Upload</span> to my documents
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 hover:shadow-sm"
                      onClick={triggerUploadToClientFolder}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <FolderPlus size={14} className="text-blue-500" />
                      </div>
                      <span className="text-gray-600">
                        Add to <span className="font-medium">Client Folder</span>
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 hover:shadow-sm"
                      onClick={triggerSearchDMSById}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <Search size={14} className="text-blue-500" />
                      </div>
                      <span className="text-gray-600">
                        <span className="font-medium">Search</span> by DMS ID
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
      <Toaster />
    </Card>
  );
};

export default DocumentSearchTab;
