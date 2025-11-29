import React, { useEffect, useState, useRef, useCallback } from "react";
import useStore from "@/store/useStore";
import ClientTree from "./folder-tree";
import { Folder, X, ChevronDown, Search, Loader2, RotateCcw } from "lucide-react";
import { debounce } from "lodash";

const ClientDropdown = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [showDropdown, setShowDropdown] = useState(true);
  const [showFolderTree, setShowFolderTree] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const {
    clientFolderOptions,
    setSelectedClientFolder,
    getClientFoldersList,
    getFullFolderTreeByPath,
    handleFolderClick,
    clearSelectedFolder,
    setSelectedTabs,
    folderLoading,
    setFolderLoading,
    setDocumentsList,
    setUploadedFiles,
    clientFolderPage,
    hasMoreClientFolders,
    isClientFolderLoading,
    setIsClientFullFolderLoading,
    setIsClientFolderLoading,
    getTemplatesOnFolderSelect,
    getTemplatesOnFullFolderSelect,
    setActiveTab,
    setSelectedClient,
    setSelectedUploadFolder
  } = useStore();

  const debouncedSearch = useCallback(
    debounce(async (search) => {
      try {
        setIsClientFolderLoading(true);
        setIsClientFullFolderLoading(true);
        await getClientFoldersList({ search, page: 1 });
      } finally {
        setIsClientFolderLoading(false);
        setIsClientFullFolderLoading(false);
      }
    }, 250),
    [getClientFoldersList]
  );

  // Initial load - fetch client folder list on mount
  useEffect(() => {
    setIsClientFolderLoading(true);
    getClientFoldersList({ page: 1 }).finally(() =>
      setIsClientFolderLoading(false)
    );
  }, [getClientFoldersList]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFolderSelection = async (item) => {
    setFolderLoading(item.text, true);
    clearSelection(false); // pass false so it doesn't refetch
    try {
      handleFolderClick(item);
      setSelectedLabel(item.text);
      setSearchTerm("");
      setShowDropdown(false);
      setShowFolderTree(true);
      await getFullFolderTreeByPath(item.id, true);
      setSelectedClientFolder(item.id || item.path);
      setSelectedClient(item)
    } catch (error) {
      console.error("Error selecting folder:", error);
    } finally {
      setFolderLoading(item.text, false);
      setHighlightedIndex(-1);
    }
  };

  const clearSelection = (shouldRefetch = true) => {
    setSearchTerm("");
    setSelectedLabel("");
    setShowDropdown(false);
    setShowFolderTree(false);
    setSelectedUploadFolder(null)

    clearSelectedFolder();
    setSelectedClientFolder(false);
    setSelectedTabs({ options: [] });
    setDocumentsList([]);
    setUploadedFiles([]);
    setHighlightedIndex(-1);

    if (shouldRefetch) {
      getClientFoldersList({ page: 1 });
    }
  };

  const handleResetToDefault = () => {
    // Reset folder tree state while keeping client selection
    setShowFolderTree(false);
    setDocumentsList([]);
    setUploadedFiles([]);
    setSelectedTabs({ options: [] });
    clearSelectedFolder();

    // Reset to home tab
    if (setActiveTab) {
      setActiveTab("home");
    }

    // Note: This keeps selectedLabel (client folder) intact
    // Only resets the internal folder tree navigation state
  };

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element || isClientFolderLoading || !hasMoreClientFolders) return;

    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 50) {
      getClientFoldersList({
        page: clientFolderPage + 1,
        append: true,
      });
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setHighlightedIndex(-1);
    setShowDropdown(true);

    // If input is empty → load default list
    if (value.trim() === "") {
      setIsClientFolderLoading(true);
      getClientFoldersList({ page: 1 }).finally(() =>
        setIsClientFolderLoading(false)
      );
      return;
    }

    // 🔥 Only search when 3 or more characters
    if (value.trim().length >= 3) {
      setIsClientFolderLoading(true);
      debouncedSearch(value);
    } else {
      // Hide results when less than 3 chars
      setSearchResults([]);
      setShowDropdown(false);
    }
  };


  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedUploadFolder(null)
    setHighlightedIndex(-1);
    setIsClientFolderLoading(true);
    getClientFoldersList({ page: 1 }).finally(() =>
      setIsClientFolderLoading(false)
    );
    // Focus back on input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < clientFolderOptions.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : clientFolderOptions.length - 1
      );
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const item = clientFolderOptions[highlightedIndex];
      if (item) handleFolderSelection(item);
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
      setSearchTerm("");
    }
  };

  useEffect(() => {
    if (
      scrollRef.current &&
      highlightedIndex >= 0 &&
      scrollRef.current.children.length > highlightedIndex + 1
    ) {
      const activeItem = scrollRef.current.children[highlightedIndex + 1];
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Sort client folders alphabetically
  const sortedClientFolders = [...clientFolderOptions].sort((a, b) =>
    a.text.localeCompare(b.text, undefined, { sensitivity: 'base' })
  );

  return (
    <div className="w-full h-full shadow-sm flex flex-col overflow-hidden">
      <div className="relative w-full flex-shrink-0">
        <div className="flex items-center gap-0 border-b border-gray-300">
          <div
            className="flex-1 h-10 rounded-none py-2 px-5 text-sm flex items-center justify-between cursor-pointer hover:bg-gray-100"
            onClick={() => setShowDropdown(true)}
          >
            <div className="flex-1 truncate text-muted-foreground font-medium">
              {selectedLabel || "Select Client Folder"}
            </div>
            <div className="flex items-center gap-2 ml-2">
              {selectedLabel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer hover:bg-gray-200 rounded-full p-1"
                >
                  <X size={16} />
                </button>
              )}
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""
                  }`}
              />
            </div>
          </div>

          {/* Reset Button - Only show when folder tree is visible */}
          {/* {showFolderTree && (
            <button
              onClick={handleResetToDefault}
              className="flex-shrink-0 h-10 px-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-2 border-l border-gray-300"
              title="Reset to default"
            >
              <RotateCcw size={16} />
              <span className="text-xs font-medium">Reset</span>
            </button>
          )} */}
        </div>

        {showDropdown && (
          <div
            ref={(el) => {
              suggestionsRef.current = el;
              scrollRef.current = el;
            }}
            onScroll={handleScroll}
            className="absolute z-10 w-full bg-white rounded-b-xl shadow-lg border border-gray-200 max-h-64 overflow-auto"
          >
            <div className="sticky top-0 bg-white px-4 py-3 border-b">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search Client Folders..."
                  className="w-full h-10 pl-9 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {isClientFolderLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>

            {sortedClientFolders.length > 0 ? (
              sortedClientFolders.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleFolderSelection(item)}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 text-sm ${highlightedIndex === index
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-blue-50 text-gray-800"
                    }`}
                >
                  <Folder size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="truncate">{item.text}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm italic">
                {isClientFolderLoading ? (
                  <div className="flex w-full justify-center items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                ) : searchTerm ? (
                  "No matching folders found"
                ) : (
                  "Type to search client folders"
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showFolderTree && (
        <div className="flex-1 min-h-0 flex flex-col">
          {folderLoading[selectedLabel] ? (
            <div className="flex-1 bg-white rounded-xl p-4 space-y-2 animate-pulse">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0">
                <ClientTree />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDropdown;