"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { toast } from "sonner";
import Loader from "../loader";
import useStore from "@/store/useStore";
import Collections from "../collections/collections";
import { errorToastObj, successToastObj } from "@/lib/constants";
import DocumentPreviewTab from "./document-preview-tab";

const ClientMetaDataTab = ({ tab }) => {
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
    user,
    configs,
    collections,
    tabsList,
    setCollectionTabClosed,
    selectedTabs,
    setSelectedTabs,
    setClientMetaTabClosed,
    selectedDocumentId,
    documentsList,
    clearSelectedFolder,
    setSelectedClientFolder,
    setShowClientDropdown,
    setIsCollapsed
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("metadata");

  const iframeUrl = useMemo(() => {
    if (!selectedDocumentId) return null;
    return `${configs?.CLIENT_METADATA_URL}&id=${selectedDocumentId}`;
  }, [selectedDocumentId]);

  const selectedDocument = useMemo(() => {
    return documentsList?.find(doc => doc.id === selectedDocumentId);
  }, [documentsList, selectedDocumentId]);

  const handleClose = () => {
    const updatedTabs = selectedTabs.options.filter((t) => t.name !== "Client Metadata");
    setSelectedTabs({ options: updatedTabs });
    setClientMetaTabClosed(true);
  };

  const handleClearClick = () => {
    setCollectionTabClosed(false);
    setUploadedFiles([]);
    setSelectedDocumentId(null);
    setActiveTab("metadata");
  };

  const handleSaveFile = async () => {
  const { 
    tabsList,
    clearSelectedFolder,
    setSelectedClientFolder,
    setSelectedTabs,
    setClientMetaTabClosed,
    setShowClientDropdown,
    setIsCollapsed,
    setSelectedDocumentId,
    setUploadSource,
    setUploadedFiles,
    setDocumentsList,
    setActiveTab

  } = useStore.getState();

  // Clear all client-related states
  // clearSelectedFolder();
  // setSelectedClientFolder(null);
  // setShowClientDropdown(false);
  setClientMetaTabClosed(true);
  // setUploadSource(null);
  setUploadedFiles([]);
  setDocumentsList([]);
  setActiveTab("upload")

  // // Reset to default tabs (Preview + Chat)
  // const previewAndChatTabs = (tabsList || []).filter(
  //   tab => tab.name === "Preview" || tab.name === "Chat"
  // );

  // await setSelectedTabs({
  //   options: previewAndChatTabs,
  // });

  const updatedTabs = selectedTabs.options.filter(
      (t) => t.name !== "Client Metadata"
    );
    await setSelectedTabs({ options: updatedTabs });

  
  
  // Collapse sidebar
  // setIsCollapsed(true);

  // Optional: Show success message
  // toast.success("Client folder completed successfully", successToastObj);
};

  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-sm w-full border">
      <CardHeader className="p-0 border-b">
        <div className="flex justify-between items-center">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full rounded-none bg-transparent p-2 h-12">
              <TabsTrigger 
                value="metadata" 
                className="rounded-none data-[state=active]:rounded-lg hover:rounded-lg h-full text-muted-foreground px-6 data-[state=active]:shadow-none data-[state=active]:bg-gray-100 border-r data-[state=active]:border-b-2 data-[state=active]:border-b-primary"
              >
                Metadata 
              </TabsTrigger>
              {/* <TabsTrigger 
                value="collection" 
                className="rounded-none data-[state=active]:rounded-lg h-full px-6 data-[state=active]:shadow-none border-r data-[state=active]:border-b-2 data-[state=active]:border-b-primary"
              >
                Collection
              </TabsTrigger> */}
              <TabsTrigger 
                value="preview" 
                className="rounded-none data-[state=active]:rounded-lg hover:rounded-lg h-full px-6 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-primary"
                disabled={!selectedDocumentId}
              >
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:bg-accent rounded-full p-2 m-2 transition-colors"
            aria-label="Close tab"
          >
            <X size={16} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-[calc(100%-56px)] p-0">
        <Tabs value={activeTab} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {console.log(iframeUrl)}
            <TabsContent value="metadata" className="h-full m-0">
              {iframeUrl ? (
                <iframe
                  src={iframeUrl}
                  className="w-full h-full min-h-[500px] border-none"
                  title="Client Metadata"
                  aria-label="Client Metadata View"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                  <div className="text-center space-y-2">
                    <p className="font-medium">No document selected</p>
                    <p className="text-sm">Select a document to view its metadata</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* <TabsContent value="collection" className="h-full m-0 p-4">
              <Collections />
            </TabsContent> */}

            <TabsContent value="preview" className="h-full m-0 ">
              <DocumentPreviewTab />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className=" p-4 flex justify-end gap-3">
          <Button
            onClick={handleSaveFile}
            className={'bg-black hover:bg-gray-800 rounded-full'}
          >
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions (implement these)
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFilePreview(document) {
  // Implement based on your file types
  switch(document.Extension.toLowerCase()) {
    case 'pdf':
      return <PdfPreview document={document} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <ImagePreview document={document} />;
    default:
      return (
        <div className="text-center">
          <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Preview not available for {document.Extension.toUpperCase()} files
          </p>
        </div>
      );
  }
}

export default ClientMetaDataTab;