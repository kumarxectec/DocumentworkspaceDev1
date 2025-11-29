'use client';

import FolderTab from "@/components/frontOffice/upload/folder-tab";
import PreviewTab from "@/components/frontOffice/upload/preview-tab";
import UploadTab from "@/components/frontOffice/upload/upload-tab";
import useFrontOfficeStore from "@/store/useFrontOfficeStore";
import useStore from "@/store/useStore";
import { useEffect } from "react";

export default function FrontOfficePage() {
  const { 
    frontOfficeUITab, 
    fetchFrontOfficeTabsList, 
    selectedFolderTab, 
    fetchFrontOfficeFolders ,
    fetchFOClientsList,
    fetchFOLawMetadata,
    uploadStatus,
    uploadState
  } = useFrontOfficeStore();

  

  const {setConfigs, configs, fetchSecurityGroup } = useStore();

  const getUserSecurityGroup = async () => {
    fetchSecurityGroup()
  }
  
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH_URL}/config.json`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data, 'drom configs')
        setConfigs(data);
      })
      .then(() => {
        getUserSecurityGroup();
      })
      .then(() => {
        fetchFrontOfficeTabsList()
      })
      .catch((err) => {
        console.error("Failed to load config.json:", err);
      });
  }, [fetchFrontOfficeTabsList]);

  useEffect(() => {
    console.log(selectedFolderTab)
    if (selectedFolderTab) {
      fetchFOClientsList()
      fetchFOLawMetadata()
    }
  }, [selectedFolderTab, fetchFrontOfficeFolders]);

  return (
    <div className="w-full h-full flex justify-start items-center p-1">
      {frontOfficeUITab === 'upload' ? (
        <div className="w-full h-[calc(100vh-4rem)]  flex justify-start items-center px-2 gap-3">
          <FolderTab />
          <UploadTab />
          {uploadState.status === 'success'  ? <PreviewTab /> : null}  
        </div>
      ) : (
        <div>
          <h1>Search View</h1>
          <p>Coming soon...</p>
        </div>
      )}
    </div>
  );
}
