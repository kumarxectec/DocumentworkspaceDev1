import { MessageSquare, Trash2, Upload,ChevronLeft,
  ChevronRight, } from "lucide-react";
import React, { useRef, useState,useEffect } from "react";
import { Button } from "../ui/button";
import { errorToastObj, getFileIcon, successToastObj } from "@/lib/constants";
import useStore from "@/store/useStore";
import Loader from "../loader";
import { toast } from "sonner";
import Collections from "../collections/collections";
import { Card, CardContent } from "../ui/card";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// const demoFolderTree = [
//   {
//     id: "1",
//     name: "Documents",
//     children: [
//       {
//         id: "1-1",
//         name: "CoverLetter",
//         children: [],
//         CanUpload: true,
//       },
//       {
//         id: "1-2",
//         name: "Reports",
//         children: [
//           {
//             id: "1-2-1",
//             name: "AnnualReport2023",
//             children: [
//               {
//                 id: "1-2-1-1",
//                 name: "FinancialSummary",
//                 children: [],
//                 CanUpload: true,
//               },
//             ],
//           },
//           {
//             id: "1-2-2",
//             name: "Q1-Financials",
//             children: [],
//             CanUpload: true,
//           },
//         ],
//       },
//     ],
//   },
// ];


const ClientFolder = () => {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ startAiChat, setStartAiChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const fileInputRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null); 
  const [collapseLeft, setCollapseLeft] = useState(false);
  const [collapseRight, setCollapseRight] = useState(true);
  const [selectedClientFolder, setSelectedClientFolder] = useState(null);
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
    clientFolderOptions,
   getClientFoldersList,
   getFolderTreeByPath, selectedFolderTree, 
  } = useStore();

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length) {
      setUploadedFiles([...uploadedFiles, ...droppedFiles]);
    }
  };

  const handleRemoveFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.name !== fileName));
  };

  const handleClearClick = () => {
    setUploadedFiles([]);
  };

  const handleUploadFile = async () => {
    const collectionNames = collections.map((item) => item.workspaceName);

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

  useEffect(() => {
    const matchedPath = clientFolderOptions.find(item => item.text === selectedAction)?.id;
    if (matchedPath) {
      const cleanPath = matchedPath.replaceAll("\\\\", "\\");
      getFolderTreeByPath(cleanPath);
    }
  }, [selectedAction]);

  useEffect(() => {
    if (!selectedAction) return;
  
    const { clientFolderOptions } = useStore.getState();
  
    const selectedClientFolder = clientFolderOptions.find(
      (item) => item.text === selectedAction
    );
  
    if (selectedClientFolder) {
      console.log("📁 Selected Folder ID (as path):", selectedClientFolder.id);
      
      // ✅ This is where you're passing ID as ParentPath to mock folder tree
      getFolderTreeByPath(selectedClientFolder.id);
    }
  }, [selectedAction]);
  

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const existingFileNames = uploadedFiles?.map((file) => file.name);

    const hasDuplicate = selectedFiles.some((file) =>
      existingFileNames.includes(file.name)
    );

    if (hasDuplicate) {
      toast.error("Some files are already uploaded!", errorToastObj);
    }

    const uniqueFiles = selectedFiles.filter(
      (file) => !existingFileNames.includes(file.name)
    );

    if (uniqueFiles.length) {
      setUploadedFiles([...uploadedFiles, ...uniqueFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true); // 👈 Set dragging state
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false); // 👈 Reset dragging state
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    getClientFoldersList(); // ✅ Fetch client folder list on mount
  }, []);

  const renderFolderTree = (folderData) => {
    if (!folderData?.Folder) return null;
  
    return (
      <ul className="ml-4 list-disc">
        <li>
          <strong>{folderData.Folder?.folderName}</strong>
        </li>
        {folderData.Folder.childFolder?.length > 0 && (
          <ul className="ml-4 list-disc">
            {folderData.Folder.childFolder.map((child, index) => (
              <li key={index}>{child?.folderName}</li>
            ))}
          </ul>
        )}
      </ul>
    );
  };
  
  
  // const renderFolderTree = (folders) => {
  //   return (
  //     <ul className="ml-4 space-y-1 mt-1">
  //       {folders.map((folder) => (
  //         <li key={folder.id}>
  //           <details>
  //             <summary
  //               className="cursor-pointer hover:text-gray-900 hover:bg-gray-200 px-2 py-1 rounded-md"
  //               onClick={() => {
  //                 setSelectedFolder(folder);
  //                 console.log("Selected Folder:", folder);
  //               }}
  //             >
  //               📁 {folder.name}
  //             </summary>
  //             {folder.children && folder.children.length > 0 && renderFolderTree(folder.children)}
  //           </details>
  //         </li>
  //       ))}
  //     </ul>
  //   );
  // };


  return (
    <div className="flex justify-between gap-4 w-full h-full py-6 px-6">
    
      {/* Left Section: Client Dropdown & Folder Tree */}
      {/* Client Folder Selector */}
      {!collapseLeft && (
        <div className="w-1/3 flex flex-col gap-4 border-r pr-4 relative">
          <button
            onClick={() => {
              setCollapseLeft(true);
              setCollapseRight(false);
            }}
            className="absolute -right-4 top-2 p-1 bg-white border rounded-full shadow hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
      <div className="relative w-full ">
  <input
    type="text"
    value={selectedAction}
    onChange={(e) => {
      setSelectedAction(e.target.value);
      setShowSuggestions(true); // Show suggestions when typing
    }}
    onFocus={() => setShowSuggestions(true)}
    placeholder="Type Client Folder..."
    className="w-full h-[50px] border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

  {/* Autocomplete suggestions */}
  {showSuggestions && selectedAction && (
  <ul className="absolute z-10 bg-white border border-gray-200 mt-1 rounded-xl w-full max-h-60 overflow-y-auto shadow-md">
    {clientFolderOptions
      .filter((item) =>
        item.text.toLowerCase().includes(selectedAction.toLowerCase())
      )
      .map((item) => (
        <li
  key={item.id}
  onClick={() => {
  setSelectedClientFolder(item); // ✅ Save the full folder object
  setSelectedAction(item.text); // For display in the input box
  setShowSuggestions(false);

  // Call folder tree with path
  const cleanedPath = item.id.replaceAll("\\\\", "\\").replace(/\\+$/, "");
  getFolderTreeByPath(cleanedPath); // 🔁 send actual ParentFolder
}}
  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
>
  {item.text}
</li>

      ))}
    {clientFolderOptions.filter((item) =>
      item.text.toLowerCase().includes(selectedAction.toLowerCase())
    ).length === 0 && (
      <li className="px-4 py-2 text-muted-foreground text-sm italic">
        No matching folders
      </li>
    )}
  </ul>
)}

</div>

      {/* 👇 Render this block ONLY IF selectedAction is not empty */}
      {selectedAction && (
  <div className="border border-gray-200 rounded-xl p-4 overflow-auto h-full">
    <p className="text-sm font-semibold text-gray-800 mb-3">Folder Structure</p>
    {selectedFolderTree ? (
      renderFolderTree(selectedFolderTree)
    ) : (
      <p className="text-sm italic text-gray-400">No folder tree available for selected path.</p>
    )}
  </div>
)}

    </div>
  )}
      {collapseLeft && (
        <div className="flex items-start justify-center w-6">
          <button
            onClick={() => {
              setCollapseLeft(false);
              setCollapseRight(true);
            }}
            className="p-1 bg-white border rounded-full shadow hover:bg-gray-100"
            title="Expand Folder Tree"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
  
      {/* Center Section: Upload Zone */}
      {selectedFolder?.CanUpload && (
        <div
  className={`flex flex-col gap-3 transition-all duration-300 ${
    collapseLeft && collapseRight
      ? "w-full"
      : collapseLeft || collapseRight
      ? "w-2/3"
      : "w-1/3"
  }`}
>


  {/* Upload Area */}
  <div
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onDragEnter={handleDragEnter}
    onDragLeave={handleDragLeave}
    onClick={triggerFileSelect}
    className={`w-full h-[250px] bg-[url(${process.env.NEXT_PUBLIC_BASE_PATH_URL ?? ""}/upload_background.png)] bg-cover bg-center flex flex-col items-center justify-center gap-8 border-2 border-dashed rounded-[50px] transition-all duration-200 cursor-pointer relative group
      ${
        isDragging
          ? "bg-blue-50 border-blue-400 text-blue-400"
          : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"
      }
    `}
  >
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
      multiple
      className="hidden"
    />
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl group w-full h-full">
      <Button
        variant={"primary"}
        className={`text-muted-foreground bg-white ${
          isDragging ? "bg-blue-400 text-white shadow-md" : ""
        } group-hover:bg-blue-400 group-hover:text-white group-hover:shadow-md font-medium rounded-full w-fit h-fit transition-all duration-300`}
      >
        <Upload size={35} className="p-1" />
      </Button>
      <p className="text-lg font-medium text-gray-600 transition-colors duration-200">
        {configs?.labels.upload_documents.label}
      </p>
    </div>
  </div>

  {/* Uploaded Files Section */}
  {uploadedFiles.length !== 0 && (
    <div className="flex flex-col gap-2 w-full ">
      <div className="rounded-[50px] w-full p-4 px-8 bg-white h-[250px] flex flex-col gap-2 ">
        <p className="font-custom text-[#0D141C] text-md px-4 pb-1">
          Uploaded Files{" "}
          <span className="text-muted-foreground text-sm font-medium ">
            ({uploadedFiles.length})
          </span>
        </p>

        {/* Scrollable File List */}
        
          {uploadedFiles?.length === 0 ? (
            <div className="flex justify-center items-center text-gray-400 text-sm h-full">
              No files uploaded
            </div>
          ) : (
            uploadedFiles.map((file) => {
              const extension = file.name.split(".").pop();
              return (
                <div
                  key={file.name}
                  className="flex justify-between items-center w-full bg-white rounded-md shadow-sm px-4 py-2 border border-gray-200"
                >
                  <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm truncate">
                    {getFileIcon(extension, file.name)}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-gray-500 hover:bg-red-100 hover:text-red-500"
                    onClick={() => handleRemoveFile(file.name)}
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </Button>
                </div>
              );
            })
          )}
        
      </div>
    </div>
    )}
    </div>
      )}

     {/* RIGHT SECTION */}
     {!collapseRight && uploadedFiles.length > 0 && (
  <div
    className={`flex flex-col gap-3 transition-all duration-300 relative ${
      collapseLeft ? "w-full" : "w-1/3"
    }`}
  >
    {/* Collapse Button */}
    <button
      onClick={() => {
        setCollapseRight(true);
        setCollapseLeft(false);
      }}
      className="absolute -left-4 top-2 p-1 bg-white border rounded-full shadow hover:bg-gray-100"
      title="Collapse"
    >
      <ChevronRight size={20} />
    </button>

    {/* Collections / AI Toggle / Upload Actions */}
    <Card className="rounded-xl shadow-none border-0 bg-gray-100 px-3 py-2">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg">
              <MessageSquare className={`h-4 w-4 ${startAiChat ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">AI Assistant</p>
              <p className="text-xs text-muted-foreground">Start AI Conversation</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={startAiChat}
              onChange={() => setStartAiChat(!startAiChat)}
            />
            <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full peer-checked:after:translate-x-full after:transition-all" />
          </label>
        </div>
      </CardContent>
    </Card>

    {/* Example iFrame */}
    <iframe
      src="https://www.google.com/search?q=tree+view+react+nextjs"
      className="w-full h-full border-none min-h-[500px] rounded-b-2xl"
    />

    {/* Buttons */}
    <div className="flex justify-end gap-2 mt-2">
      <Button
        variant="outline"
        className="text-muted-foreground text-sm hover:bg-gray-200"
        onClick={() => setUploadedFiles([])}
      >
        Clear
      </Button>
      <Button
        disabled={uploadedFiles.length === 0}
        className="bg-gray-900 text-white text-sm px-4 py-2 rounded-2xl hover:bg-gray-800"
        onClick={handleUploadFile}
      >
        {loading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  </div>
)}

{/* Expand Button When Collapsed */}
{collapseRight && uploadedFiles.length > 0 && (
  <div className="flex items-start justify-center w-6">
    <button
      onClick={() => {
        setCollapseRight(false);
        setCollapseLeft(true);
      }}
      className="p-1 bg-white border rounded-full shadow hover:bg-gray-100"
      title="Expand Right Panel"
    >
      <ChevronLeft size={20} />
    </button>
  </div>
)}

    </div>
  );
  
  
};

export default ClientFolder;
