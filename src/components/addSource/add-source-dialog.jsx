"use client";
import { useEffect, useState } from "react";
import TagInput from "../tagsInput";
import { Button } from "../ui/button";
import useStore from "@/store/useStore";
import Loader from "../loader";
import { toast } from "sonner";
import { errorToastObj } from "@/lib/constants";
import Collections from "../collections/collections";
import { Search, Sparkles, X } from "lucide-react";

const AddSourceDialog = () => {
  const [loading, setLoading] = useState(false);

  const {
    setDocumentsList,
    setAddSourceDialog,
    setIsSourcesDialogOpen,
    user,
    tags,
    setTags,
    setSelectedDocumentId,
    setSelectedCollection,
    selectedCollection,
    setCollectionTags,
    collectionTags,
    newCollectionName,
    showNewCollectionInput,
    saveWorkSpaceCollection,
    getWorkspaceCollections,
    collections,
    setSelectedDocument
  } = useStore();

  useEffect(() => {
    setAddSourceDialog(true);
    setTags([]);
    setCollectionTags([]);
    setSelectedCollection(null);

    return () => {
      setAddSourceDialog(false);
    };
  }, []);

  const saveWorkspace = async () => {
    const workspaceName = showNewCollectionInput
      ? newCollectionName
      : selectedCollection?.workspaceName;
    const workspaceId = selectedCollection?.id;
    const userId = user?.User.ID;
    await saveWorkSpaceCollection(
      [...collectionTags, ...tags],
      workspaceId,
      workspaceName,
      showNewCollectionInput,
      userId,
      selectedCollection
    );
  };

  const handleSearchClick = async () => {
    const collectionNames = collections.map((item) => item.workspaceName);

    if (showNewCollectionInput) {
      if (!newCollectionName?.trim()) {
        toast.error(`Please enter a collection name`, errorToastObj);
        return;
      }

      if (collectionNames.includes(newCollectionName.trim())) {
        toast.error("Collection name already exists", errorToastObj);
        return;
      }
    }

    setLoading(true);
    try {
      if (selectedCollection || showNewCollectionInput) {
        await saveWorkspace();
        if (showNewCollectionInput) {
          await getWorkspaceCollections();
        }
      }

      const columnDetailMasterId = user?.User?.ColumnDetailMaster?.[0]?.Id;
      if (!columnDetailMasterId) {
        toast.error("User column detail ID not available", errorToastObj);
        return;
      }


      const res = await setDocumentsList(
        [...collectionTags, ...tags],
        columnDetailMasterId
      );

      const resStatus = res?.data?.Status === 'Success'
      const documentsList = res?.data?.Documents

      if (resStatus && documentsList.length === 0) {
        toast.error("No Data Found!", errorToastObj)
      }
     
      if (documentsList[0]?.ID) {
        setSelectedDocumentId(documentsList[0].ID);
        setSelectedDocument(documentsList[0])
      }

      setIsSourcesDialogOpen(false);

      if (resStatus === 'Error') {
        toast.error("Something went Wrong ! Please try again.", errorToastObj);
      }
    } catch (error) {
      console.error("Error setting document list", error);
      toast.error("Something went wrong while searching.", errorToastObj);
    } finally {
      setLoading(false);
    }
  };

  const handleClearClick = () => {
    setTags([]);
    setCollectionTags([]);
    setSelectedCollection(null);
  };

  const totalTags = [...tags, ...collectionTags].length;
  const hasSelection = totalTags > 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/30">
      {/* Header */}
      <div className="px-8  pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center ">
              <Search size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-custom text-gray-900">Search Documents</h2>
              <p className="text-xs text-gray-500 mt-0.5">Find and organize your documents</p>
            </div>
          </div>
        
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Left Column - Document IDs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-custom text-gray-900">Document IDs</h3>
              <span className="text-xs text-gray-500">Enter or paste IDs</span>
            </div>
            <TagInput placeholder="Type or paste document IDs..." />
            
            {/* Info Card */}
            {/* <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex gap-2">
                <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Pro tip</p>
                  <p className="text-xs text-blue-700">
                    You can paste multiple IDs separated by commas, spaces, or line breaks
                  </p>
                </div>
              </div>
            </div> */}
          </div>

          {/* Right Column - Collections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-custom text-gray-900">Collections</h3>
              <span className="text-xs text-gray-500">Organize your search</span>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-4 bg-white">
              <Collections />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
         <div></div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-10 px-5 text-sm font-medium rounded-full hover:bg-gray-50"
              onClick={handleClearClick}
              disabled={!hasSelection}
            >
              Clear All
            </Button>
            <Button
              className="h-10 px-6 text-sm font-semibold rounded-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-800 hover:to-gray-800 text-white shadow-sm min-w-[140px]"
              onClick={handleSearchClick}
              disabled={!hasSelection || loading}
            >
              {loading ? (
                <Loader width={4} height={4} />
              ) : (
                <>
                  {selectedCollection || showNewCollectionInput ? "Save & Search" : "Search"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSourceDialog;