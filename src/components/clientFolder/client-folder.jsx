import { useStore } from "zustand";
import ClientDropdown from "./select-clientfolder";
import ClientTree from "./folder-tree";

const ClientFolder = () => {
  const {
    clientFolderOptions,
    setSelectedClientFolder,
    getClientFoldersList,
    getFolderTreeByPath,
    handleFolderClick,
    clearSelectedFolder,
    setSelectedTabs,
    folderLoading,
    showClientDropdown,
    setFolderLoading,
    setDocumentsList,
    setUploadedFiles,
    clientFolderPage,
    hasMoreClientFolders,
    isClientFolderLoading,
    setIsClientFolderLoading,
  } = useStore();

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild className="w-full">
            {showClientDropdown ? (
              <ClientDropdown
                selectedAction={selectedAction}
                setSelectedAction={setSelectedAction}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                clientFolderOptions={clientFolderOptions}
                setShowFolderTree={setShowFolderTree}
              />
            ) : null}
          </TooltipTrigger>
          <TooltipContent side="bottom">Select Client Folder</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Folder Tree Section */}
      {showFolderTree && (
        <div className="w-full h-full transition-all duration-300 ease-in-out overflow-y-auto ">
          {folderLoading[selectedLabel] ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 animate-pulse">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          ) : (
            <ClientTree />
          )}
        </div>
      )}
    </div>
  );
};

export default ClientFolder;
