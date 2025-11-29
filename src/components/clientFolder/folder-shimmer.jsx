import { Folder, ChevronRight } from "lucide-react";

const FolderTreeShimmer = () => {
  const folderStructure = [
    { name: "Client Documents", depth: 0, expanded: true },
    { name: "Contracts", depth: 1, expanded: true },
    { name: "Signed", depth: 2 },
    { name: "Drafts", depth: 2 },
    { name: "Correspondence", depth: 1 },
    { name: "Financial", depth: 0, expanded: true },
    { name: "Invoices", depth: 1 },
    { name: "Receipts", depth: 1 },
    { name: "Project Files", depth: 0 },
  ];

  return (
    <div className="px-6 py-6 h-full overflow-y-auto relative">
      {/* Simulate folder tree rows */}
      <div className="space-y-3 animate-pulse">
        {folderStructure.map((folder, index) => (
          <div
            key={index}
            className="flex items-center gap-2"
            style={{ paddingLeft: `${folder.depth * 20 + 4}px` }}
          >
            {folder.expanded !== undefined && (
              <ChevronRight
                className={`h-4 w-4 text-gray-300 transition-transform ${
                  folder.expanded ? "rotate-90" : ""
                }`}
              />
            )}
            <Folder className="h-4 w-4 text-gray-300 flex-shrink-0" />
            <div className="w-40 h-3 bg-gray-200 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderTreeShimmer;
