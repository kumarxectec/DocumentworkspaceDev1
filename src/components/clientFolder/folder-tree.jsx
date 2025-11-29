import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";
import useStore from "@/store/useStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FolderTreeShimmer from "./folder-shimmer";
import { cn } from "@/lib/utils";

// ShadCN Context Menu components (project path assumed similar to tooltip's)
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

import { errorToastObj, getFileIcon, successToastObj } from "@/lib/constants";
import { toast } from "sonner";

// Layout tokens
const TOKENS = {
  ROW_HEIGHT: 24,
  ICON_SIZE: 14,
  CHEVRON_SIZE: 12,
  INDENT: 12,
  BASE_PADDING: 8,
  CONNECTOR_WIDTH: 1,
  FONT_SIZE: 12,
};

const FolderItem = ({ folder, level = 0, expandedFolders, toggleFolder }) => {
  const {
    getFolderTreeByPath,
    folderLoading,
    setFolderLoading,
    setSelectedClientFolder,
    setSelectedTabs,
    handleUploadFolderClick,
    selectedUploadFolder,
    selectedTabs,
    setFolderTemplatesList,
    activeTab,
    setActiveTab,
    setDocumentsList,
    setSelectedCollection,
    setUploadedFiles,
    setSelectedFolderTemplates,
    resetFileDocumentTitles,
    setIsUploadable,
    pasteDocumentMainPath,
    isUploadable,
    setFolderTreePath,
    pasteClipboardButtonEnable,
    setPasteTrigger,
    folderTreePath,
    setSelectedIds,
    setSelectedFolderNode
  } = useStore();

  const itemRef = useRef(null);
  const containerRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
 const setPasteClipboardButtonEnable = useStore(
  (state) => state.setPasteClipboardButtonEnable
);
  const isExpanded = expandedFolders.includes(folder?.path);

  const hasLoadedChildren =
    folder?.childFolder && folder?.childFolder.length > 0;
  const isSelected = selectedUploadFolder?.path === folder?.path;
  const isLoading = folderLoading[folder?.path];

  // Check if text is truncated
  const checkTruncation = useCallback(() => {
    if (itemRef.current && containerRef.current) {
      const textElement = itemRef.current;
      const container = containerRef.current;
      const isOverflowing =
        textElement.scrollWidth > container.clientWidth - 50; // 50px buffer for icons
      setShowTooltip(isOverflowing);
    }
  }, []);

  React.useEffect(() => {
    checkTruncation();
    const resizeObserver = new ResizeObserver(checkTruncation);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [checkTruncation, folder?.folderName]);

  const handleToggle = async (e) => {
    // stopPropagation so parent click/select doesn't trigger
    e?.stopPropagation?.();
  // 🔥 Always read CopyData

    if (!isExpanded) {
      setFolderLoading(folder?.path, true);
      const res = await getFolderTreeByPath(folder?.path, true);
      setFolderLoading(folder?.path, false);
      setFolderTreePath(folder?.path)
 
      const liveFolder = res?.folder || folder;
      const isUploadable = liveFolder?.canUpload === true;

      setSelectedFolderNode(liveFolder)
      updateClientUploadTab(isUploadable);
    }
    
    // pass the folder node so toggleFolder can collapse descendants when needed
    setSelectedFolderNode(folder)
    toggleFolder(folder?.path, folder);
  };

  const handleFolderSelect = async (e) => {
    // If invoked via right click/context menu trigger, "e" could be a SyntheticEvent from ContextMenuTrigger
    e?.stopPropagation?.();
    if(activeTab !== 'upload'){
      setActiveTab('upload')
      
    setDocumentsList([])
    }
  const saved = localStorage.getItem("CopyData");
  if (!saved) {
    setPasteClipboardButtonEnable(false);
  } else {
    try {
      const parsed = JSON.parse(saved);
      const ids = Array.isArray(parsed.ID) ? parsed.ID : [];

      console.log("Clipboard IDs:", ids);

      setPasteClipboardButtonEnable(ids.length > 0);
    } catch (err) {
      console.error("❌ Error parsing CopyData:", err);
      setPasteClipboardButtonEnable(false);
    }
  }
    const updatedTabs = selectedTabs.options.filter(
      (t) => t.name !== "Client Metadata"
    );
    setSelectedTabs({ options: updatedTabs });


    if (!isExpanded) {
      setFolderLoading(folder?.path, true);
      const res = await getFolderTreeByPath(folder?.path, true);
      setFolderLoading(folder?.path, false);
       setFolderTreePath(folder?.path)

      const liveFolder = res?.data?.folder || folder;
      const isUploadable = liveFolder?.canUpload === true;
      console.log(liveFolder, 'live folder in folder tree -------')
      setFolderTemplatesList(liveFolder?.templates  )

      updateClientUploadTab(isUploadable);
      toggleFolder(folder?.path, folder);
      setSelectedFolderNode(liveFolder)
    } else {
      const liveFolder = folder;
      const isUploadable = liveFolder?.canUpload === true;
      setFolderTemplatesList(liveFolder?.templates  )
      
      setSelectedFolderNode(liveFolder)
      updateClientUploadTab(isUploadable);
    }

    handleUploadFolderClick(folder);
    setSelectedCollection(null)
    setUploadedFiles([]);
    setSelectedFolderTemplates(null)
    resetFileDocumentTitles()
    // console.log(folder, 'folder in handleFolderSelect - folder-tree');
  };

  const updateClientUploadTab = (isUploadable) => {
    const currentTabs = selectedTabs?.options || [];

    // Always keep the ClientUpload tab
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

    // Update global uploadable state
    setIsUploadable(isUploadable);
  };
  // Copy folder name to clipboard
  const handleCopyFolderName = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      await navigator.clipboard.writeText(folder?.folderName || "");
      // optional: small visual feedback could be implemented here
    } catch (err) {
      console.error("Failed to copy folder name:", err);
    }
  };

  const handleCopyFolderPath = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    try {
      await navigator.clipboard.writeText(folder?.path || "");
      // optional: small visual feedback could be implemented here
    } catch (err) {
      console.error("Failed to copy folder name:", err);
    }
  };


   const handlePasteFolderPath = async () => {
      try {
        //   const getData= localStorage.getItem("CopyData")
  
        //       // Now run async code OUTSIDE setState
        // const newIds = updatedDocs.map((d) => d.id);
        // setSelectedIds(newIds);
        // updateLocalStorage(newIds);
  
        // ✅ Now await is allowed
        // const pasteResponse = await getDocumentFileNameByID(newIds);
  
        // const res = getFolderTreeByPath(folder?.path, true);
        // const liveFolder = res?.folder || folder;
        // const isUploadable = liveFolder?.canUpload === true;
        // console.log("Pasted folder path:", folder?.path );
        // setFolderTreePath(folder?.path)
        const saved = localStorage.getItem("CopyData");
        // 🔥 Fire trigger so Component B re-runs
        setPasteTrigger(Date.now());
        if (!saved) {
          toast.error("No files have been copied");
          return;
        }
  
        // 🔹 Parse the saved data
        const parsed = JSON.parse(saved);
  
        // ✅ Build payload using saved IDs
        let payload = {
          DocType: parsed?.DocType || "D",
          ID: parsed?.ID || [],
          TargetType: "Folder",
          TargetFolder: folderTreePath || "",
        };
  
        if (isUploadable) {
          // const pasteResponse = await pasteDocumentMainPath(payload);
          toast.success('Pasted Successfully', successToastObj)
        } else {
          toast.error("Paste is not allowed");
        }
  
      } catch (err) {
        toast.error(err.message, errorToastObj);
      }
    }

  // Hierarchy connector lines
  const hierarchy = useMemo(
    () => (
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{ width: `${level * TOKENS.INDENT + TOKENS.BASE_PADDING}px` }}
        aria-hidden
      >
        {Array.from({ length: level }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${
                i * TOKENS.INDENT + TOKENS.INDENT / 2 + TOKENS.BASE_PADDING
              }px`,
              width: `${TOKENS.CONNECTOR_WIDTH}px`,
              backgroundColor:
                "var(--vscode-tree-connector, rgba(128,128,128,0.18))",
            }}
          />
        ))}

        {level > 0 && (
          <div
            style={{
              left: `${
                (level - 1) * TOKENS.INDENT +
                TOKENS.INDENT / 2 +
                TOKENS.BASE_PADDING
              }px`,
              top: "50%",
              height: "1px",
              width: `${TOKENS.INDENT / 2}px`,
              backgroundColor:
                "var(--vscode-tree-connector, rgba(128,128,128,0.18))",
            }}
            className="absolute"
          />
        )}
      </div>
    ),
    [level]
  );

  return (
    <div className="relative">
      {hierarchy}

      {/* ContextMenu wraps the clickable folder row and will open on right click */}
      <ContextMenu>
        <TooltipProvider delayDuration={500}>
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
                  onClick={handleFolderSelect}
                  onContextMenu={(e) => {
                    // allow ContextMenuTrigger to detect right-click; stopPropagation so parent handlers don't run
                    e.stopPropagation();
                  }}
                  style={{
                    paddingLeft: `${
                      level * TOKENS.INDENT + TOKENS.BASE_PADDING
                    }px`,
                    paddingRight: "12px",
                    height: `${TOKENS.ROW_HEIGHT}px`,
                    minHeight: `${TOKENS.ROW_HEIGHT}px`,
                    minWidth: "max-content",
                  }}
                >
                  {/* Selection indicator bar */}
                  {isSelected && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"
                      aria-hidden="true"
                    />
                  )}

                  {/* Expand/collapse chevron */}
                  <div
                    className="flex items-center justify-center flex-shrink-0 mr-1"
                    style={{ width: "18px", height: "18px" }}
                    onClick={handleToggle}
                    role="button"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                    ) : isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>

                  {/* Folder icon */}
                  <div
                    className="flex items-center justify-center flex-shrink-0 mr-1.5"
                    style={{ width: "16px", height: "16px" }}
                  >
                    {isExpanded ? (
                      <FolderOpen className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                    )}
                  </div>

                  {/* Folder label */}
                  <span
                    ref={itemRef}
                    className={cn("text-xs select-none whitespace-nowrap", {
                      "text-gray-900 dark:text-gray-100 font-medium":
                        isSelected,
                      "text-gray-700 dark:text-gray-300": !isSelected,
                    })}
                    style={{
                      lineHeight: `${TOKENS.ROW_HEIGHT}px`,
                    }}
                  >
                    {folder?.folderName}
                  </span>
                </div>
              </ContextMenuTrigger>
            </TooltipTrigger>

            <TooltipContent
              side="top"
              align="right"
              sideOffset={8}
              className="max-w-md z-50"
            >
              <p className="text-xs break-words">{folder?.folderName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ContextMenuContent
          align="start"
          sideOffset={6}
          className="w-44 rounded-md border border-border/40 bg-popover shadow-lg"
        >
          <ContextMenuItem
            onSelect={() => {
              handleCopyFolderName();

            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <Copy className="h-4 w-4 text-muted-foreground/80" />
            Copy Folder Name
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              handleCopyFolderPath()
              
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <Copy className="h-4 w-4 text-muted-foreground/80" />
            Copy Folder Path
          </ContextMenuItem>
      {isUploadable && pasteClipboardButtonEnable && (
           <ContextMenuItem className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
           onSelect={handlePasteFolderPath}>
             <Copy className="h-4 w-4 text-muted-foreground/80" />
             Paste Here 
           </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Children */}
      {isExpanded && hasLoadedChildren && (
        <div role="group">
          {folder?.childFolder.map((child) => (
            <FolderItem
              key={child?.path}
              folder={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ClientTree = () => {
  const { selectedFolderTree, selectedFolder } = useStore();
  const [expandedFolders, setExpandedFolders] = useState([]);
  const folderPaths = useRef([]);
  const scrollContainerRef = useRef(null);

  React.useEffect(() => {
    if (selectedFolderTree?.folder) {
      const paths = [];
      const extractPaths = (folder) => {
        paths.push(folder?.path);
        if (folder?.childFolder) {
          folder?.childFolder.forEach(extractPaths);
        }
      };
      extractPaths(selectedFolderTree.folder);
      folderPaths.current = paths;
    }
  }, [selectedFolderTree]);

  // helper to collect descendant paths from a folder node
  const collectDescendantPaths = useCallback((folderNode) => {
    const acc = [];
    const traverse = (f) => {
      if (!f) return;
      acc.push(f?.path);
      if (f?.childFolder) {
        f.childFolder.forEach(traverse);
      }
    };
    // don't include the root itself twice in case callers already include it; we'll include it here
    traverse(folderNode);
    return acc;
  }, []);

  // toggleFolder now accepts (path, folderNode)
  const toggleFolder = useCallback(
    (path, folderNode = null) => {
      setExpandedFolders((prev) => {
        console.log(prev,'previiii');
        const isExpanded = prev.includes(path);

        if (isExpanded) {
          // collapse: remove this path and all of its descendant paths
          let descendants = [];
          if (folderNode) {
            descendants = collectDescendantPaths(folderNode);
          } else {
            // fallback: if folderNode not provided, try to collapse only the path
            descendants = [path];
          }

          // ensure we remove all descendant paths from expanded state
          const newState = prev.filter((p) => !descendants.includes(p));
          return newState;
        } else {
          // expand: simply add path (keep existing expanded ones)
          return [...prev, path];
        }
      });
    },
    [collectDescendantPaths]
  );

  const collapseAll = useCallback(() => {
    setExpandedFolders([]);
  }, []);

  const expandAll = useCallback(() => {
    setExpandedFolders(folderPaths.current);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {selectedFolderTree?.folder === null ? (
        <div className="w-full h-full flex justify-center items-center text-xs text-gray-500 dark:text-gray-400 italic p-4">
          No folder data available.
        </div>
      ) : selectedFolderTree?.folder ? (
        <>
          {/* Header */}
          <div className="flex-shrink-0 flex justify-between items-center px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Folder className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
              <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap truncate">
                {selectedFolder?.text || "All"} Folders
              </h3>
            </div>
          </div>

          {/* Scrollable tree container with both X and Y scrolling */}
          <div
            ref={scrollContainerRef}
            role="tree"
            aria-label="File navigator"
            className="flex-1 overflow-auto min-h-0 min-w-0"
            style={{
              scrollbarWidth: "thin",
              scrollbarGutter: "stable",
            }}
          >
            <div className="inline-block min-w-full w-max">
              <FolderItem
                folder={selectedFolderTree?.folder}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex justify-center items-center p-4">
          <FolderTreeShimmer />
        </div>
      )}
    </div>
  );
};

export default ClientTree;
