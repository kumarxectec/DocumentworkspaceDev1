import { FileSearch, UploadIcon } from "lucide-react";
import FileDropper from "../file-dropper";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import useStore from "@/store/useStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import AddSource from "../addSource/add-source";
import UploadInFolder from "../folder/folder";
import MatterManagement from "../MatterManagement/MatterManagement";
import Collections from "../collections/collections";

const UploadDocumentDialog = () => {
  const { isCollapsed, setUploadDocumentDialog, isUploadDocumentDialogOpen, uploadedFiles } =
    useStore();

  return (
    <Dialog
      open={isUploadDocumentDialogOpen}
      onOpenChange={setUploadDocumentDialog}
    >
      <div className="w-full text-center">
        <DialogTrigger asChild>
          {!isCollapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild className="w-full">
                  <Button
                    variant="outline"
                    onClick={() => setUploadDocumentDialog(true)}
                    className="w-full h-10 font-semibold text-sm text-muted-foreground hover:bg-gray-100 rounded-full hover:border-gray-300"
                  >
                    <span className="text-xl">+</span> Add Source
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Upload Documents</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </DialogTrigger>
      </div>

      <DialogContent className="w-full md:max-w-3xl lg:max-w-6xl h-[700px]  flex flex-col justify-center items-center p-2 bg-white rounded-4xl  ">
        <DialogHeader className="flex items-start h-fit p-2">
          <DialogTitle className="text-muted-foreground font-medium text-lg">
            {/* Optional: Title text here */}
          </DialogTitle>
        </DialogHeader>

        <div className="w-full h-full flex flex-col justify-center items-center ">
          <div className={`w-full h-full  p-8 flex flex-col gap-6 justify-center items-center`}>
            <FileDropper />
            {uploadedFiles.length === 0 && (
              <div className="flex gap-6 h-full justify-around w-full items-center">
              <AddSource />
              <UploadInFolder />
              <MatterManagement />
            </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentDialog;
