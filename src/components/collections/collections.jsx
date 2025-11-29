"use client";
import React, { useState, useMemo, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Search,
  SquareLibrary,
  SortAsc,
  SortDesc,
  Plus,
  EllipsisVertical,
  Trash,
  Edit,
  Copy,
  X,
  AlertCircle,
  FolderOpen,
  Sparkles,
  Archive
} from "lucide-react";
import useStore from "@/store/useStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { toast } from "sonner";
import { successToastObj, errorToastObj } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Skeleton } from "../ui/skeleton";

const Collections = ({ 
  className = "",
  compact = false,
}) => {
  const {
    collections = [],
    sortCollections,
    setSelectedCollection,
    selectedCollection,
    setCollectionTags,
    newCollectionName,
    setNewCollectionName,
    showNewCollectionInput,
    setShowNewCollectionInput,
    deleteWorkSpaceCollection,
    updateWorkSpaceCollection,
    isLoadingCollections,
  } = useStore();

  const [searchCollectionQuery, setSearchCollectionQuery] = useState("");
  const [isSorted, setIsSorted] = useState(false);
  const [error, setError] = useState(null);
  
  const [editDialog, setEditDialog] = useState({ open: false, collection: null, name: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, collection: null });

  const filteredCollections = useMemo(() => {
    try {
      if (!Array.isArray(collections)) {
        console.error("Collections data is not in expected format");
        return [];
      }
      return collections.filter((item) =>
        item?.workspaceName?.toLowerCase()?.includes(searchCollectionQuery.toLowerCase())
      );
    } catch (err) {
      console.error("Failed to filter collections:", err);
      return [];
    }
  }, [collections, searchCollectionQuery]);

  const handleCopyName = useCallback(async (name) => {
    try {
      if (!name) throw new Error("No name to copy");
      await navigator.clipboard.writeText(name);
      toast.success("Copied to clipboard!", successToastObj);
    } catch (err) {
      toast.error("Failed to copy name", errorToastObj);
      console.error(err);
    }
  }, []);

  const handleToggleSort = useCallback(() => {
    try {
      sortCollections(collections, isSorted);
      setIsSorted(prev => !prev);
    } catch (err) {
      setError("Failed to sort collections");
      console.error("Sort error:", err);
    }
  }, [collections, isSorted, sortCollections]);

  const handleSelectCollection = useCallback((collection) => {
    try {
      if (!collection) return;
      
      if (showNewCollectionInput) {
        setShowNewCollectionInput(false);
        setNewCollectionName("");
      }
      
      if (collection?.id === selectedCollection?.id) {
        setSelectedCollection(null);
        setCollectionTags([]);
        return;
      }
      setSelectedCollection(collection);
      const documentIds = collection?.documents
        ?.map((d) => d?.documentID)
        ?.filter(Boolean) || [];
      setCollectionTags(documentIds);
    } catch (err) {
      setError("Failed to select collection");
      console.error("Selection error:", err);
    }
  }, [selectedCollection, showNewCollectionInput, setSelectedCollection, setShowNewCollectionInput, setNewCollectionName, setCollectionTags]);
  
  const handleNewCollectionClick = useCallback(() => {
    const isSwitchingToNew = !showNewCollectionInput;
    setShowNewCollectionInput(isSwitchingToNew);

    if (isSwitchingToNew) {
      setSelectedCollection(null);
      setCollectionTags([]);
    } else {
      setNewCollectionName("");
    }
    setError(null);
  }, [
    showNewCollectionInput,
    setShowNewCollectionInput,
    setSelectedCollection,
    setCollectionTags,
    setNewCollectionName
  ]);

  const openEditDialog = useCallback((collection) => {
    setEditDialog({ 
      open: true, 
      collection, 
      name: collection.workspaceName || "" 
    });
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditDialog({ open: false, collection: null, name: "" });
  }, []);

  const handleUpdateCollection = useCallback(async () => {
    try {
      if (!editDialog.name?.trim()) {
        throw new Error("Collection name cannot be empty");
      }
      if (!editDialog.collection) {
        throw new Error("No collection selected for update");
      }
      await updateWorkSpaceCollection(editDialog.name, editDialog.collection);
      closeEditDialog();
      toast.success("Collection updated successfully", successToastObj);
    } catch (err) {
      toast.error(err.message || "Failed to update collection", errorToastObj);
      console.error("Update error:", err);
    }
  }, [editDialog, updateWorkSpaceCollection, closeEditDialog]);

  const openDeleteDialog = useCallback((collection) => {
    setDeleteDialog({ open: true, collection });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, collection: null });
  }, []);

  const handleDeleteCollection = useCallback(async () => {
    try {
      if (!deleteDialog.collection) {
        throw new Error("No collection selected for deletion");
      }
      await deleteWorkSpaceCollection(deleteDialog.collection);
      closeDeleteDialog();
      toast.success("Collection deleted successfully", successToastObj);
    } catch (err) {
      toast.error(err.message || "Failed to delete collection", errorToastObj);
      console.error("Delete error:", err);
    }
  }, [deleteDialog, deleteWorkSpaceCollection, closeDeleteDialog]);

  const clearSearch = useCallback(() => {
    setSearchCollectionQuery("");
  }, []);

  const clearNewCollectionName = useCallback(() => {
    setNewCollectionName("");
  }, [setNewCollectionName]);

  const LoadingSkeleton = () => (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-2 pt-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-full h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );

  const EmptyState = ({ isSearch = false }) => (
    <div className="max-h-[200px] flex flex-col items-center justify-center text-center py-10">
      {isSearch ? (
        <>
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
            <Search size={16} className="text-gray-400" />
          </div>
          <h4 className="text-gray-800 font-semibold text-sm mb-1">No matches found</h4>
          <p className="text-xs text-gray-500 mb-3 max-w-[200px]">
            Try adjusting your search terms
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 text-xs rounded-lg"
          >
            Clear search
          </Button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center mb-3">
            <FolderOpen size={20} className="text-blue-600" />
          </div>
          <h4 className="text-gray-800 font-semibold text-sm mb-1">No collections</h4>
          <p className="text-xs text-gray-500 mb-3 max-w-[200px]">
            Create your first collection
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewCollectionClick}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs rounded-lg"
          >
            <Plus size={14} className="mr-1.5" />
            New Collection
          </Button>
        </>
      )}
    </div>
  );

  const CollectionItem = ({ item }) => {
    const isSelected = selectedCollection?.id === item.id;
    
    return (
      <div
        className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer
          ${
            isSelected
              ? "border-blue-400 bg-gradient-to-r from-blue-50 to-blue-50/30 shadow-sm"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          }`}
        onClick={(e) => {
          const tag = e.target.tagName.toLowerCase();
          if (["button", "input", "svg", "path"].includes(tag)) return;
          handleSelectCollection(item);
        }}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isSelected 
              ? "bg-gradient-to-br from-blue-500 to-blue-600" 
              : "bg-gray-100 border border-gray-200"
          }`}
        >
          <SquareLibrary
            size={16}
            className={isSelected ? "text-white" : "text-gray-600"}
            strokeWidth={2}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate leading-tight ${
            isSelected ? "text-gray-900" : "text-gray-800"
          }`}>
            {item.workspaceName || "Untitled"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {item.documents?.length || 0} {item.documents?.length === 1 ? "file" : "files"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 rounded-lg transition-opacity ${
                isSelected 
                  ? "opacity-100 hover:bg-blue-100" 
                  : "opacity-0 group-hover:opacity-100 hover:bg-gray-100"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisVertical size={16} className="text-gray-600" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => handleCopyName(item.workspaceName)} className="text-xs">
              <Copy className="h-3.5 w-3.5 mr-2" />
              Copy Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditDialog(item)} className="text-xs">
              <Edit className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 hover:bg-red-50 focus:bg-red-50 text-xs"
              onClick={() => openDeleteDialog(item)}
            >
              <Trash className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (isLoadingCollections) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <div className={`flex flex-col h-full ${className}`}>
        {error && (
          <div className="flex items-center gap-2 p-2.5 mb-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <AlertCircle size={14} />
            <p className="text-xs flex-1">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-red-100"
              onClick={() => setError(null)}
            >
              <X size={12} />
            </Button>
          </div>
        )}

        <div className={`flex items-center justify-between  ${error ? 'mb-4' : 'mb-5'}`}>
          <div className="flex items-center gap-2 ">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center">
              <Archive size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-custom text-gray-900">Collections</h3>
          </div>
          <Button
            onClick={handleNewCollectionClick}
            size="sm"
            className={`h-8 px-3 rounded-xl text-xs font-semibold ${
              showNewCollectionInput
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-500 hover:to-blue-500 text-white"
            }`}
            disabled={isLoadingCollections}
          >
            {showNewCollectionInput ? (
              <>
                <X size={14} className="mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-1" />
                New
              </>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewCollectionInput ? (
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Collection name..."
                  className="pl-4 pr-10 h-10 text-sm font-medium rounded-xl border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  maxLength={50}
                  autoFocus
                />
                {newCollectionName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-lg"
                    onClick={clearNewCollectionName}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>

              <div className="min-h-[250px] flex items-center justify-center bg-gradient-to-br from-blue-50/30 to-gray-50 rounded-xl border-2 border-dashed border-blue-200">
                <div className="text-center px-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center mx-auto mb-2">
                    <FolderOpen size={18} className="text-blue-600" />
                  </div>
                  <p className="text-gray-700 text-sm font-semibold mb-1">
                    Name your collection
                  </p>
                  <p className="text-gray-500 text-xs max-w-[220px]">
                    Then start adding documents
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 pr-9 h-10 text-sm rounded-xl border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={searchCollectionQuery}
                    onChange={(e) => setSearchCollectionQuery(e.target.value)}
                    disabled={collections?.length === 0}
                  />
                  {searchCollectionQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-lg"
                      onClick={clearSearch}
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-gray-200 hover:bg-gray-50"
                        onClick={handleToggleSort}
                        disabled={collections?.length === 0}
                      >
                        {isSorted ? <SortDesc size={16} /> : <SortAsc size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Sort {isSorted ? "Z-A" : "A-Z"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-2 max-h-[250px] min-h-[250px] overflow-y-auto">
                {filteredCollections?.length === 0 ? (
                  <EmptyState isSearch={searchCollectionQuery.length > 0} />
                ) : (
                  filteredCollections.map((item) => (
                    <CollectionItem key={item.id || item.workspaceName} item={item} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={editDialog.open} onOpenChange={closeEditDialog}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-base font-custom">Rename Collection</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 pt-1">
              Choose a new name
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <Input
              type="text"
              value={editDialog.name}
              onChange={(e) => setEditDialog(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Collection name"
              className="h-10 text-sm rounded-xl"
              autoFocus
            />
          </div>
          <DialogFooter className="px-6 pb-6 pt-3 gap-2">
            <Button variant="outline" onClick={closeEditDialog} className="h-9 text-sm rounded-xl flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCollection}
              disabled={!editDialog.name?.trim()}
              className="h-9 text-sm rounded-xl flex-1 bg-gradient-to-r from-blue-600 to-blue-500"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={closeDeleteDialog}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-base font-custom">Delete Collection</DialogTitle>
            <DialogDescription className="text-xs text-gray-500 pt-1">
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-2">
            <p className="text-sm text-gray-700 mb-3">
              Are you sure you want to delete this collection?
            </p>
            {deleteDialog.collection && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <SquareLibrary size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {deleteDialog.collection.workspaceName || "Untitled"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {deleteDialog.collection.documents?.length || 0} documents
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 pt-3 gap-2">
            <Button variant="outline" onClick={closeDeleteDialog} className="h-9 text-sm rounded-xl flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCollection} className="h-9 text-sm rounded-xl flex-1">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Collections;
