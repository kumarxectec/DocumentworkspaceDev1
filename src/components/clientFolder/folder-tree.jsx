import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Loader2,
  X,
  Search,
} from "lucide-react";
import useStore from "@/store/useStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

// Layout constants
const LAYOUT = {
  ROW_HEIGHT: 32,
  INDENT: 20,
  BASE_PADDING: 12,
  CONNECTOR_WIDTH: 1,
};

// Utility function to build folder hierarchy connectors
const buildHierarchyLines = (level) => {
  if (level === 0) return null;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 pointer-events-none"
      style={{ width: `${level * LAYOUT.INDENT + LAYOUT.BASE_PADDING}px` }}
      aria-hidden="true"
    >
      {Array.from({ length: level }).map((_, i) => (
        <div
          key={`vertical-${i}`}
          className="absolute top-0 bottom-0"
          style={{
            left: `${i * LAYOUT.INDENT + LAYOUT.INDENT / 2 + LAYOUT.BASE_PADDING}px`,
            width: `${LAYOUT.CONNECTOR_WIDTH}px`,
            backgroundColor: "var(--vscode-tree-connector, rgba(128,128,128,0.18))",
          }}
        />
      ))}
      <div
        className="absolute"
        style={{
          left: `${(level - 1) * LAYOUT.INDENT + LAYOUT.INDENT / 2 + LAYOUT.BASE_PADDING}px`,
          top: "50%",
          height: "1px",
          width: `${LAYOUT.INDENT / 2}px`,
          backgroundColor: "var(--vscode-tree-connector, rgba(128,128,128,0.18))",
        }}
      />
    </div>
  );
};

// Search Result Item Component
const SearchResultItem = ({ folder, onSelect, highlightTerm, closeDropdown, selectedFolderPath }) => {
  const pathParts = folder.path.split(/[\\/\\\\]/).filter(Boolean);

  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-600 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Display path relative to selected folder or hide first 3 segments if no folder selected
  let displayPath;
  if (selectedFolderPath) {
    // Show path relative to selected folder
    const selectedPathParts = selectedFolderPath.split(/[\\/\\\\]/).filter(Boolean);
    const currentPathParts = folder.path.split(/[\\/\\\\]/).filter(Boolean);
    
    // Find where paths diverge and show from selected folder onwards
    let startIndex = 0;
    for (let i = 0; i < selectedPathParts.length; i++) {
      if (selectedPathParts[i] === currentPathParts[i]) {
        startIndex = i + 1;
      } else {
        break;
      }
    }
    
    const displayParts = currentPathParts.slice(startIndex);
    displayPath = displayParts.length ? displayParts.join(' > ') : folder.folderName;
  } else {
    // No folder selected: hide first 3 segments
    const displayParts = pathParts.slice(3);
    displayPath = displayParts.length ? displayParts.join(' > ') : pathParts.join(' > ');
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeDropdown();
    onSelect(folder);
  };

  return (
    <div
      className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <Folder className="h-4 w-4 text-yellow-600 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {highlightText(folder.folderName, highlightTerm)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {displayPath}
          </div>
        </div>
      </div>
    </div>
  );
};

// Folder Item Component
const FolderItem = React.memo(({
  folder,
  level = 0,
  expandedFolders,
  toggleFolder,
  selectedFolder,
  onFolderSelect,
}) => {
  const {
    folderLoading,
    setFolderLoading,
    setSelectedClientFolder,
    handleUploadFolderClick,
    selectedUploadFolder,
    selectedTabs,
    setSelectedTabs,
    setFolderTemplatesList,
    activeTab,
    setActiveTab,
    setDocumentsList,
    setSelectedCollection,
    setUploadedFiles,
    setSelectedFolderTemplates,
    resetFileDocumentTitles,
    setIsUploadable,
    setSelectedUploadFolder,
    setSelectedFolderNode
  } = useStore();

  const itemRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const folderPath = folder?.path || '';
  const folderName = folder?.folderName || 'Unnamed Folder';
  const childFolders = folder?.childFolder || [];

  const isExpanded = expandedFolders.includes(folderPath);
  const hasChildren = childFolders.length > 0;
  const isSelected = selectedUploadFolder?.path === folderPath;
  const isLoading = folderLoading[folderPath];

  // Scroll into view when selected (Critical for search navigation)
  useEffect(() => {
    if (isSelected && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isSelected]);

  const updateClientUploadTab = useCallback((isUploadable) => {
    const currentTabs = selectedTabs?.options || [];
    const alreadyHasClientUpload = currentTabs.some(
      (tab) => tab.name === "ClientUpload"
    );

    if (!alreadyHasClientUpload) {
      setSelectedTabs({
        options: [
          ...currentTabs,
          {
            id: 9997,
            name: "ClientUpload",
            seq: 1,
          },
        ],
      });
    }

    setIsUploadable(isUploadable);
  }, [selectedTabs, setSelectedTabs, setIsUploadable]);

  const handleFolderSelect = useCallback(async (e) => {
    e?.stopPropagation?.();

    if (activeTab !== "upload") {
      setActiveTab("upload");
      setDocumentsList([]);
    }

    const updatedTabs = (selectedTabs?.options || []).filter(
      (t) => t.name !== "Client Metadata"
    );
    setSelectedTabs({ options: updatedTabs });

    const liveFolder = folder;
    const isUploadable = folder?.canUpload === true;

    if (!isExpanded) {
      setFolderLoading(folderPath, true);
      try {
        setFolderTemplatesList(liveFolder?.templates || []);
        updateClientUploadTab(isUploadable);
        setFolderLoading(folderPath, false);
        setSelectedFolderNode(liveFolder)
      } catch (error) {
        console.error("Error fetching folder tree:", error);
        setFolderLoading(folderPath, false);
      }
      toggleFolder(folderPath, folder);
    } else {
      setFolderTemplatesList(liveFolder?.templates || []);
      updateClientUploadTab(isUploadable);
      setSelectedFolderNode(liveFolder)
    }

    handleUploadFolderClick(liveFolder);
    setSelectedClientFolder(liveFolder?.path);
    setSelectedCollection(null);
    setUploadedFiles([]);
    setSelectedFolderTemplates(null);
    resetFileDocumentTitles();
    setIsUploadable(isUploadable);

    if (onFolderSelect) onFolderSelect(liveFolder);
  }, [
    folder,
    folderPath,
    isExpanded,
    activeTab,
    selectedTabs,
    setActiveTab,
    setDocumentsList,
    setSelectedTabs,
    setFolderLoading,
    setFolderTemplatesList,
    updateClientUploadTab,
    toggleFolder,
    handleUploadFolderClick,
    setSelectedClientFolder,
    setSelectedCollection,
    setUploadedFiles,
    setSelectedFolderTemplates,
    resetFileDocumentTitles,
    setIsUploadable,
    onFolderSelect,
    setSelectedFolderNode,
  ]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    const isRoot = level === 0;

    toggleFolder(folderPath, folder, isRoot);

    if (!isExpanded) {
      const liveFolder = folder;
      const isUploadable = liveFolder?.canUpload === true;

      updateClientUploadTab(isUploadable);
      setSelectedUploadFolder(liveFolder);
      setSelectedFolderNode(liveFolder)
    }
    setSelectedFolderNode(folder)
  }, [
    level,
    folderPath,
    folder,
    isExpanded,
    toggleFolder,
    updateClientUploadTab,
    setSelectedUploadFolder,
    setSelectedFolderNode,
  ]);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file || !folder) return;

    try {
      setFolderLoading((prev) => ({ ...prev, [folderPath]: true }));
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderPath", folderPath);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      console.log("✅ Upload successful:", data);
    } catch (error) {
      console.error("❌ Upload error:", error);
    } finally {
      setFolderLoading((prev) => ({ ...prev, [folderPath]: false }));
      event.target.value = "";
    }
  }, [folder, folderPath, setFolderLoading]);

  if (!folder) return null;

  return (
    <div className="relative">
      {buildHierarchyLines(level)}

      <ContextMenu>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <ContextMenuTrigger asChild>
                <div
                  ref={containerRef}
                  className={cn(
                    "relative flex items-center cursor-pointer text-xs outline-none transition-colors group",
                    {
                      "bg-blue-500/10 dark:bg-blue-500/20": isSelected,
                      "hover:bg-gray-100 dark:hover:bg-gray-800": !isSelected,
                    }
                  )}
                  onContextMenu={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={handleFolderSelect}
                  style={{
                    paddingLeft: `${level * LAYOUT.INDENT + LAYOUT.BASE_PADDING}px`,
                    height: `${LAYOUT.ROW_HEIGHT}px`,
                  }}
                >
                  <div
                    className="flex items-center justify-center mr-2 cursor-pointer"
                    onClick={handleToggle}
                    role="button"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {hasChildren ? (
                      isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                      ) : isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      )
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>

                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                  )}

                  <span
                    ref={itemRef}
                    className={cn("truncate", {
                      "font-semibold text-gray-900": isSelected,
                      "text-gray-700": !isSelected,
                    })}
                    style={{ lineHeight: `${LAYOUT.ROW_HEIGHT}px` }}
                  >
                    {folderName}
                  </span>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                </div>
              </ContextMenuTrigger>
            </TooltipTrigger>

            <TooltipContent
              side="top"
              align="center"
              sideOffset={8}
              className="bg-gray-900 text-white text-xs p-2 rounded shadow-lg"
            >
              <p className="text-sm break-words">{folderName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ContextMenu>

      {isExpanded &&
        hasChildren &&
        childFolders.map((child) => (
          <FolderItem
            key={child.path}
            folder={child}
            level={level + 1}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            selectedFolder={selectedFolder}
            onFolderSelect={onFolderSelect}
          />
        ))}
    </div>
  );
});

FolderItem.displayName = 'FolderItem';

// Main ClientTree Component
const ClientTree = ({ onFolderSelect }) => {
  const {
    selectedFolderTree,
    selectedUploadFolder,
    setSelectedUploadFolder,
    activeTab,
    setActiveTab,
    setDocumentsList,
    setFolderTemplatesList,
    handleUploadFolderClick,
    setSelectedClientFolder,
    setSelectedCollection,
    setUploadedFiles,
    setSelectedFolderTemplates,
    resetFileDocumentTitles,
    setIsUploadable,
    selectedTabs,
    setSelectedTabs,
    setFolderLoading,
    setSelectedFolderNode
  } = useStore();

  const [expandedFolders, setExpandedFolders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState("");
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-focus search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const updateClientUploadTab = useCallback((isUploadable) => {
    const currentTabs = selectedTabs?.options || [];
    const alreadyHasClientUpload = currentTabs.some(
      (tab) => tab.name === "ClientUpload"
    );

    if (!alreadyHasClientUpload) {
      setSelectedTabs({
        options: [
          ...currentTabs,
          {
            id: 9997,
            name: "ClientUpload",
            seq: 1,
          },
        ],
      });
    }

    setIsUploadable(isUploadable);
  }, [selectedTabs, setSelectedTabs, setIsUploadable]);

  
  const { parentMap, allFoldersList } = useMemo(() => {
    const parentMap = {};
    const allFolders = [];

    function walk(node, parentPath = null) {
      if (!node) return;
      parentMap[node.path] = parentPath;
      allFolders.push(node);

      if (node.childFolder && node.childFolder.length > 0) {
        node.childFolder.forEach((c) => walk(c, node.path));
      }
    }

    if (selectedFolderTree?.folder) {
      walk(selectedFolderTree.folder, null);
    }
    return { parentMap, allFoldersList: allFolders };
  }, [selectedFolderTree]);

  // Get all descendant folders of a given folder
  const getDescendantFolders = useCallback((folder) => {
    const descendants = [];
    
    function collectDescendants(node) {
      if (!node) return;
      
      if (node.childFolder && node.childFolder.length > 0) {
        node.childFolder.forEach((child) => {
          descendants.push(child);
          collectDescendants(child);
        });
      }
    }
    
    collectDescendants(folder);
    return descendants;
  }, []);

  // Get search scope based on selected folder
  const getSearchScope = useCallback(() => {
    if (!selectedUploadFolder) {
      // No folder selected: search all folders
      return allFoldersList;
    }
    
    // Folder selected: search only current folder and its descendants
    const descendants = getDescendantFolders(selectedUploadFolder);
    return [selectedUploadFolder, ...descendants];
  }, [selectedUploadFolder, allFoldersList, getDescendantFolders]);

  const computeAncestorPaths = useCallback((path) => {
    const ancestors = [];
    let cur = parentMap[path];
    while (cur) {
      ancestors.push(cur);
      cur = parentMap[cur];
    }
    return ancestors;
  }, [parentMap]);

  // Format path for display (remove first 3 segments)
  const formatPathForDisplay = useCallback((path) => {
    if (!path) return "";
    const pathParts = path.split(/[\\/\\\\]/).filter(Boolean);
    const displayParts = pathParts.slice(3);
    return displayParts.length ? displayParts.join(' > ') : path;
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim()) {
      const lowerTerm = value.toLowerCase();
      const searchScope = getSearchScope();
      
      const results = searchScope.filter(folder =>
        (folder.folderName || '').toLowerCase().includes(lowerTerm)
      );
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [getSearchScope]);

  // Clear search term only - keep all folder selections intact
  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
    
    // Refocus the input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle folder selection from search results
  const handleSearchResultSelect = useCallback(async (folder) => {
    if (!folder) return;

    const folderPath = folder.path;
    const isUploadable = folder?.canUpload === true;

    // --- same as handleFolderSelect ---
    if (activeTab !== "upload") {
      setActiveTab("upload");
      setDocumentsList([]);
    }

    const updatedTabs = (selectedTabs?.options || []).filter(
      (t) => t.name !== "Client Metadata"
    );
    setSelectedTabs({ options: updatedTabs });

    const ancestors = computeAncestorPaths(folderPath);
    setExpandedFolders(ancestors);

    // Set loading and templates
    setFolderLoading(folderPath, true);
    try {
      setFolderTemplatesList(folder?.templates || []);
      updateClientUploadTab(isUploadable);
      setFolderLoading(folderPath, false);
      setSelectedFolderNode(folder);
    } catch (error) {
      console.error("Error:", error);
      setFolderLoading(folderPath, false);
    }

    // Same base operations
    handleUploadFolderClick(folder);
    setSelectedClientFolder(folderPath);
    setSelectedUploadFolder(folder);

    setSelectedCollection(null);
    setUploadedFiles([]);
    setSelectedFolderTemplates(null);
    resetFileDocumentTitles();
    setIsUploadable(isUploadable);

    if (onFolderSelect) onFolderSelect(folder);

    // Hide dropdown + clear search
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false); 
    setSelectedFolderPath(folderPath);

  }, [
    activeTab,
    selectedTabs,
    computeAncestorPaths,
    setExpandedFolders,
    setActiveTab,
    setDocumentsList,
    setSelectedTabs,
    setFolderLoading,
    setFolderTemplatesList,
    updateClientUploadTab,
    setSelectedFolderNode,
    handleUploadFolderClick,
    setSelectedClientFolder,
    setSelectedUploadFolder,
    setSelectedCollection,
    setUploadedFiles,
    setSelectedFolderTemplates,
    resetFileDocumentTitles,
    setIsUploadable,
    onFolderSelect,
  ]);


  // Toggle folder expansion/collapse
  const toggleFolder = useCallback((path, folder = undefined, isRoot = false) => {
    setExpandedFolders((prev) => {
      const isCurrentlyExpanded = prev.includes(path);

      if (isCurrentlyExpanded) {
        const pathsToRemove = new Set([path]);

        const findDescendantPaths = (currentFolder) => {
          if (currentFolder?.childFolder?.length) {
            for (const child of currentFolder.childFolder) {
              pathsToRemove.add(child.path);
              findDescendantPaths(child);
            }
          }
        };

        if (folder) findDescendantPaths(folder);
        return prev.filter((p) => !pathsToRemove.has(p));
      } else {
        return [...prev, path];
      }
    });

    if (isRoot) {
      setSelectedUploadFolder("");
    }
  }, [setSelectedUploadFolder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate placeholder text - show folder name when selected
  const placeholderText = selectedUploadFolder
    ? `Search in ${selectedUploadFolder.folderName}`
    : "Search for folder";

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {!selectedFolderTree?.folder ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 italic">
          No folder data available.
        </div>
      ) : (
        <>
          {/* Search Section */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={placeholderText}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full text-sm pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500"
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {searchResults.map((folder) => (
                    <SearchResultItem
                      key={folder.path}
                      folder={folder}
                      onSelect={() => handleSearchResultSelect(folder)}
                      highlightTerm={searchTerm}
                      closeDropdown={() => setShowDropdown(false)}
                      selectedFolderPath={selectedUploadFolder?.path}
                    />
                  ))}
                </div>
              )}

              {/* No Results Message */}
              {showDropdown && searchResults.length === 0 && searchTerm.trim() && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    No folders found matching "{searchTerm}"
                    {selectedUploadFolder && " in selected folder"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Folder Tree */}
          <div className="flex-1 overflow-auto">
            {selectedFolderTree?.folder && (
              <FolderItem
                folder={selectedFolderTree.folder}
                level={0}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                selectedFolder={selectedUploadFolder}
                onFolderSelect={onFolderSelect}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientTree;