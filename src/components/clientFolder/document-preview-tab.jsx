import React, { useMemo } from "react";
import { TabsContent } from "../ui/tabs";
import useStore from "@/store/useStore";

const DocumentPreviewTab = () => {
  const { selectedDocumentId, configs, selectedDocument } = useStore();



  const iframeUrl = useMemo(() => {
  // Validate necessary data
  if (
    !selectedDocumentId ||
    !selectedDocument ||
    !configs?.CLIENT_PREVIEW_URL 
  ) {
    console.error("Missing necessary data")
    return "";
  }

  console.log(selectedDocument, 'selectedDocument in preview tab')
  /**
   * Helper: extract file extension safely.
   * Handles multi-dot names and capitalization differences.
   */
  const getFileExtension = (filename) => {
    if (typeof filename !== "string" || !filename) return "";
    const lastDot = filename.lastIndexOf(".");
    if (lastDot < 1 || lastDot === filename.length - 1) return "";
    return filename.slice(lastDot + 1).toLowerCase();
  };

  // Determine reliable extension
  const extension =
    selectedDocument.extension ||
    selectedDocument.Extension ||
    getFileExtension(selectedDocument.name) ||
    getFileExtension(selectedDocument.Name) ||
    "";

  // Replace placeholders in URL
  let url = configs.CLIENT_PREVIEW_URL
    .replace("${selectedDocumentId}", selectedDocumentId)
    .replace("${ext}", extension);

  // Optional: handle legacy `newfile=` pattern
  if (url.includes("newfile=")) {
    url = url.replace("A6vxMjA7.dat", `${selectedDocumentId}.dat`);
  }

  return url;
}, [selectedDocumentId, selectedDocument, configs]);



  return (
    <div className="w-full h-full">
      {selectedDocumentId ? (
        <div className="flex flex-col w-full h-full bg-white overflow-hidden">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full min-h-[500px] border-none"
              title="Document Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Unable to load preview.
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No document selected for preview
        </div>
      )}
    </div>
  );
};

export default DocumentPreviewTab;
