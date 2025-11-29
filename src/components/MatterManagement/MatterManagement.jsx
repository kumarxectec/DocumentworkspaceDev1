"use client";
import { useState } from "react";
import TagInput from "../tagsInput";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Briefcase, Plus } from "lucide-react";
import Loader from "../loader";
import FileDropper from "../file-dropper";
import Collections from "../collections/collections";

const MatterManagement = () => {
  const [loading, setLoading] = useState(false);
  const {
    setDocumentsList,
    setAddSourceDialog,
    setUploadDocumentDialog,
    user,
    tags,
    setTags,
    configs,
    setSelectedDocumentId,
    setSelectedCollection,
    selectedCollection,
    setCollectionTags,
    collectionTags,
    newCollectionName,
    showNewCollectionInput,
    saveWorkSpaceCollection,
  } = useStore();

  const handleSearchClick = async () => {
    console.log(tags);
    setLoading(true);
    try {
      const columnDetailMasterId = user?.User?.ColumnDetailMaster?.[0]?.Id;
      if (!columnDetailMasterId) {
        toast.error("User column detail not available");
        return;
      }
      await setDocumentsList(tags, columnDetailMasterId);
      setAddSourceDialog(false);
    } catch (error) {
      console.error("Error setting document list", error);
      toast.error("Something went wrong while searching.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearClick = () => {
    setTags([]);
  };

  return (
    <div className="flex flex-col justify-start  gap-12 w-full h-full py-6 px-10">
      <div className="flex flex-col gap-2 px-4">
        <p className="font-custom text-[#0D141C] text-md px-2">
          Search Documents
        </p>
        <TagInput />
      </div>
      <div>
        <Collections />
      </div>
      <div className="w-full h-fit flex gap-3 justify-end items-center">
        <Button
          variant={"outline"}
          className="text-muted-foreground text-sm hover:bg-gray-200"
          onClick={handleClearClick}
        >
          Clear
        </Button>
        <Button
          className="bg-gray-900/90 text-sm text-slate-50 w-fit min-w-[80px] px-4 py-2 float-right hover:bg-gray-900 rounded-2xl"
          onClick={handleSearchClick}
          disabled={[...tags, ...collectionTags]?.length === 0}
        >
          {loading ? (
            <Loader width={4} height={4} />
          ) : selectedCollection ? (
            "Save and Search"
          ) : (
            "Search"
          )}
        </Button>
      </div>
    </div>
  );
};

export default MatterManagement;
