"use client";

import React, { useRef, useState } from "react";
import { Folder, X,MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useStore from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Collections from "../collections/collections";
import Loader from "../loader";
import { toast } from "sonner";
import { errorToastObj, getFileIcon, successToastObj } from "@/lib/constants";
const CollectionTab = ({ tab }) => {
     const [ startAiChat, setStartAiChat] = useState(false);
       const [loading, setLoading] = useState(false);
      const fileInputRef = useRef(null);
      const {
        uploadedFiles,
        setUploadedFiles,
        uploadFilesFromDnD,
        setIsSourcesDialogOpen,
        setSelectedDocumentId,
        selectedCollection,
        newCollectionName,
        showNewCollectionInput,
        saveUploadedFilesToCollection,
        configs,
        user,
        collections,
        setCollectionTabClosed 
      } = useStore();
const isUploadOpen = useStore(
  (state) => state.selectedTabs.options?.some((t) => t.name === "Upload")
);

const handleClose = () => {
  const { selectedTabs, setSelectedTabs, setCollectionTabClosed } = useStore.getState();
  const updatedTabs = selectedTabs.options.filter((t) => t.name !== "Collection");
  setSelectedTabs({ options: updatedTabs });
  setCollectionTabClosed(true);
};



  
  const handleRemoveFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.name !== fileName));
  };

  const handleClearClick = () => {
    setCollectionTabClosed(false);
    setUploadedFiles([]);
  };
  const handleUploadFile = async () => {
    const collectionNames = collections.map((item) => item.workspaceName);
    // setCollectionTabClosed(false);
    try {
      setLoading(true);

      if (showNewCollectionInput && !newCollectionName?.trim()) {
        toast.error("Please enter a new collection name", errorToastObj);
        return;
      }

      if (
        showNewCollectionInput &&
        collectionNames.includes(newCollectionName)
      ) {
        toast.error("Name already taken", errorToastObj);
        return;
      }

      const uploadResponse = await uploadFilesFromDnD(uploadedFiles, startAiChat);
      console.log("Upload response:", uploadResponse);
      console.log(uploadResponse?.data.DocumentList[0].ID, "for testing");

      const ids = uploadResponse?.data.ResultID;
      const workspaceName = showNewCollectionInput
        ? newCollectionName
        : selectedCollection?.workspaceName;
      const workspaceId = selectedCollection?.id;
      const userId = user?.User.ID;

if (uploadResponse?.data.DocumentList?.length > 0) {
  setUploadedFiles(uploadResponse.data.DocumentList);
  setCollectionTabClosed(false); // ✅ Move this line BEFORE checking for existing tab

  const currentTabs = useStore.getState().selectedTabs.options;
  const hasCollection = currentTabs.some((t) => t.name === "Collection");

  if (!hasCollection) {
    const updatedTabs = [
      ...currentTabs,
      {
        id: 9998,
        name: "Collection",
        seq: currentTabs.length + 1,
      },
    ];
    useStore.getState().setSelectedTabs({ options: updatedTabs });
  }

  setSelectedDocumentId(uploadResponse.data.DocumentList[0].ID);
}





      if (selectedCollection || showNewCollectionInput) {
        await saveUploadedFilesToCollection(
          ids,
          workspaceId,
          workspaceName,
          showNewCollectionInput,
          userId,
          selectedCollection
        );
      }

      if (uploadResponse?.data.DocumentList[0].ID) {
        setSelectedDocumentId(uploadResponse?.data.DocumentList[0].ID);
      }

      setIsSourcesDialogOpen(false);
      toast.success('Uploaded Successfully', successToastObj)
    } catch (err) {
      toast.error(err.message, errorToastObj);
    } finally {
      setLoading(false);
    }
  };


//   useEffect(() => {
//   if (uploadedFiles.length === 0) {
//     useStore.getState().setCollectionTabClosed(false);
//   }
// }, [uploadedFiles]);


  return (
    // <motion.div
    //   initial={{ opacity: 0, y: 10 }}
    //   animate={{ opacity: 1, y: 0 }}
    //   transition={{ duration: 0.3 }}
    //   className="w-full h-full p-6 flex flex-col items-center"
    // >
      <Card
  className={`h-full w-full flex flex-col rounded-xl border border-gray-200 shadow-sm bg-white transition-all duration-300 `}
>

         <CardHeader className="flex flex-row items-center justify-between px-4 py-2 border-b">
         <div className="text-sm font-medium text-gray-800">{tab.name}</div>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={handleClose}
                   className="hover:bg-gray-100 text-gray-500"
                 >
                   <X className="h-4 w-4" />
                 </Button>
        </CardHeader>

        <CardContent className="h-full w-full p-6 overflow-y-auto">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex-1">
            <Collections />
          </div>
          <div className="w-full px-5 -mt-4 pb-4">
            <Card className="rounded-xl px-1 pr-4 w-full shadow-none border-0 bg-gray-100  transition-all duration-300 group">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg   transition-colors duration-300">
                      <MessageSquare className={`h-4 w-4 ${startAiChat ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        AI Assistant
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Start AI Conversation
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={startAiChat}
                      onChange={() => setStartAiChat(!startAiChat)}
                    />
                    <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-all duration-200 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full peer-checked:after:translate-x-full after:transition-all" />
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* File Actions */}
          <div className="w-full flex justify-end gap-3 px-6">
            <Button
              variant="outline"
              className="text-muted-foreground text-sm w-[90px] hover:bg-gray-200 shadow-xs"
              onClick={handleClearClick}
            >
              Clear
            </Button>
            <Button
              disabled={uploadedFiles.length === 0}
              className="bg-gray-900/90 text-sm min-w-[80px] text-white px-4 py-2 rounded-2xl hover:bg-gray-900"
              onClick={handleUploadFile}
            >
              {loading ? (
                <Loader width={4} height={4} />
              ) : selectedCollection || showNewCollectionInput ? (
                "Save and Upload"
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>
    // </motion.div>
  );
};

export default CollectionTab;
