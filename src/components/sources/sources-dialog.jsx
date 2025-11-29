import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import AddSource from "../addSource/add-source";
import UploadInFolder from "../folder/folder";
import MatterManagement from "../MatterManagement/MatterManagement";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import FileDropper from "../file-dropper";
import useStore from "@/store/useStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const SourcesDialog = () => {
  const { isSourcesDialogOpen, setIsSourcesDialogOpen, configs } = useStore();
  return (
    <Dialog open={isSourcesDialogOpen} onOpenChange={setIsSourcesDialogOpen}>
      <DialogContent className="w-full md:max-w-3xl lg:max-w-6xl h-full  overflow-auto  bg-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg text-muted-foreground hidden">
            Source Manager
          </DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue={configs?.labels.add_source.label}
          className="w-full h-full flex flex-col gap-4 items-center relative"
        >
          {/* <TabsList className="absolute -top-3 flex justify-between w-[70%] h-10 px-2 py-4 bg-gray-100 rounded-b-xl shadow-[inset_0_-2px_5px_rgba(0,0,0,0.08)]">
            {Object.entries(configs?.labels).map(([key, item]) => (
              <TabsTrigger
                // disabled={item.sub_heading == "Save to Client Folder" || item.sub_heading == "Save to Matter Folder" ? true : false }
                key={key}
                value={item.label}
                className={`w-full h-7 rounded-full px-4 py-2 text-xs font-semibold text-gray-600 data-[state=active]:bg-white  data-[state=active]:shadow-sm data-[state=active]:text-black  transition-all duration-200 `}
              >
                {item.sub_heading}
              </TabsTrigger>
            ))}
          </TabsList> */}

          <TabsContent
            value={configs?.labels.upload_documents.label}
            className="h-full w-full overflow-auto mt-10"
          >
            <FileDropper />
          </TabsContent>
          <TabsContent
            value={configs?.labels.add_source.label}
            className="h-full w-full overflow-auto mt-5"
          >
            <AddSource />
          </TabsContent>
          <TabsContent
            value={configs?.labels.client_folder.label}
            className="h-full w-full overflow-auto mt-10"
          >
            <UploadInFolder />
          </TabsContent>
          <TabsContent
            value={configs?.labels.matter_folder.label}
            className="h-full w-full overflow-auto mt-10"
          >
            <MatterManagement />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SourcesDialog;
