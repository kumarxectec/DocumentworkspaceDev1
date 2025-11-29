"use client";

import { FileSearch, FolderSearch, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import useStore from "@/store/useStore";

const DFXSearchTab = () => {
  const { configs } = useStore.getState();
  const [iframeKey, setIframeKey] = useState(Date.now()); // force iframe reload on resize

 const iframeUrl = useMemo(() => {
  // Ensure we have the necessary data before proceeding.
  if (!selectedDocumentId || !selectedDocument || !tab?.url) return "";

  /**
   * Helper function to extract the file extension from a filename.
   * Handles cases like "file.name.ext" and returns "ext".
   */
  const getFileExtension = (filename) => {
    if (typeof filename !== 'string' || !filename) return "";
    const lastDotIndex = filename.lastIndexOf('.');
    // A valid extension requires the dot not to be the first or last character.
    if (lastDotIndex < 1 || lastDotIndex === filename.length - 1) {
      return "";
    }
    return filename.slice(lastDotIndex + 1);
  };

  // Determine the extension with a more robust order of precedence.
  // This chain will skip any property that is undefined, null, or an empty string.
  const extension =
    selectedDocument.extension ||
    selectedDocument.Extension ||
    getFileExtension(selectedDocument.name) || // Check for 'name' (lowercase) first
    getFileExtension(selectedDocument.Name) || // Fallback to 'Name' (uppercase)
    ""; // Final fallback to an empty string.

  let url = tab.url
    .replace("${selectedDocumentId}", selectedDocumentId)
    .replace("${REPO_NAME}", configs?.NEXT_PUBLIC_REPOSITORY_NAME || "")
    .replace("${ext}", extension); // Use the reliably sourced extension

  if (url.includes("newfile=")) {
    url = url.replace("A6vxMjA7.dat", `${selectedDocumentId}.dat`);
  }

  return url;
}, [tab?.url, selectedDocumentId, selectedDocument, configs]);

  const handleClose = () => {
    const DFXSearchTab = tabsList?.find((item) => item.name === "DFXSearch");
    if (DFXSearchTab) {
      toggleItem("options", DFXSearchTab);
    }
  };

  // 🔁 Resize observer to trigger iframe reload
  // useEffect(() => {
  //   const observer = new ResizeObserver(() => {
  //     // Reset iframe key to trigger re-render
  //     setIframeKey(Date.now());
  //   });

  //   if (iframeContainerRef.current) {
  //     observer.observe(iframeContainerRef.current);
  //   }

  //   return () => {
  //     if (iframeContainerRef.current) {
  //       observer.unobserve(iframeContainerRef.current);
  //     }
  //   };
  // }, []);

  return (
    <div className={`${selectedTabs.options?.some((t) => t.name === "DFXSearch") ? "flex" : "hidden"} flex-col text-slate-800 h-full   rounded-2xl shadow-sm transition-all duration-300 w-full`}>
       <Card className="text-slate-800 h-full flex flex-col rounded-2xl shadow-sm w-full">
      <CardHeader>
        <CardTitle className="border-b border-slate-300 p-1">
          <div className="flex justify-between items-center">
            <div className="flex justify-start items-center pl-4 p-1 gap-1 h-8">
              <span className="text-muted-foreground">
                <FolderSearch  size={16} />
              </span>
              <p className="text-muted-foreground text-sm font-medium">DFX Search</p>
            </div>
            <div
              className="text-muted-foreground cursor-pointer hover:bg-gray-200 w-8 h-8 flex items-center justify-center rounded-full"
              onClick={handleClose}
            >
              <X size={16} />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      {/* ref={iframeContainerRef} */}
      <CardContent className="w-full h-full flex-1 p-0" >
        {console.log(iframeUrl)}
        {iframeUrl && (
          <iframe
            // key={iframeKey} // this causes re-render
            src={iframeUrl}
            className="w-full h-full border-none min-h-[500px] rounded-b-2xl"
            title="Preview"
          ></iframe>
         )} 
      </CardContent>
    </Card>
    </div>
   
  );
};

export default PreviewTab;