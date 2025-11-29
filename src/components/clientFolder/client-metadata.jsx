import React from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const ClientMetadata = ({
  uploadedFiles = [],
  handleUploadFile,
  setUploadedFiles,
  loading,
  startAiChat,
  setStartAiChat,
}) => {
  if (uploadedFiles.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 transition-all duration-300 w-1/3 relative">
      {/* Metadata Card */}
      <Card className="rounded-xl shadow-none border-0 bg-gray-100 px-3 py-2">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg">
                <MessageSquare
                  className={`h-4 w-4 ${
                    startAiChat ? "text-blue-500" : "text-gray-400"
                  }`}
                />
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
              <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full peer-checked:after:translate-x-full after:transition-all" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Example iframe - can be removed or replaced with real content */}
      <iframe
        src="https://www.google.com/search?q=tree+view+react+nextjs"
        className="w-full h-full border-none min-h-[500px] rounded-b-2xl"
      />

      {/* Action Buttons */}
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
  );
};

export default ClientMetadata;
