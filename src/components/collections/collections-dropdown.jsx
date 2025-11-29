import React, { useState, useMemo } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Search,
  SquareLibrary,
  Plus,
  X,
  Check,
  ChevronDown,
  Folder,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { successToastObj, errorToastObj } from "@/lib/constants";

const CollectionsDropdown = ({
  collections = [],
  selectedCollection,
  setSelectedCollection,
  setCollectionTags,
  newCollectionName,
  setNewCollectionName,
  showNewCollectionInput,
  setShowNewCollectionInput,
  isLoadingCollections = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const filteredCollections = useMemo(() => {
    if (!Array.isArray(collections)) return [];

    return collections.filter((item) =>
      item?.workspaceName?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );
  }, [collections, searchQuery]);

  const handleSelectCollection = (collection) => {
    if (collection?.id === selectedCollection?.id) {
      setSelectedCollection(null);
      setCollectionTags([]);
    } else {
      setSelectedCollection(collection);
      const documentIds = collection?.documents
        ?.map((d) => d?.documentID)
        ?.filter(Boolean) || [];
      setCollectionTags(documentIds);
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setShowNewCollectionInput(true);
    setSelectedCollection(null);
    setCollectionTags([]);
    setIsOpen(false);
  };

  const handleCancelCreate = () => {
    setIsCreatingNew(false);
    setShowNewCollectionInput(false);
    setNewCollectionName("");
  };

  const handleConfirmCreate = () => {
    if (!newCollectionName?.trim()) {
      toast.error("Collection name cannot be empty", errorToastObj);
      return;
    }

    const existingNames = collections.map(c => c.workspaceName.toLowerCase());
    if (existingNames.includes(newCollectionName.toLowerCase())) {
      toast.error("Collection name already exists", errorToastObj);
      return;
    }

    setIsCreatingNew(false);
    toast.success("Collection will be created on upload", successToastObj);
  };

  const handleClearNewCollection = () => {
    setIsCreatingNew(false);
    setShowNewCollectionInput(false);
    setNewCollectionName("");
    setSelectedCollection(null);
    setCollectionTags([]);
  };

  const handleClearSelectedCollection = () => {
    setSelectedCollection(null);
    setCollectionTags([]);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Create New Collection Mode */}
      {isCreatingNew ? (
        <div className="rounded-2xl bg-gray-100 border-2 border-dashed border-blue-300">
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Plus size={14} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-800">
                Create New Collection
              </span>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="h-9 text-sm bg-white"
                autoFocus
                maxLength={50}
              />

              <div className="flex gap-2 justify-end items-center w-full">
                <Button
                  size="sm"
                  onClick={handleConfirmCreate}
                  disabled={!newCollectionName?.trim()}
                  className="h-8 px-3 text-xs rounded-2xl"
                >
                  <Check size={12} className="mr-1" />
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelCreate}
                  className="h-8 px-3 text-xs rounded-2xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Collection Selection Mode */
        <div className="rounded-xl bg-gray-100">
          <div className="p-3 w-full">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 w-full">
              {/* Left section */}
              <div className="items-center gap-3 flex-1 min-w-0  hidden xl:flex">
                <div className="p-2 bg-white rounded-lg flex-shrink-0">
                  <SquareLibrary
                    className={`h-4 w-4 ${
                      selectedCollection || newCollectionName
                        ? "text-blue-500"
                        : "text-gray-400"
                    }`}
                  />
                </div>

                {/* Label - Hidden on small screens */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    Collection
                  </p>
                  <p className="text-xs text-muted-foreground text-nowrap">
                    {selectedCollection
                      ? `${
                          selectedCollection.documents?.length || 0
                        } files selected`
                      : newCollectionName
                      ? "New collection created"
                      : "Choose collection"}
                  </p>
                </div>
              </div>

              {/* Dropdown */}
              <div className="flex-shrink-0 w-full xl:w-[220px]">
                <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                  <div className="relative">
                    {/* Dropdown Trigger */}
                    <DropdownMenuTrigger asChild className="w-full">
                      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all w-full cursor-pointer">
                        <span className="flex-1 text-left">
                          {selectedCollection?.workspaceName ||
                            newCollectionName ||
                            "Select Collection"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      </div>
                    </DropdownMenuTrigger>

                    {/* Clear Button */}
                    {(selectedCollection || newCollectionName) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          newCollectionName
                            ? handleClearNewCollection()
                            : handleClearSelectedCollection();
                        }}
                        className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Content */}
                  <DropdownMenuContent
                    align="end"
                    className="w-[90vw] sm:w-[320px] md:w-[360px] rounded-2xl shadow-md p-2"
                    onCloseAutoFocus={(e) => e.preventDefault()}
                  >
                    {/* Search */}
                    <div className="relative mb-2">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={14}
                      />
                      <Input
                        placeholder="Search collections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-sm border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery("");
                          }}
                        >
                          <X size={12} />
                        </Button>
                      )}
                    </div>

                    <DropdownMenuSeparator />

                    {/* Create New Option */}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleCreateNew();
                      }}
                      className="flex items-center gap-2 p-2 cursor-pointer hover:bg-blue-50 text-blue-600 rounded-lg"
                    >
                      <Plus size={16} />
                      <span className="font-medium">Create New Collection</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Collection List */}
                    <div className="max-h-60 overflow-y-auto">
                      {isLoadingCollections ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Loading collections...
                        </div>
                      ) : filteredCollections.length === 0 ? (
                        <div className="p-4 text-center">
                          {searchQuery ? (
                            <p className="text-sm text-gray-500">
                              No collections found for "{searchQuery}"
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <Folder
                                size={24}
                                className="mx-auto text-gray-400"
                              />
                              <p className="text-sm text-gray-500">
                                No collections yet
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCreateNew}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                Create your first collection
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        filteredCollections.map((collection) => (
                          <DropdownMenuItem
                            key={collection.id || collection.workspaceName}
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectCollection(collection);
                            }}
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="p-1.5 bg-gray-100 rounded">
                                <SquareLibrary
                                  size={12}
                                  className="text-gray-600"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {collection.workspaceName || "Untitled"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {collection.documents?.length || 0} files
                                </p>
                              </div>
                            </div>

                            {selectedCollection?.id === collection.id && (
                              <Check
                                size={16}
                                className="text-blue-600 flex-shrink-0"
                              />
                            )}
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsDropdown;