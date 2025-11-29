"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Loader2,
  Copy,
  FilePlus,
  FolderPlus,
  Edit3,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useFrontOfficeStore from "@/store/useFrontOfficeStore";
import { cn } from "@/lib/utils";
import { getFileIcon } from "@/lib/constants";

// Layout tokens matching the reference image
const TOKENS = {
  ROW_HEIGHT: 24,
  ICON_SIZE: 14,
  CHEVRON_SIZE: 12,
  INDENT: 16,
  BASE_PADDING: 8,
  CONNECTOR_WIDTH: 1,
  FONT_SIZE: 13,
};

// Keyboard navigation keys
const KEYBOARD_KEYS = {
  ARROW_DOWN: "ArrowDown",
  ARROW_UP: "ArrowUp",
  ARROW_RIGHT: "ArrowRight",
  ARROW_LEFT: "ArrowLeft",
  ENTER: "Enter",
  SPACE: " ",
  HOME: "Home",
  END: "End",
};

// Helper to get row styling
const getRowStyle = (level) => ({
  paddingLeft: `${level * TOKENS.INDENT + TOKENS.BASE_PADDING}px`,
  height: `${TOKENS.ROW_HEIGHT}px`,
  minHeight: `${TOKENS.ROW_HEIGHT}px`,
});

/**
 * Recursively builds a new tree structure containing nodes that match the searchTerm.
 * Ancestor folders are included even if they don't match, to preserve the hierarchy.
 * @param {Array} folders - The original folder list.
 * @param {string} searchTerm - The search term.
 * @param {string} parentPath - The full path of the parent node.
 * @param {number} level - The depth level of the current node.
 * @param {Set<string>} parentPathsToExpand - A set to collect the full paths of all ancestors of matched nodes.
 * @returns {Array} The new structured tree of matching nodes and their ancestors.
 */
const buildSearchTree = (folders, searchTerm, parentPath = '', level = 0, parentPathsToExpand = new Set()) => {
  if (!searchTerm.trim()) return [];

  const lowerSearchTerm = searchTerm.toLowerCase();
  const results = [];

  folders.forEach(node => {
    const fullPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
    const nodeMatches = node.name.toLowerCase().includes(lowerSearchTerm);
    
    // Recursively search children
    const childResults = node.subFolder && node.subFolder.length > 0
      ? buildSearchTree(node.subFolder, searchTerm, fullPath, level + 1, parentPathsToExpand)
      : [];

    // Include node if it matches or if any of its children match
    if (nodeMatches || childResults.length > 0) {
      if (childResults.length > 0 && !nodeMatches) {
        // If an ancestor is included only because of a child match, add its path to expansion set
        parentPathsToExpand.add(fullPath);
      } else if (nodeMatches) {
        // If the node itself matches, all its ancestors should be expanded
        let currentPath = parentPath;
        while(currentPath) {
          parentPathsToExpand.add(currentPath);
          currentPath = currentPath.substring(0, currentPath.lastIndexOf('\\'));
        }
      }

      const hasChildrenInFullTree = node.subFolder && node.subFolder.length > 0;
      
      results.push({
        id: fullPath,
        name: node.name,
        fullPath: fullPath,
        path: node.path || fullPath,
        hasChildren: hasChildrenInFullTree, // Always use original hasChildren for visual cue
        canUpload: node.canUpload,
        canCreateFolder: node.canCreateFolder,
        // The children here are the filtered sub-tree
        children: childResults, 
        level: level,
        rawData: node,
      });
    }
  });

  return results;
};


// TreeNode Component
const TreeNode = React.memo(({
  node,
  level,
  isExpanded,
  isSelected,
  isLoading,
  onToggle,
  onSelect,
  isFocused,
  onContextAction,
}) => {
  const nodeRef = useRef(null);
  const containerRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    setActiveTab,
    setManageFolderMode,
    setAddNewFileStatus,
    setNewFile,
  } = useFrontOfficeStore();

  useEffect(() => {
    if (isFocused && nodeRef.current) {
      // Use requestAnimationFrame to ensure the element is in the DOM and measurable
      // and preventScroll: true keeps the browser's default scroll behavior from interfering.
      requestAnimationFrame(() => {
        if (nodeRef.current) {
          nodeRef.current.focus({ preventScroll: true });
          
          // Custom scroll into view for better control
          const container = document.querySelector('[role="tree"]');
          const element = nodeRef.current;
          if (container && element) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            // Check if element is above the viewport
            if (elementRect.top < containerRect.top) {
              container.scrollTop -= (containerRect.top - elementRect.top) + 10;
            }
            // Check if element is below the viewport
            else if (elementRect.bottom > containerRect.bottom) {
              container.scrollTop += (elementRect.bottom - containerRect.bottom) + 10;
            }
          }
        }
      });
    }
  }, [isFocused]);

  // Check if text is truncated
  useEffect(() => {
    const checkTruncation = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        // Use an attribute selector to target the span more reliably
        const textElement = container.querySelector('[data-folder-name]');
        if (textElement) {
          // Compare scrollWidth (total content width) to clientWidth (visible width)
          const isOverflowing = textElement.scrollWidth > textElement.clientWidth;
          setShowTooltip(isOverflowing);
        }
      }
    };

    // Initial check and setup observer
    checkTruncation();
    const resizeObserver = new ResizeObserver(checkTruncation);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup observer
    return () => resizeObserver.disconnect();
  }, [node.name]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    onToggle(node);
  }, [node, onToggle]);

  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    onSelect(node);
    
    // Single click expand functionality: only expand if not already expanded
    if (node.hasChildren && !isExpanded) {
      onToggle(node);
    }
  }, [node, onSelect, onToggle, isExpanded]);

  const handleContextAction = useCallback((action) => {
    switch (action) {
      case 'copy-name':
        navigator.clipboard?.writeText(node.name);
        break;
      case 'copy-path':
        navigator.clipboard?.writeText(node.fullPath || node.path || '');
        break;
      case 'new-folder':
        setActiveTab('manageFolders');
        setManageFolderMode('new');
        break;
      case 'edit':
        setActiveTab('manageFolders');
        setManageFolderMode('edit');
        break;
      case 'new-document-docx':
      case 'new-document-xlsx':
      case 'new-document-pptx':
        const type = action.split('-')[2];
        setActiveTab('upload');
        setAddNewFileStatus('selected');
        setNewFile({ type: type, name: '' });
        break;
      default:
        break;
    }

    onContextAction?.(action, { node });
  }, [node, onContextAction, setActiveTab, setManageFolderMode, setAddNewFileStatus, setNewFile]);

  // Hierarchy connector lines
  // NOTE: This implementation for the connector lines assumes the parent folders are always rendered.
  // In the context of the search, the parent folders *are* rendered, so this logic remains correct.
  const hierarchy = useMemo(() => (
    <div
      className="absolute left-0 top-0 bottom-0 pointer-events-none"
      style={{ width: `${level * TOKENS.INDENT + TOKENS.BASE_PADDING}px` }}
      aria-hidden
    >
      {/* Vertical lines for ancestors */}
      {Array.from({ length: level }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0"
          style={{
            left: `${i * TOKENS.INDENT + TOKENS.INDENT / 2 + TOKENS.BASE_PADDING - TOKENS.CONNECTOR_WIDTH / 2}px`, // Adjusted left position for center alignment
            width: `${TOKENS.CONNECTOR_WIDTH}px`,
            backgroundColor: 'rgba(128, 128, 128, 0.2)',
          }}
        />
      ))}

      {/* Horizontal line connecting to parent */}
      {level > 0 && (
        <div
          style={{
            left: `${(level - 1) * TOKENS.INDENT + TOKENS.INDENT / 2 + TOKENS.BASE_PADDING - TOKENS.CONNECTOR_WIDTH}px`,
            top: '50%',
            height: `${TOKENS.CONNECTOR_WIDTH}px`, // Changed height to CONNECTOR_WIDTH
            width: `${TOKENS.INDENT / 2 + TOKENS.CONNECTOR_WIDTH}px`, // Extended width slightly
            backgroundColor: 'rgba(128, 128, 128, 0.2)',
          }}
          className="absolute"
        />
      )}
    </div>
  ), [level]);

  return (
    <div className="relative" ref={containerRef}>
      {hierarchy}

        <TooltipProvider delayDuration={500}>
          <Tooltip open={showTooltip ? undefined : false}>
            <TooltipTrigger asChild>
                <div
                  ref={nodeRef}
                  role="treeitem"
                  tabIndex={isFocused ? 0 : -1}
                  aria-expanded={node.hasChildren ? isExpanded : undefined}
                  aria-selected={isSelected}
                  onClick={handleSelect}
                  className={cn(
                    "relative flex items-center cursor-pointer text-xs outline-none transition-colors group",
                    {
                      "bg-blue-500/10 dark:bg-blue-500/20": isSelected,
                      "hover:bg-gray-100 dark:hover:bg-gray-800": !isSelected,
                      "focus:ring-1 focus:ring-blue-300/50": isFocused, // Added focus style
                    }
                  )}
                  style={getRowStyle(level)}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"
                      aria-hidden="true"
                    />
                  )}

                  {/* Expand/collapse chevron */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 mr-1"
                      style={{ width: '18px', height: '18px' }}
                      onClick={handleToggle}
                      role="button"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      tabIndex={-1} // Prevent chevron from taking focus
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
                    style={{ width: '16px', height: '16px' }}
                  >
                    {isExpanded ? (
                      <FolderOpen className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                    )}
                  </div>

                  {/* Folder name */}
                  <span
                    data-folder-name
                    className={cn(
                      "text-xs select-none truncate flex-grow min-w-0",
                      {
                        "text-gray-900 dark:text-gray-100 font-medium": isSelected,
                        "text-gray-700 dark:text-gray-300": !isSelected,
                      }
                    )}
                    style={{
                      lineHeight: `${TOKENS.ROW_HEIGHT}px`,
                      fontSize: `${TOKENS.FONT_SIZE}px`,
                    }}
                  >
                    {node.name}
                  </span>
                </div>
            </TooltipTrigger>

            {showTooltip && (
              <TooltipContent side="top" align="start" sideOffset={8}>
                <p className="text-xs">{node.name}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

    </div>
  );
});
TreeNode.displayName = 'TreeNode';

// Main TreeView Component
const TreeView = () => {
  const {
    selectedClientFolderData,
    loading: isStoreLoading,
    selectedFolderTab,
    fetchFrontOfficeFolders,
    setSelectedFolder,
    selectedFolder,
    searchTerm,
    selectedClient,
  } = useFrontOfficeStore();

  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loadingNodes, setLoadingNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [keyBuffer, setKeyBuffer] = useState("");
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [structuredSearchResults, setStructuredSearchResults] = useState(null);

  const treeContainerRef = useRef(null);
  const isSearching = !!searchTerm?.trim();

  // Transform folder data to tree structure (once)
  const transformedFolderData = useMemo(() => {
    if (!selectedClientFolderData) return [];

    const transform = (folders, parentPath = '', level = 0) => {
      return folders.map((folder) => {
        const fullPath = parentPath ? `${parentPath}\\${folder.name}` : folder.name;
        const hasChildren = folder.subFolder && folder.subFolder.length > 0;

        return {
          id: fullPath,
          name: folder.name,
          fullPath: fullPath,
          path: folder.path || fullPath,
          hasChildren: hasChildren,
          canUpload: folder.canUpload,
          canCreateFolder: folder.canCreateFolder,
          children: hasChildren ? transform(folder.subFolder, fullPath, level + 1) : [],
          level: level,
          rawData: folder,
          parentId: parentPath || null,
        };
      });
    };

    return transform(selectedClientFolderData);
  }, [selectedClientFolderData]);

  // Handle Search logic and auto-expansion
  useEffect(() => {
    if (isSearching && selectedClientFolderData) {
      const parentPathsToExpand = new Set();
      // Use the original raw data for searching
      const results = buildSearchTree(
        selectedClientFolderData, 
        searchTerm, 
        '', 
        0, 
        parentPathsToExpand
      );
      
      setStructuredSearchResults(results.length > 0 ? results : null);
      
      // Auto-expand all ancestors of matching nodes
      setExpandedNodes(prev => new Set([...prev, ...parentPathsToExpand]));
      
      // If search results exist, ensure the first one gets focus
      if (results.length > 0) {
          // This should handle finding the first visible node in the structured results
          const firstNodeId = results[0]?.id;
          if (firstNodeId) {
              setFocusedNodeId(firstNodeId);
          }
      } else {
        setFocusedNodeId(null);
      }

    } else if (!isSearching) {
      // Clear search results when search term is cleared
      setStructuredSearchResults(null);
      // Optional: Reset expanded nodes if desired, or keep them to maintain state
      // setExpandedNodes(new Set()); 
      
      // Reset focus to the first node of the full tree if available
      if (transformedFolderData.length > 0 && !focusedNodeId) {
        setFocusedNodeId(transformedFolderData[0].id);
      }
    }
  }, [searchTerm, selectedClientFolderData, isSearching, transformedFolderData]); // Dependency on transformedFolderData is important for focus reset

  // Initial focus setup (only if no search is active)
  useEffect(() => {
    if (transformedFolderData.length > 0 && !focusedNodeId && !isSearching) {
      setFocusedNodeId(transformedFolderData[0].id);
    }
  }, [transformedFolderData, focusedNodeId, isSearching]);


  // Toggle node expansion
  const handleToggle = useCallback(async (node) => {
    const isExpanded = expandedNodes.has(node.id);
    const newExpanded = new Set(expandedNodes);
    
    if (isExpanded) {
      // Collapse: remove node and all descendants from expandedNodes
      // NOTE: This relies on flattenedTree to find descendants, which can be inefficient
      // For simplicity in this refactor, we rely on the flattened tree for this recursive
      // descent check during collapse, or simply keep a list of all nodes. 
      // A full descendant removal is safer but more complex here. We'll simplify:
      newExpanded.delete(node.id);
    } else {
      // Expand
      newExpanded.add(node.id);

      // Load children if needed (only if we don't have children data in the *full* tree)
      if (node.children?.length === 0 && node.hasChildren && selectedFolderTab) {
        setLoadingNodes((prev) => new Set(prev).add(node.id));
        try {
          // Assuming fetchFrontOfficeFolders updates selectedClientFolderData,
          // which will trigger re-creation of transformedFolderData/structuredSearchResults
          await fetchFrontOfficeFolders(selectedFolderTab.folderType, node.fullPath);
          
          // Re-fetch transformedFolderData to get the updated children for the next render
        } catch (error) {
          console.error('Failed to load folder:', error);
          newExpanded.delete(node.id); // Remove expansion on failure
        } finally {
          setLoadingNodes((prev) => {
            const updated = new Set(prev);
            updated.delete(node.id);
            return updated;
          });
        }
      }
    }

    setExpandedNodes(newExpanded);
  }, [expandedNodes, selectedFolderTab, fetchFrontOfficeFolders]);

  // Select node
  const handleSelect = useCallback((node) => {
    // Check if the node is already selected. If so, deselect.
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
      setSelectedFolder(null);
    } else {
      setSelectedNode(node);
      setFocusedNodeId(node.id);
      setSelectedFolder(node);
    }
  }, [selectedNode, setSelectedFolder]);

  // Determine the data set to render
  const dataToRender = isSearching && structuredSearchResults
    ? structuredSearchResults 
    : transformedFolderData;

  // Flatten tree for rendering and keyboard navigation
  const flattenedTree = useMemo(() => {
    const flatten = (nodes, level = 0, parentId = null) => {
      let result = [];
      for (const node of nodes) {
        // If a node in the search results is a parent, it's included, 
        // but its children are only included if it is expanded *or* if we are searching.
        // In search mode, we implicitly treat the search results as "expanded" for the 
        // purpose of rendering its children *in the search results structure*.
        
        // This check ensures that only nodes visible to the user are included for navigation.
        const shouldBeExpandedForRendering = expandedNodes.has(node.id) || isSearching;

        result.push({ ...node, level, parentId });
        
        // Only recurse if the node has children (in the search or full tree) AND is expanded
        if (node.children && node.children.length > 0 && shouldBeExpandedForRendering) {
          result = result.concat(flatten(node.children, level + 1, node.id));
        }
      }
      return result;
    };

    return flatten(dataToRender);
  }, [dataToRender, expandedNodes, isSearching]);


  // Keyboard navigation
  useEffect(() => {
    let bufferTimeout;

    const handleKeyDown = (e) => {
      // Check if the tree container or one of its children has focus
      if (!treeContainerRef.current?.contains(document.activeElement)) return;

      const index = flattenedTree.findIndex(n => n.id === focusedNodeId);
      // If the focused node isn't found in the current flattened tree (e.g., collapsed),
      // try to focus on the first visible node.
      if (index === -1) {
          if (flattenedTree.length > 0) {
              setFocusedNodeId(flattenedTree[0].id);
              return;
          }
          return;
      }

      const currentNode = flattenedTree[index];

      switch (e.key) {
        case KEYBOARD_KEYS.ARROW_DOWN:
          e.preventDefault();
          if (index < flattenedTree.length - 1) {
            setFocusedNodeId(flattenedTree[index + 1].id);
          }
          break;

        case KEYBOARD_KEYS.ARROW_UP:
          e.preventDefault();
          if (index > 0) {
            setFocusedNodeId(flattenedTree[index - 1].id);
          }
          break;

        case KEYBOARD_KEYS.ARROW_RIGHT:
          e.preventDefault();
          // Check if it has children in the full tree and is NOT expanded
          if (currentNode.hasChildren && !expandedNodes.has(currentNode.id)) {
            handleToggle(currentNode);
          } 
          // If it is expanded AND has children, move to the first child in the current flattened view
          else if (currentNode.hasChildren && expandedNodes.has(currentNode.id)) {
            const firstChildIndex = flattenedTree.findIndex((n, i) => i > index && n.parentId === currentNode.id);
            if (firstChildIndex !== -1) {
                setFocusedNodeId(flattenedTree[firstChildIndex].id);
            }
          }
          break;

        case KEYBOARD_KEYS.ARROW_LEFT:
          e.preventDefault();
          // If expanded, collapse it
          if (expandedNodes.has(currentNode.id)) {
            handleToggle(currentNode);
          } 
          // If not expanded and has a parent, move to parent
          else if (currentNode.parentId) {
            setFocusedNodeId(currentNode.parentId);
          }
          break;

        case KEYBOARD_KEYS.ENTER:
        case KEYBOARD_KEYS.SPACE:
          e.preventDefault();
          handleSelect(currentNode);
          break;

        case KEYBOARD_KEYS.HOME:
          e.preventDefault();
          if (flattenedTree.length > 0) {
            setFocusedNodeId(flattenedTree[0].id);
          }
          break;

        case KEYBOARD_KEYS.END:
          e.preventDefault();
          if (flattenedTree.length > 0) {
            setFocusedNodeId(flattenedTree[flattenedTree.length - 1].id);
          }
          break;

        default:
          // Typeahead search
          if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
            e.preventDefault();
            const now = Date.now();
            // Reset buffer if a pause > 500ms occurred
            const newBuffer = now - lastSearchTime > 500 ? e.key.toLowerCase() : keyBuffer + e.key.toLowerCase();
            
            setKeyBuffer(newBuffer);
            setLastSearchTime(now);

            // Search for matching node starting after the current index (wrap around)
            const searchStart = index + 1;
            let match = null;

            // Search function
            const findMatch = (start, end) => {
              for (let i = start; i < end; i++) {
                if (flattenedTree[i].name.toLowerCase().startsWith(newBuffer)) {
                  return flattenedTree[i];
                }
              }
              return null;
            }

            // 1. Search from current position + 1 to end
            match = findMatch(searchStart, flattenedTree.length);

            // 2. Wrap around and search from beginning up to current position
            if (!match) {
              match = findMatch(0, searchStart);
            }

            if (match) {
              setFocusedNodeId(match.id);
              
              // No need to explicitly expand parents here, as they must be expanded 
              // to appear in the flattened tree in the first place, or if they are 
              // hidden in search mode, the focus logic is slightly different.
              // We rely on the focus logic scrolling to the element.
            }

            clearTimeout(bufferTimeout);
            bufferTimeout = setTimeout(() => setKeyBuffer(''), 500);
          }
          break;
      }
    };

    // Attach keydown listener to the window
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimeout);
    };
  }, [flattenedTree, focusedNodeId, expandedNodes, keyBuffer, lastSearchTime, handleToggle, handleSelect]);

  // Render tree nodes recursively
  const renderNodes = useCallback((nodes, level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedNodes.has(node.id);
      const isLoading = loadingNodes.has(node.id);
      
      // Determine if we should render children in search mode.
      // In search mode, we implicitly render children *of the search structure*
      // unless explicitly collapsed.
      const shouldRenderChildren = isExpanded || isSearching;

      return (
        <div key={node.id} role="none">
          <TreeNode
            node={node}
            level={level}
            isExpanded={isExpanded}
            isSelected={selectedNode?.id === node.id}
            isLoading={isLoading}
            onToggle={handleToggle}
            onSelect={handleSelect}
            isFocused={focusedNodeId === node.id}
            onContextAction={(action, data) => {
              console.log('Context action:', action, data);
            }}
          />

          {/* Recursively render children only if expanded or in search mode */}
          {node.children && node.children.length > 0 && shouldRenderChildren && (
            <div role="group">
              {/* Pass node.children (which is the filtered/full list depending on search) */}
              {renderNodes(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [expandedNodes, loadingNodes, selectedNode, focusedNodeId, handleToggle, handleSelect, isSearching]);

  // Loading state
  if (isStoreLoading && !transformedFolderData.length) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading folders...</p>
        </div>
      </div>
    );
  }

  // No client selected
  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Folder className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-900 mb-1">
          No Client Selected
        </p>
        <p className="text-xs text-gray-500">
          Select a client to view their folders
        </p>
      </div>
    );
  }

  // Empty state
  if (!dataToRender || dataToRender.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FolderOpen className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-900 mb-1">
          {isSearching ? 'No Matching Folders' : 'No Folders Available'}
        </p>
        <p className="text-xs text-gray-500">
          {isSearching 
            ? 'Try adjusting your search criteria'
            : 'This client has no folders yet'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={treeContainerRef}
      role="tree"
      aria-label="Folder tree"
      className="w-full h-full overflow-auto"
      style={{
        scrollbarWidth: 'thin', // For Firefox
        scrollbarGutter: 'stable',
      }}
    >
      <div className="inline-block min-w-full w-max py-1">
        {renderNodes(dataToRender)}
      </div>
    </div>
  );
};

TreeView.displayName = 'TreeView';

export default TreeView;


