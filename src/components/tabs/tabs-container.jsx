"use client";

import { lazy, useMemo } from "react";
import DocumentSearchTab from "./document-search-tab";
import useStore from "@/store/useStore";
import NoDocumentSelected from "../no-document-selected";
import ClientMetaDataTab from "../clientFolder/client-metadata-tab";
import UploadTab from "./upload-tab";

const ChatDocumentTab = lazy(() => import("./chat-document-tab"));
const MetaDataTab = lazy(() => import("../tabs/metadata-tab"));
const PreviewTab = lazy(() => import("./preview-tab"));
const ClientFolderUploadTab = lazy(() => import("./client-folder-upload-tab"));
const CollectionTab = lazy(() => import("./collection-tab"));

const TabsContainer = () => {
  const {
    selectedTabs,
    tabsList,
    selectedDocumentId,
    selectedFolder,
    uploadedFiles,
    collectionTabClosed,
    uploadSource 
  } = useStore();

  console.log("🧪 TABS: ", tabsList);
  console.log("📁 Folder: ", selectedFolder);
  console.log(selectedTabs.options, 'selectedTabs')



  const enhancedTabsList = useMemo(() => {
    const tabs = [...(selectedTabs.options || [])];

  const hasUpload = tabs.some((t) => t.name === "ClientUpload");
  const hasCollection = tabs.some((t) => t.name === "Collection");

  const updatedTabs = [...tabs];

  const shouldShowCollection =
    uploadedFiles.length > 0 &&
    !hasCollection &&
    !collectionTabClosed &&
    uploadSource === "ClientUpload" &&
    hasUpload; // ✅ only when Upload tab is visible

  if (shouldShowCollection) {
    updatedTabs.push({
      id: 9998,
      name: "Collection",
      seq: updatedTabs.length + 1,
    });
  }

  return updatedTabs.sort((a, b) => a.seq - b.seq);
}, [selectedTabs.options, uploadedFiles, collectionTabClosed, uploadSource]);



console.log("💡 Enhanced Tabs List", enhancedTabsList);


  const renderTabComponent = (tab) => {
    console.log("🔍 Rendering tab: ", tab.name);

    switch (tab.name) {
      case "Metadata":
        return <MetaDataTab key={tab.id} tab={tab} />;
      case "Preview":
        return <PreviewTab key={tab.id} tab={tab} />;
      case "Chat":
        return <ChatDocumentTab key={tab.id} tab={tab} />;
      case "ClientUpload":
        return <ClientFolderUploadTab key={tab.id} tab={tab} />;
      case "UploadDocuments":
        return <UploadTab key={tab.id} tab={tab} />
      case "Collection":
        return <CollectionTab key={tab.id} tab={tab} />;
      case "Client Metadata":
  return <ClientMetaDataTab key={tab.id} tab={tab} />;

      default:
        return null;
    }
  };

  return (
    // <div className="h-full">
    //   <main className="w-full h-full flex flex-col md:flex-row justify-start items-center gap-3 px-2">
    //     <DocumentSearchTab />
    //     {selectedTabs.options?.length === 0 && <NoDocumentSelected />}
    //     {enhancedTabsList?.map((tab) => renderTabComponent(tab))}
    //   </main>
    // </div>
    <main className="w-full h-full flex flex-col md:flex-row justify-start items-center gap-3 px-2">
  <DocumentSearchTab />
  {enhancedTabsList.length === 0 && <NoDocumentSelected />}
  {enhancedTabsList.map((tab) => renderTabComponent(tab))}
</main>

  );
};

export default TabsContainer;
