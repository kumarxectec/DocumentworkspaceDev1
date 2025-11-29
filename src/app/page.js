"use client";

import { useEffect } from "react";
import TabsContainer from "@/components/tabs/tabs-container";
import useFrontOfficeStore from "@/store/useFrontOfficeStore";

export default function Home() {
  const {
    fetchFrontOfficeTabsList,
    selectedFolderTab,
    // Assuming you will add a function to fetch folders
    // fetchFrontOfficeFolders, 
  } = useFrontOfficeStore();

  useEffect(() => {
    // Fetch the initial tabs list
    fetchFrontOfficeTabsList();
  }, [fetchFrontOfficeTabsList]);

  useEffect(() => {
    if (selectedFolderTab) {
      // Once a tab is selected, fetch the corresponding folders
      console.log("Fetching folders for:", selectedFolderTab.name);
      // fetchFrontOfficeFolders(selectedFolderTab.id);
    }
  }, [selectedFolderTab]); // Dependency on selectedFolderTab

  return <TabsContainer />;
}

