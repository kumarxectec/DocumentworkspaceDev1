"use client";

import {
  Upload,
  Trash2,
  X,
  MessageSquare,
  Eye,
  FolderOpen,
  UploadIcon,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { errorToastObj, getFileIcon, successToastObj } from "@/lib/constants";
import useStore from "@/store/useStore";
import { toast } from "sonner";
import Loader from "../loader";
import FileDropper from "../file-dropper";

const UploadTab = ({ tab }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [startAiChat, setStartAiChat] = useState(true);
  const fileInputRef = useRef(null);

  const {
    uploadedFiles,
    setUploadedFiles,
    selectedTabs,
    setSelectedTabs,
    configs,
    setUploadSource,
    setCollectionTabClosed,
    uploadSource,
    clientMetaTabClosed,
    selectedCollection,
    newCollectionName,
    showNewCollectionInput,
    collections,
    user,
    uploadFilesFromDnD,
    saveUploadedFilesToCollection,
    setSelectedDocumentId,
    setIsSourcesDialogOpen,
    setIsCollapsed,
    isCollapsed,
    uploadInProgressFilesFromDnD,
    documentsList,
    selectedDocumentId,
    setDocumentsList,
    setClientMetaTabClosed,
  } = useStore();
  const [loading, setLoading] = useState(false);

  const handleRemoveFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.name !== fileName));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) {
      setUploadedFiles([...uploadedFiles, ...droppedFiles]);
    }
  };

  const handleFileChange = (e) => {
    setIsCollapsed(false);
    const selectedFiles = Array.from(e.target.files || []);
    const existingFileNames = uploadedFiles.map((file) => file.name);

    const uniqueFiles = selectedFiles.filter(
      (file) => !existingFileNames.includes(file.name)
    );

    // Show error message if any files are duplicates
    if (uniqueFiles.length < selectedFiles.length) {
      toast.error("Some files are already uploaded!", errorToastObj);
    }

    // Only proceed if there are unique files to upload
    if (uniqueFiles.length > 0) {
      const updatedFiles = [...uploadedFiles, ...uniqueFiles];
      setUploadedFiles(updatedFiles);

      // ✅ Always reset the upload source
      useStore.getState().setUploadSource(null);
    }

    // Clear the file input to allow re-uploading the same file after deletion
    e.target.value = "";
  };

  const handleUploadFile = async () => {
    const collectionNames = collections.map((item) => item.workspaceName);

    try {
      setLoading(true);

      if (showNewCollectionInput && !newCollectionName?.trim()) {
        toast.error(`Please enter a new $collection name`, errorToastObj);
        return;
      }

      if (
        showNewCollectionInput &&
        collectionNames.includes(newCollectionName)
      ) {
        toast.error("Name already taken", errorToastObj);
        return;
      }

      const uploadResponse = await uploadInProgressFilesFromDnD(
        uploadedFiles,
        startAiChat
      );

      console.log("Upload response:", uploadResponse);

      const ids = uploadResponse?.data?.ResultID;
      const documentList = uploadResponse?.data?.documentList || [];

      const workspaceName = showNewCollectionInput
        ? newCollectionName
        : selectedCollection?.workspaceName;
      const workspaceId = selectedCollection?.id;
      const userId = user?.User.ID;

      if ((selectedCollection || showNewCollectionInput) && ids?.length) {
        await saveUploadedFilesToCollection(
          ids,
          workspaceId,
          workspaceName,
          showNewCollectionInput,
          userId,
          selectedCollection
        );
      }

      // ✅ Only if a document was uploaded successfully
      if (
        uploadResponse?.data?.ResultID &&
        documentList.length > 0 &&
        documentList[0].ID
      ) {
        const docId = documentList[0].ID;
        setSelectedDocumentId(docId);
        setActiveTab("documents");

        const { selectedTabs, setSelectedTabs, setClientMetaTabClosed } =
          useStore.getState();

        const currentTabs = [...selectedTabs.options];
        const alreadyHasClientMeta = currentTabs.some(
          (t) => t.name === "Client Metadata"
        );

        if (!alreadyHasClientMeta) {
          const clientMetaTab = {
            id: Date.now(),
            name: "Client Metadata",
            seq: currentTabs.length + 1,
            url: `https://10.115.14.14/DFXDMSLite/dfxweb/Email/Mailproperty?readonlyflag=1&newfile=ikfvcn.dat&showallmenu=true&showpreview=true&documentai=true&application=dfxsearch&activetab=documentai&repository=stonehage&id=${docId}`,
          };

          const newTabs = [...currentTabs, clientMetaTab];
          const resequencedTabs = newTabs.map((tab, index) => ({
            ...tab,
            seq: index + 1,
          }));

          setSelectedTabs({ options: resequencedTabs });
          setClientMetaTabClosed(false);
          setIsCollapsed(false);
          setUploadedFiles([])
        }
      }

      setIsSourcesDialogOpen(false);
      toast.success("Uploaded Successfully", successToastObj);
    } catch (err) {
      toast.error(err.message, errorToastObj);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    const { selectedTabs, setSelectedTabs } = useStore.getState();
    const filteredTabs = selectedTabs.options?.filter(
      (tab) => tab.name !== "Upload"
    );
    setSelectedTabs({ options: filteredTabs });

    useStore.setState({ uploadSource: null });
  };

  const handleClearClick = () => {
    setUploadedFiles([]);

    // Close Client Metadata tab when all files are cleared
    const { selectedTabs, setSelectedTabs, setClientMetaTabClosed } =
      useStore.getState();
    const filteredTabs = selectedTabs.options?.filter(
      (tab) => tab.name !== "Client Metadata"
    );
    setSelectedTabs({ options: filteredTabs });
    setClientMetaTabClosed(true); // Mark as closed by user action
  };

  const handleDeleteFile = (fileToDelete) => {
    const updatedFiles = uploadedFiles.filter(
      (f) => f?.name !== fileToDelete.name
    );
    setUploadedFiles(updatedFiles);

    // If this was the last file, close the Client Metadata tab
    if (updatedFiles.length === 0) {
      const { selectedTabs, setSelectedTabs, setClientMetaTabClosed } =
        useStore.getState();
      const filteredTabs = selectedTabs.options?.filter(
        (tab) => tab.name !== "Client Metadata"
      );
      setSelectedTabs({ options: filteredTabs });
      setClientMetaTabClosed(true); // Mark as closed by user action
    }
  };

  const handleSelectDocument = (item) => {
    setSelectedDocumentId(item.ID);
  };

  const handleDocumentsClearClick = () => {
    const updatedTabs = selectedTabs.options.filter(
      (t) => t.name !== "Client Metadata"
    );
    setSelectedTabs({ options: updatedTabs });

    setDocumentsList([]);
    setUploadedFiles([]);
  };

  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-sm w-full border">
      <CardHeader>
        <CardTitle className="border-b border-slate-300 p-1">
          <div className="flex justify-between items-center">
            <div className="flex justify-start items-center pl-6 gap-3 h-8">
              {/* <span className="text-muted-foreground">
                <UploadIcon size={16} />
              </span> */}
              <p className="text-muted-foreground text-sm font-medium">Upload</p>
            </div>
            {/* <div
              className="text-muted-foreground cursor-pointer hover:bg-gray-200 w-8 h-8 flex items-center justify-center rounded-full"
              onClick={handleClose}
            >
              <X size={16} />
            </div> */}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col h-[calc(100%-56px)] p-0">
        <FileDropper />
      </CardContent>
    </Card>
  );
};

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default UploadTab;
