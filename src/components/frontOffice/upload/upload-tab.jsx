"use client";

import {
  Upload,
  Trash2,
  X,
  MessageSquare,
  FolderOpen,
  Plus,
  Pencil,
  CirclePlus,
  SquarePen,
  Folder,
  ChevronRight,
  Ellipsis,
  Loader2,
  AlertCircle,
  Search,
  ArrowRight,
  Info,
} from "lucide-react";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs";
import { errorToastObj, getFileIcon, successToastObj } from "@/lib/constants";
import useStore from "@/store/useStore";
import { toast } from "sonner";
import Loader from "../../loader";
import useFrontOfficeStore from "@/store/useFrontOfficeStore";
import { uploadFilesToActiveClientFolder } from "@/services/api";
import NoFolderSelected from "./no-folder-selected";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import EditableFolderName from "./editable-folder-name";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { removeFolderFromTree, updateFolderNameInTree } from "@/lib/utils";
import { set } from "lodash";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UploadTab = () => {
  // State Management
  const [isDragging, setIsDragging] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [propertyValues, setPropertyValues] = useState({});
  const [showNewDocumentPanel, setShowNewDocumentPanel] = useState(false);
  const [documentType, setDocumentType] = useState("blank");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [newFile, setNewFile] = useState({ name: '', type: '' });
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  // Constants
  const excludedKeys = ["id", "parent", "fullPath", "hasChildren", "children", "type", 'canUpload', 'canCreate', 'folderType'];

  // Refs
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Store hooks
  const { configs, setSelectedDocumentId, setIsCollapsed, selectedDocumentId, securityGroup, setSelectedDocument } = useStore();
  const {
    uploadState,
    setUploadType,
    setUploadFiles,
    uploadFiles,
    resetUpload,
    setUploadStatus,
    selectedFolderTab,
    selectedFolder,
    isFrontOffice,
    documentsList,
    deleteFolder,
    addNewSubFolder,
    updateFolderName,
    fetchFrontOfficeFolders,
    activeTab,
    setActiveTab,
    manageFolderMode,
    setManageFolderMode,
    newDocumentTemplates,
    getNewDocumentTemplates,
    fetchFolderData,
    clientNameData,
    clientIdData,
    documentTypeData,
    documentSubTypeData,
    folderTemplatesList,
    selectedFolderTemplatesList,
    setSelectedFolderTemplatesList,
    selectedFolderTemplate,
    setSelectedClientName,
    setSelectedClientId,
    setSelectedDocumentType,
    setSelectedDocumentSubType,
    setSelectedFolderTemplate
  } = useFrontOfficeStore();

  const MAX_FILES = configs?.MAX_FILES_SIZE;
  const isLoading = uploadState.status === "uploading";
  const SECURITY_GROUPS = configs?.SECURITY_GROUPS;

  const hasSecurityGroupPermission = () => {
    const normalizedGroups = securityGroup.flatMap((g) => g.split(","));
    const hasAccess = SECURITY_GROUPS?.some((group) =>
      normalizedGroups.includes(group));
    return hasAccess;
  };

  // Default blank document types
  const blankDocuments = [
    { type: "docx", name: "Word Document", icon: getFileIcon("docx") },
    { type: "xlsx", name: "Excel Spreadsheet", icon: getFileIcon("xlsx") },
    { type: "pptx", name: "PowerPoint Presentation", icon: getFileIcon("pptx") }
  ];

  // Filtered templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!newDocumentTemplates || !Array.isArray(newDocumentTemplates)) {
      return [];
    }

    if (!templateSearchQuery.trim()) {
      return newDocumentTemplates;
    }

    const query = templateSearchQuery.toLowerCase().trim();
    return newDocumentTemplates.filter((template) => {
      if (!template) return false;
      const name = (template.name || "").toLowerCase();
      const extension = (template.edoc_ext || "").toLowerCase();
      return name.includes(query) || extension.includes(query);
    });
  }, [newDocumentTemplates, templateSearchQuery]);

  // Permission-based tab configuration
  const getTabConfiguration = () => {
    if (!selectedFolder) return { showUpload: false, showManageFolders: false, showUploadedFiles: false, showDocumentSearch: false };

    const canUpload = selectedFolder.canUpload;
    const canCreate = selectedFolder.canCreate;

    return {
      showUpload: canUpload,
      showManageFolders: canCreate,
      showUploadedFiles: canUpload,
      showDocumentSearch: true, // Always show document search
    };
  };

  const tabConfig = getTabConfiguration();

  // Determine default active tab based on permissions
  const getDefaultActiveTab = () => {
    if (tabConfig.showUpload) return "upload";
    if (tabConfig.showManageFolders) return "manageFolders";
    if (tabConfig.showDocumentSearch) return "documentSearch";
    return "upload";
  };

  // Get dynamic iframe URL based on selected folder
  const getDocumentSearchUrl = () => {
    if (!selectedFolder?.id) return '';
    
    // Construct your iframe URL based on folder properties
    // Replace this with your actual URL construction logic
    const baseUrl = configs?.DOCUMENT_SEARCH_URL;
    const selectedUrl = encodeURIComponent(selectedFolder.rawData.url);
    //const folderId = encodeURIComponent(selectedFolder.id);
    //const folderPath = encodeURIComponent(selectedFolder.fullPath || '');
    //const folderName = encodeURIComponent(selectedFolder.name || '');
    
    // You can customize the query parameters based on your backend requirements
    console.log(`${baseUrl}${selectedUrl}`,'Iframe load URL');
    return `${baseUrl}${selectedUrl}`;
  };

  // Extract fourth subfolder utility
  const extractFourthSubfolder = (path) => {
    if (!path) return null;
    const parts = path.split(/[/\\]/).filter((part) => part.trim() !== "");
    return parts.length >= 4 ? parts[3] : null;
  };

  // Effects
  useEffect(() => {
    if (selectedFolder?.id && folderTemplatesList) {
      const fourthSubfolder = extractFourthSubfolder(selectedFolder.id);
      const matchingFolder = folderTemplatesList?.find(
        (folder) => folder.folderName === fourthSubfolder
      );

      const templates = matchingFolder
        ? matchingFolder.templates.split(",").map((t) => t.trim())
        : [];

      setSelectedFolderTemplatesList(templates);
      setSelectedFolderTemplate("");
    }
  }, [selectedFolder]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        await getNewDocumentTemplates();
      } catch (error) {
        console.error('Failed to fetch templates on mount:', error);
      }
    };
    fetchTemplates();
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedFolderTab?.property) {
      setPropertyValues({ ...selectedFolderTab.property });
    }
  }, [selectedFolderTab]);

  // Set appropriate active tab when folder changes
  useEffect(() => {
    if (selectedFolder) {
      const defaultTab = getDefaultActiveTab();
      setActiveTab(defaultTab);
    }
  }, [selectedFolder?.id]);

  // Reset iframe states when folder changes
  useEffect(() => {
    if (activeTab === 'documentSearch') {
      setIframeLoading(true);
      setIframeError(false);
    }
  }, [selectedFolder?.id, activeTab]);

  // Reset search when panel closes or document type changes
  useEffect(() => {
    if (!showNewDocumentPanel || documentType === "blank") {
      setTemplateSearchQuery("");
    }
  }, [showNewDocumentPanel, documentType]);

  // Early return for no folder or no permissions
  if (!selectedFolder || (!selectedFolder.canUpload && !selectedFolder.canCreate)) {
    return <NoFolderSelected />;
  }

  // Event Handlers
  const handleInputChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleTabChange = (value) => {
    // Reset upload states when leaving upload tab
    if (value !== "upload" && activeTab === "upload") {
      resetUpload();
      setFormValues([]);
      setShowNewDocumentPanel(false);
      setNewFile({ name: '', type: '' });
    }
    
    // Set success status for uploaded files tab
    if (value === 'uploadedFiles' && documentsList?.length > 0) {
      setUploadStatus('success');
    }

    // Reset iframe states when switching to document search
    if (value === 'documentSearch') {
      setIframeLoading(true);
      setIframeError(false);
    }

    setActiveTab(value);
  };

  const handlePropertyToggle = (key) => {
    setPropertyValues((prev) => ({
      ...prev,
      [key]: prev[key] === "Y" ? "N" : "Y",
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) {
      addLocalFiles(droppedFiles);
    }
  };

  // Enhanced file addition function to support mixed sources
  const addLocalFiles = (newFiles) => {
    const existingFileNames = uploadState.files.map((file) => 
      file.uploadType === 'local' ? file.name : `${file.name}.${file.type}`
    );

    const uniqueFiles = newFiles.filter(
      (file) => !existingFileNames.includes(file.name)
    );

    if (uniqueFiles.length < newFiles.length) {
      toast.error("Some files are already added!", errorToastObj);
    }

    if (uploadState.files.length + uniqueFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files can be uploaded!`, errorToastObj);
      return;
    }

    if (uniqueFiles.length > 0) {
      // Add files with uploadType metadata
      const filesWithType = uniqueFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        uploadType: 'local',
        file: file, // keep the actual File object for upload reference
      }));
      
      setUploadFiles([...uploadState.files, ...filesWithType]);
      useStore.getState().setUploadSource(null);
    }
  };

  const handleFileChange = (e) => {
    setIsCollapsed(false);
    const selectedFiles = Array.from(e.target.files || []);
    addLocalFiles(selectedFiles);
    e.target.value = "";
  };

  const handleUploadFile = async () => {
    if (!isFrontOffice) return;

    try {
      setLoading(true);

      const uploadResponse = await uploadFiles(selectedFolder, propertyValues);

      if (uploadResponse?.data?.Status === "Success") {
        setSelectedDocumentId(uploadResponse?.data?.DocumentList?.[0]?.ID);
        setSelectedDocument(uploadResponse?.data?.DocumentList[0])
        setActiveTab("uploadedFiles");
        toast.success("Uploaded Successfully", successToastObj);
      } else {
        throw new Error(uploadResponse?.data?.Message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error(err.message, errorToastObj);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlankFile = () => {
    if (!newFile?.name?.trim()) {
      toast.error('Please enter a file name', errorToastObj);
      return;
    }

    // Clean file name - remove extension if already present
    let cleanName = newFile.name.trim();
    const fileExtension = `.${newFile.type}`;
    if (cleanName.toLowerCase().endsWith(fileExtension.toLowerCase())) {
      cleanName = cleanName.slice(0, -fileExtension.length);
    }

    const fileName = `${cleanName}${fileExtension}`;
    const existingFileNames = uploadState.files.map((file) => 
      file.uploadType === 'local' ? file.name : `${file.name}.${file.type}`
    );

    if (existingFileNames.includes(fileName)) {
      toast.error('A file with this name already exists!', errorToastObj);
      return;
    }

    if (uploadState.files.length >= MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files can be uploaded!`, errorToastObj);
      return;
    }

    const fileToAdd = {
      name: cleanName,
      type: newFile.type,
      uploadType: 'blank'
    };

    setUploadFiles([...uploadState.files, fileToAdd]);
    setNewFile({ name: '', type: '' });
    toast.success(`Blank ${newFile.type} document added`, successToastObj);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleClearClick = () => {
    resetUpload();
    setShowNewDocumentPanel(false);
    const { selectedTabs, setSelectedTabs, setClientMetaTabClosed } = useStore.getState();
    const filteredTabs = selectedTabs.options?.filter(
      (tab) => tab.name !== "Client Metadata"
    );
    setSelectedTabs({ options: filteredTabs });
    setClientMetaTabClosed(true);
  };

  const handleSelectDocument = (item) => {
    setSelectedDocumentId(item.ID);
  };

  // File Creation Handlers
  const handleNewDocumentClick = () => {
    setShowNewDocumentPanel(true);
    setDocumentType("blank");
    setTemplateSearchQuery("");
  };

  const handleBlankDocumentSelect = (type) => {
    setNewFile({ type: type, name: "" });
    setShowNewDocumentPanel(false);
  };

  const handleTemplateSelect = (template) => {
    if (!template) {
      console.error('Template is null or undefined');
      return;
    }

    // Clean template name - remove extension if already present
    let cleanName = template.name || `Template_${Date.now()}`;
    const fileExtension = `.${template.edoc_ext || 'file'}`;
    if (cleanName.toLowerCase().endsWith(fileExtension.toLowerCase())) {
      cleanName = cleanName.slice(0, -fileExtension.length);
    }

    const fileName = `${cleanName}${fileExtension}`;
    const existingFileNames = uploadState.files.map((file) => 
      file.uploadType === 'local' ? file.name : `${file.name}.${file.type}`
    );

    if (existingFileNames.includes(fileName)) {
      toast.error('This template has already been added!', errorToastObj);
      return;
    }

    if (uploadState.files.length >= MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files can be uploaded!`, errorToastObj);
      return;
    }

    const fileToAdd = {
      name: cleanName,
      type: template.edoc_ext || 'file',
      templateId: template.tocid || null,
      uploadType: 'template'
    };

    setUploadFiles([...uploadState.files, fileToAdd]);
    setShowNewDocumentPanel(false);
    setTemplateSearchQuery("");
    toast.success(`Template "${cleanName}" added`, successToastObj);
  };

  // Folder Management Handlers
  const handleDeleteFolderClick = async () => {
    if (selectedFolder?.id) {
      try {
        setLoading(true);
        await deleteFolder();

        useFrontOfficeStore.setState((state) => ({
          folderData: removeFolderFromTree(state.folderData, selectedFolder.id),
          selectedFolder: null
        }));

        toast.success(`Folder "${selectedFolder.name}" deleted successfully`, successToastObj);
      } catch (error) {
        toast.error(error?.message || "Delete failed", errorToastObj);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddNewSubFolder = async () => {
    try {
      setLoading(true);
      await addNewSubFolder(formValues);

      await fetchFrontOfficeFolders(selectedFolderTab.folderType, selectedFolder.fullPath);

      useFrontOfficeStore.setState((state) => ({
        folderData: state.folderData.map((node) =>
          node.id === selectedFolder.id ? { ...node, isExpanded: true } : node
        )
      }));

      toast.success(`Folder "${formValues.name}" created successfully`, successToastObj);
    } catch (error) {
      toast.error(error?.message || "Create failed", errorToastObj);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFolderClick = async (folderName) => {
    const folderUpdatedName = folderName ?? formValues.name;
    try {
      setLoading(true);
      await updateFolderName(selectedFolder, formValues);

      useFrontOfficeStore.setState((state) => ({
        folderData: updateFolderNameInTree(state.folderData, selectedFolder.id, folderUpdatedName),
        selectedFolder: { ...state.selectedFolder, name: folderUpdatedName }
      }));

      toast.success(`Folder renamed to "${folderUpdatedName}"`, successToastObj);
    } catch (error) {
      toast.error(error?.message || "Update failed", errorToastObj);
    } finally {
      setLoading(false);
    }
  };

  // Remove file from upload list
  const handleRemoveFile = (index) => {
    const updatedFiles = uploadState.files.filter((_, i) => i !== index);
    setUploadFiles(updatedFiles);
  };

  // Utility functions
  const filteredFields = selectedFolder
    ? Object.entries(selectedFolder).filter(([key]) => !excludedKeys.includes(key))
    : [];

  const colorClasses = {
    blue: { active: "bg-blue-50 text-blue-700", hover: "hover:text-blue-600" },
    yellow: { active: "bg-yellow-50 text-yellow-700", hover: "hover:text-yellow-600" },
    red: { active: "bg-red-50 text-red-700", hover: "hover:text-red-600" }
  };

  // Get file type badge
  const getFileTypeBadge = (uploadType) => {
    const badges = {
      local: { label: 'Local', color: 'bg-blue-100 text-blue-700' },
      blank: { label: 'New', color: 'bg-green-100 text-green-700' },
      template: { label: 'Template', color: 'bg-purple-100 text-purple-700' }
    };
    return badges[uploadType] || badges.local;
  };

  // Render Components
  const renderUploadArea = () => (
    <div
      className={`
        w-full min-w-1/2 h-full flex flex-col justify-center items-center 
        rounded-xl border-2 border-dashed transition-all duration-200
        ${isDragging
          ? "bg-blue-50/80 border-blue-500 backdrop-blur-sm"
          : "bg-white/80 border-gray-200 hover:border-blue-400 backdrop-blur-sm"
        }
        cursor-pointer relative overflow-hidden group
      `}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleDrop(e);
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload area - drag and drop files or click to select"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerFileSelect();
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        aria-label="File input"
      />

      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div
          className={`p-4 rounded-2xl transition-all duration-300 ${isDragging
              ? "bg-blue-500 text-white scale-105 shadow-lg"
              : "bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500"
            }`}
        >
          <Upload size={28} />
        </div>
        <div className="space-y-1.5">
          <p className="text-gray-900 font-medium text-lg">
            Upload to {selectedFolder?.name}
          </p>
          <p className="text-sm text-gray-500">
            {isDragging
              ? "Drop files to upload"
              : "Drag & drop files or use the buttons below"}
          </p>
          <p
            className={`text-xs mt-1 ${uploadState.files.length >= MAX_FILES
                ? "text-red-500 font-medium"
                : "text-gray-400"
              }`}
          >
            {uploadState.files.length}/{MAX_FILES} files selected
            {uploadState.files.length >= MAX_FILES && " - Maximum limit reached!"}
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={triggerFileSelect}
            className="px-4 py-2 text-sm font-medium rounded-lg"
            disabled={uploadState.files.length >= MAX_FILES}
          >
            Select Files
          </Button>

          <Button
            variant="secondary"
            onClick={handleNewDocumentClick}
            className="px-4 py-2 text-sm font-medium rounded-lg"
            disabled={uploadState.files.length >= MAX_FILES}
          >
            New Document
          </Button>
        </div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-blue-400/10 animate-pulse" />
      )}
    </div>
  );

  const renderNewDocumentPanel = () => (
    <div className="w-full max-w-1/2 bg-white rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">New Document</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowNewDocumentPanel(false);
            setTemplateSearchQuery("");
          }}
          className="h-6 w-6 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Toggle Buttons */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <Button
            variant="ghost"
            onClick={() => {
              setDocumentType("blank");
              setTemplateSearchQuery("");
            }}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all duration-200 ${documentType === "blank"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Blank Documents
          </Button>
          <Button
            variant="ghost"
            onClick={() => setDocumentType("template")}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all duration-200 ${documentType === "template"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            Template Documents
          </Button>
        </div>
      </div>

      {/* Search Input for Templates */}
      {documentType === "template" && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={templateSearchQuery}
              onChange={(e) => setTemplateSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm border-gray-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {documentType === "blank" ? (
          <div className="space-y-2">
            {blankDocuments.map((doc) => (
              <Button
                key={doc.type}
                className="w-full shadow-none flex items-center gap-3 px-4 py-3 justify-start rounded-md border border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/60 transition-all duration-200 group"
                onClick={() => handleBlankDocumentSelect(doc.type)}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-gray-500 group-hover:text-blue-600">
                    {doc.icon}
                  </span>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 truncate">
                    {doc.name}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {newDocumentTemplates && Array.isArray(newDocumentTemplates) && newDocumentTemplates.length > 0 ? (
              <>
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => {
                    if (!template) return null;

                    return (
                      <Button
                        key={template?.tocid || template?.name || Math.random()}
                        className="w-full shadow-none flex items-center gap-3 px-4 py-3 justify-start rounded-md border border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/60 transition-all duration-200 group"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-gray-500 group-hover:text-blue-600">
                            {getFileIcon(template?.edoc_ext || "file")}
                          </span>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 truncate">
                            {template?.name || "Unnamed Template"}
                          </span>
                        </div>
                      </Button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Search className="w-8 h-8 mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">No templates found</p>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {templateSearchQuery.trim()
                        ? `No templates match "${templateSearchQuery}"`
                        : "Try searching for a specific template name"
                      }
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-sm">Loading templates...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderPropertiesPanel = () => (
    <div className="w-full bg-white rounded-xl border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">Document Properties</p>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {Object.entries(propertyValues).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-gray-800 truncate">
                {key}
              </p>
            </div>
            <button
              onClick={() => handlePropertyToggle(key)}
              className={`flex-shrink-0 relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ${
                value === "Y" ? "bg-blue-500" : "bg-gray-300"
              }`}
              aria-pressed={value === "Y"}
            >
              <span className="sr-only">Toggle {key}</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  value === "Y" ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFilesList = () => {
    const { files } = uploadState;

    return (
      <div className="w-full bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <p className="font-semibold flex items-center gap-2 text-sm">
            Quick Preview
            <span className={`text-xs ${files.length >= MAX_FILES ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
              ({files.length}/{MAX_FILES})
            </span>
          </p>
        </div>
        
        <div className="max-h-[280px] overflow-y-auto p-4">
          <div className="space-y-2">
            {files?.map((file, index) => {
              // Properly construct file name
              const fileName = file.uploadType === 'local'
                ? file.name
                : `${file.name}.${file.type}`;
              const typeBadge = getFileTypeBadge(file.uploadType);

              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex justify-between items-center gap-3 bg-white rounded-lg px-4 py-3 border border-gray-200 hover:border-gray-300 transition-colors cursor-default"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="flex-shrink-0 text-gray-500">
                            {getFileIcon(file.type, file.name)}
                          </span>
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {fileName}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs flex-shrink-0 ${typeBadge.color}`}
                          >
                            {typeBadge.label}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs break-all">
                      <p className="text-xs">{fileName}</p>
                      {file.uploadType === 'template' && file.templateId && (
                        <p className="text-xs text-gray-400 mt-1">Template ID: {file.templateId}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderNewFileForm = () => {
    return (
      <div className="w-full max-w-md min-w-1/2 px-4 py-2 flex flex-col gap-6">
        <Label className="flex flex-col gap-3 w-full justify-start items-start px-2">
          <span className="font-medium text-gray-800 text-sm flex items-center gap-2">
            {getFileIcon(newFile?.type, null)}
            Create new {newFile?.type || "File"}
          </span>
          <Input
            ref={inputRef}
            placeholder="Enter file name..."
            value={newFile?.name || ""}
            onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleAddBlankFile()}
          />
        </Label>

        <div className="flex gap-2 justify-end px-4">
          <Button
            variant="ghost"
            size="lg"
            className="text-sm rounded-xl"
            onClick={() => {
              setNewFile({ name: '', type: '' });
              setShowNewDocumentPanel(true);
            }}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleAddBlankFile}
            disabled={!newFile?.name?.trim()}
            className="bg-blue-500/90 text-white rounded-xl hover:bg-blue-500"
          >
            Add File
          </Button>
        </div>
      </div>
    );
  };

  const renderUploadedFilesList = () => (
    <div className="h-full w-full overflow-y-auto p-4">
      {documentsList?.length > 0 ? (
        <div className="space-y-2">
          {documentsList?.map((item) => (
            <div
              key={item.ID}
              onClick={() => handleSelectDocument(item)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${selectedDocumentId === item.ID ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0 max-w-[250px] xl:max-w-full">
                <div className="flex-shrink-0">
                  {getFileIcon(item.FileName)}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm font-medium whitespace-nowrap text-ellipsis overflow-hidden">
                    {item.FileName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <FolderOpen className="w-10 h-10 mb-2" />
          <p className="text-sm">No documents available</p>
        </div>
      )}
    </div>
  );

  // Main Render
  return (
    <Card className={`flex flex-col h-full rounded-2xl w-full ${activeTab === 'uploadedFiles' || activeTab === 'documentSearch' ? 'max-w-2xl lg:max-w-2xl' : ''} min-w-sm lg:min-w-md border`}>
      <CardHeader className="flex-shrink-0 h-12 px-4 border-b flex items-center justify-center">
        <div className="flex justify-between items-center w-full">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full p-0"
          >
            <TabsList className="w-full p-0 flex items-center gap-1">
              {tabConfig.showUpload && (
                <TabsTrigger
                  value="upload"
                  className="rounded-md shadow-none text-xs py-1.5 px-4 h-full text-muted-foreground data-[state=active]:shadow-none data-[state=active]:bg-gray-100"
                >
                  Upload
                </TabsTrigger>
              )}

              {tabConfig.showUploadedFiles && (
                <TabsTrigger
                  value="uploadedFiles"
                  className="rounded-md shadow-none text-xs py-1.5 px-4 h-full text-muted-foreground data-[state=active]:shadow-none data-[state=active]:bg-gray-100"
                  disabled={!documentsList}
                >
                  Uploaded Files
                </TabsTrigger>
              )}

              {tabConfig.showDocumentSearch && (
                <TabsTrigger
                  value="documentSearch"
                  className="rounded-md shadow-none text-xs py-1.5 px-4 h-full text-muted-foreground data-[state=active]:shadow-none data-[state=active]:bg-gray-100"
                >
                  Show Files
                </TabsTrigger>
              )}

              {tabConfig.showUpload && tabConfig.showManageFolders && (
                <span className="text-gray-300 px-1">|</span>
              )}

              {/* {tabConfig.showManageFolders && (
                <TabsTrigger
                  value="manageFolders"
                  className="rounded-md shadow-none text-xs py-1.5 px-4 h-full text-muted-foreground data-[state=active]:shadow-none data-[state=active]:bg-gray-100"
                >
                  Manage Folders
                </TabsTrigger>
              )} */}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
 <Toaster side=""/> 
      <CardContent className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden">
        <Tabs value={activeTab} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto min-h-0">

            {tabConfig.showUpload && (
              <TabsContent value="upload" className="h-full m-0 p-4 flex flex-col">
                <div className="flex-1 flex w-full gap-3 min-h-0">
                  {renderUploadArea()}

                  {showNewDocumentPanel ? (
                    renderNewDocumentPanel()
                  ) : (
                    <>
                      {uploadState.files?.length > 0 && !newFile.type && (
                        <div className="flex flex-col gap-3 w-full min-w-1/2 overflow-y-auto">
                          {renderPropertiesPanel()}
                          {renderFilesList()}
                        </div>
                      )}

                      {newFile.type && renderNewFileForm()}
                    </>
                  )}
                </div>

                {/* Fixed bottom buttons for upload tab */}
                {uploadState.files?.length > 0 && !newFile.type && !showNewDocumentPanel && (
                  <div className="flex-shrink-0 w-full flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      className="text-muted-foreground text-sm w-[90px] hover:bg-gray-200"
                      onClick={handleClearClick}
                    >
                      Clear
                    </Button>
                    <Button
                      disabled={uploadState.files.length === 0 || uploadState.files.length > MAX_FILES || isLoading}
                      className="bg-gray-900/90 text-sm min-w-[90px] text-white px-4 py-2 rounded-lg hover:bg-gray-900"
                      onClick={handleUploadFile}
                    >
                      {isLoading ? <Loader width={4} height={4} /> : "Upload"}
                    </Button>
                  </div>
                )}
              </TabsContent>
            )}

            {tabConfig.showUploadedFiles && (
              <TabsContent value="uploadedFiles" className="h-full m-0">
                {renderUploadedFilesList()}
              </TabsContent>
            )}

            {tabConfig.showDocumentSearch && (
              <TabsContent value="documentSearch" className="h-full m-0 p-0">
                <div className="w-full h-full flex flex-col">
                  {selectedFolder ? (
                    <>
                      {/* Info banner */}
                      <div className="flex-shrink-0 px-4 py-3 bg-blue-50 border-b border-blue-100">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            Searching in: <span className="font-medium">{selectedFolder.name}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Iframe container */}
                      <div className="flex-1 w-full overflow-hidden relative bg-white">
                        {/* Loading state */}
                        {iframeLoading && !iframeError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                              <p className="text-sm text-gray-600">Loading document search...</p>
                            </div>
                          </div>
                        )}

                        {/* Error state */}
                        {iframeError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                            <div className="flex flex-col items-center gap-3 p-8 text-center">
                              <AlertCircle className="w-12 h-12 text-red-500" />
                              <h3 className="text-lg font-semibold text-gray-900">Failed to Load</h3>
                              <p className="text-sm text-gray-600 max-w-md">
                                Unable to load the document search interface. Please check your connection and try again.
                              </p>
                              <Button
                                onClick={() => {
                                  setIframeError(false);
                                  setIframeLoading(true);
                                }}
                                className="mt-2"
                              >
                                Retry
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Iframe */}
                        <iframe
                          key={selectedFolder.id} // Force reload on folder change
                          src={getDocumentSearchUrl()}
                          className="w-full h-full border-0"
                          title="Document Search"
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                          onLoad={() => {
                            setIframeLoading(false);
                            setIframeError(false);
                          }}
                          onError={() => {
                            setIframeLoading(false);
                            setIframeError(true);
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8">
                      <Search className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Folder Selected</h3>
                      <p className="text-sm text-gray-600 text-center max-w-md">
                        Please select a folder from the sidebar to search for documents.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {tabConfig.showManageFolders && (
              <TabsContent value="manageFolders" className="h-full m-0 p-0">
                {renderManageFoldersContent()}
              </TabsContent>
            )}
          </div>
        </Tabs>
      </CardContent>

        
    </Card>
  );
};

export default UploadTab;