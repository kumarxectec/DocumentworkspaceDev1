import React from "react";
import { Button } from "../ui/button";
import { Trash2, Upload } from "lucide-react";
import { getFileIcon } from "@/lib/constants";

const UploadSection = ({
  uploadedFiles,
  isDragging,
  fileInputRef,
  handleDrop,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  triggerFileSelect,
  handleFileChange,
  handleRemoveFile,
  configs,
}) => {
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={triggerFileSelect}
        className={`w-full h-[250px] bg-[url(${process.env.NEXT_PUBLIC_BASE_PATH_URL ?? ""}/upload_background.png)] bg-cover bg-center flex flex-col items-center justify-center gap-8 border-2 border-dashed rounded-[50px] transition-all duration-200 cursor-pointer relative group
          ${isDragging ? "bg-blue-50 border-blue-400 text-blue-400" : "bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50"}
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
            variant="primary"
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

      {uploadedFiles.length > 0 && (
        <div className="flex flex-col gap-2 w-full mt-3">
          <div className="rounded-[50px] w-full p-4 px-8 bg-white h-[250px] flex flex-col gap-2">
            <p className="font-custom text-[#0D141C] text-md px-4 pb-1">
              Uploaded Files <span className="text-muted-foreground text-sm font-medium">({uploadedFiles.length})</span>
            </p>
            {uploadedFiles.map((file) => {
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
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;