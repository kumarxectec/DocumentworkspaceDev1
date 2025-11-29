import { MessageSquare, Trash2, Upload } from "lucide-react";
import React, { useRef, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { errorToastObj, getFileIcon, successToastObj } from "@/lib/constants";
import useStore from "@/store/useStore";
import Loader from "./loader";
import { toast } from "sonner";
import { Card, CardContent } from "./ui/card";
import CollectionsDropdown from "./collections/collections-dropdown";

const FileDropper = () => {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startAiChat, setStartAiChat] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  const {
    uploadedFiles,
    setUploadedFiles,
    uploadFilesFromDnD,
    setIsSourcesDialogOpen,
    setSelectedDocumentId,
    setSelectedDocument,
    selectedCollection,
    setSelectedCollection,
    newCollectionName,
    setNewCollectionName,
    showNewCollectionInput,
    setShowNewCollectionInput,
    saveUploadedFilesToCollection,
    configs,
    user,
    collections,
    setCollectionTags,
    isLoadingCollections,
    tabsList,
    setSelectedTabs,
    setIsCollapsed
  } = useStore();

  const MAX_FILES = configs?.MAX_FILES_SIZE || 20;

  /**
   * Filters out duplicate files and shows toast if duplicates found
   */
  const filterDuplicateFiles = useCallback((newFiles, existingFiles) => {
    const existingFileNames = new Set(existingFiles.map(file => file.name));
    const uniqueFiles = [];
    const duplicates = [];

    newFiles.forEach(file => {
      if (existingFileNames.has(file.name)) {
        duplicates.push(file.name);
      } else {
        uniqueFiles.push(file);
        existingFileNames.add(file.name);
      }
    });

    if (duplicates.length > 0) {
      const message = duplicates.length === 1 
        ? `File "${duplicates[0]}" is already uploaded!`
        : `${duplicates.length} file(s) already uploaded!`;
      toast.error(message, errorToastObj);
    }

    return { uniqueFiles, duplicates };
  }, []);

  /**
   * Adds files to upload list after filtering duplicates
   */
  const addFiles = useCallback((newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    const { uniqueFiles, duplicates } = filterDuplicateFiles(newFiles, uploadedFiles);
    
    if (uniqueFiles.length > 0) {
      const totalFiles = uploadedFiles.length + uniqueFiles.length;
      
      if (totalFiles > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed!`, errorToastObj);
        return;
      }

      setUploadedFiles([...uploadedFiles, ...uniqueFiles]);
      
      // Show success message only if we have new files and no duplicates from this batch
      const newDuplicatesCount = newFiles.length - uniqueFiles.length;
      if (uniqueFiles.length > 0 && newDuplicatesCount === 0) {
        toast.success(`${uniqueFiles.length} file(s) added`, successToastObj);
      }
    }
  }, [uploadedFiles, setUploadedFiles, filterDuplicateFiles, MAX_FILES]);

  /**
   * Handle file drop with proper event handling
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    dragCounterRef.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, [addFiles]);

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
    
    // Reset input to allow selecting same file again after removal
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  /**
   * Handle drag over - required to enable drop
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drag enter with counter to prevent flickering
   */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  /**
   * Handle drag leave with counter to prevent flickering
   */
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Remove individual file
   */
  const handleRemoveFile = useCallback((fileName) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.name !== fileName));
  }, [uploadedFiles, setUploadedFiles]);

  /**
   * Clear all files
   */
  const handleClearClick = useCallback(() => {
    setUploadedFiles([]);
    setSelectedCollection(null);
    setNewCollectionName('');
    setShowNewCollectionInput(false);
  }, [setUploadedFiles, setSelectedCollection, setNewCollectionName, setShowNewCollectionInput]);

  /**
   * Upload files with comprehensive error handling
   */
  const handleUploadFile = async () => {
    const collectionNames = collections?.map((item) => item.workspaceName) || [];

    try {
      setLoading(true);

      // Validation
      if (uploadedFiles.length === 0) {
        toast.error("Please select files to upload", errorToastObj);
        return;
      }

      if (showNewCollectionInput && !newCollectionName?.trim()) {
        toast.error("Please enter a new collection name", errorToastObj);
        return;
      }

      if (showNewCollectionInput && collectionNames.includes(newCollectionName)) {
        toast.error("Collection name already taken", errorToastObj);
        return;
      }

      // Upload files
      const uploadResponse = await uploadFilesFromDnD(uploadedFiles, startAiChat);
      
      if (!uploadResponse?.data) {
        throw new Error("No response data from upload service");
      }

      const documentId = uploadResponse?.data?.DocumentList?.[0]?.ID;
      const selectedDocument = uploadResponse?.data?.DocumentList?.[0];
      const uploadStatus = uploadResponse?.data?.Status;

      if (uploadStatus === 'Error') {
        const errorMessage = uploadResponse?.data?.Message || "Upload failed. Please try again.";
        toast.error(errorMessage, errorToastObj);
        return;
      }

      if (uploadStatus === 'Success' && documentId) {
        toast.success("Uploaded Successfully", successToastObj);
        
        // Set the selected document
        setSelectedDocumentId(documentId);
        setSelectedDocument(selectedDocument);

        // Filter tabs and update state properly
        const previewAndChatTabs = tabsList?.filter(
          tab => tab.name === "Preview" || tab.name === "Chat"
        ) || [];

        setSelectedTabs({ options: previewAndChatTabs });
        setIsCollapsed(true);
      } else {
        toast.error("Upload completed but no document ID received", errorToastObj);
        return;
      }

      // Handle collection saving
      const ids = uploadResponse?.data.ResultID;
      const workspaceName = showNewCollectionInput
        ? newCollectionName
        : selectedCollection?.workspaceName;
      const workspaceId = selectedCollection?.id;
      const userId = user?.User?.ID;

      if ((selectedCollection || showNewCollectionInput) && ids?.length) {
        try {
          await saveUploadedFilesToCollection(
            ids,
            workspaceId,
            workspaceName,
            showNewCollectionInput,
            userId,
            selectedCollection
          );
          toast.success("Files saved to collection successfully", successToastObj);
        } catch (collectionError) {
          console.error("Collection save error:", collectionError);
          toast.error("Files uploaded but failed to save to collection", errorToastObj);
        }
      }

      // Clear state on successful upload
      setUploadedFiles([]);
      setIsSourcesDialogOpen(false);
      setSelectedCollection(null);
      setNewCollectionName('');
      setShowNewCollectionInput(false);

    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Upload failed. Please try again.", errorToastObj);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger file input click
   */
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="flex justify-between gap-8 w-full h-full py-6 px-10">
      <div className="flex flex-col gap-3 w-full">
        <div
          className={`
            w-full h-full flex flex-col justify-center items-center 
            rounded-3xl border-2 border-dashed transition-all duration-300
            ${isDragging
              ? "bg-blue-50 border-blue-400 shadow-inner"
              : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"
            }
            cursor-pointer relative overflow-hidden
          `}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            aria-label="File upload input"
          />

          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center pointer-events-none">
            <div className={`
              p-4 rounded-full transition-all duration-300
              ${isDragging
                ? "bg-blue-100 text-blue-600 transform scale-110"
                : "bg-gray-100 text-gray-500"
              }
            `}>
              <Upload
                size={28}
                className={`
                  transition-transform duration-300
                  ${isDragging ? "scale-110" : ""}
                `}
              />
            </div>

            <div className="space-y-1">
              <p className="text-gray-800 font-semibold text-lg">
                Upload to My Documents
              </p>
              <p className="text-sm text-gray-500">
                {isDragging
                  ? "Drop your files here"
                  : "Drag & drop files here, or click to browse"
                }
              </p>
            </div>
          </div>

          {isDragging && (
            <div className="absolute inset-0 bg-blue-400 opacity-5 animate-pulse pointer-events-none" />
          )}
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="w-1/2 min-w-1/2 h-full flex flex-col">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col justify-start items-start gap-6">
            <div className="flex flex-col gap-2 w-full">
              {/* Collections Dropdown */}
              <CollectionsDropdown
                collections={collections}
                selectedCollection={selectedCollection}
                setSelectedCollection={setSelectedCollection}
                setCollectionTags={setCollectionTags}
                newCollectionName={newCollectionName}
                setNewCollectionName={setNewCollectionName}
                showNewCollectionInput={showNewCollectionInput}
                setShowNewCollectionInput={setShowNewCollectionInput}
                isLoadingCollections={isLoadingCollections}
                className="w-full"
              />

              {/* AI Assistant Section */}
              <Card className="rounded-2xl shadow-none border-0 bg-gray-100">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <MessageSquare
                          className={`h-4 w-4 ${startAiChat ? "text-blue-500" : "text-gray-400"}`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          AI Assistant
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enable AI processing
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

            {/* Files List */}
            <Card className="rounded-xl w-full shadow-none min-h-1/2 flex flex-col border-none">
              <div className="p-3 pb-2">
                <p className="font-semibold text-sm flex items-center justify-between">
                  <span>Selected Files</span>
                  <span className="text-xs text-muted-foreground">
                    {uploadedFiles.length} / {MAX_FILES}
                    <span className="text-red-500 font-medium"> *</span> files
                  </span>
                </p>
              </div>

              <div className="px-3 pb-3 space-y-2 max-h-[300px] overflow-y-auto">
                {uploadedFiles.map((file) => {
                  const extension = file.name.split(".").pop();
                  return (
                    <div
                      key={file.name}
                      className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 border"
                    >
                      <div className="flex items-center gap-3 text-sm font-medium text-gray-700 truncate flex-1 min-w-0">
                        {getFileIcon(extension, file.name)}
                        <span className="truncate">{file.name}</span>
                        {/* <span className="text-xs text-gray-400">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span> */}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:bg-red-100 hover:text-red-500 p-1 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.name);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Fixed Bottom Buttons */}
          <div className="flex-shrink-0 flex justify-end gap-3 pt-3 mt-3 border-t">
            <Button
              variant="outline"
              className="text-muted-foreground text-sm px-6 hover:bg-gray-200 rounded-2xl border border-gray-300"
              onClick={handleClearClick}
              disabled={loading}
            >
              Clear
            </Button>
            <Button
              disabled={uploadedFiles.length === 0 || loading}
              className="bg-gray-900/90 text-sm px-6 text-white rounded-2xl hover:bg-gray-900"
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
      )}
    </div>
  );
};

export default FileDropper;