"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "../components/ui/button";
import useStore from "../store/useStore";
import {
  ChevronRight,
  Columns3,
  Copy,
  CopyCheck,
  Ellipsis,
  LayoutGrid,
  User,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import useFrontOfficeStore from "@/store/useFrontOfficeStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

// This component uses useSearchParams, so it must be rendered inside a Suspense boundary.
const HeaderContent = () => {
  const [copied, setCopied] = useState(false);

  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Directly derive the state from searchParams. No need for useEffect or useState here.
  const showHeader = searchParams.get("showHeader") === "true";

  const {
    selectedTabs,
    toggleItem,
    user,
    selectedDocumentId,
    tabsList,
    documentsList,
    configs,
    uploadSource
  } = useStore();

  const { isFrontOffice, setIsFrontOffice, selectedFolder } =
    useFrontOfficeStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedDoc[0].ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    setIsFrontOffice(pathname === "/front-office/");
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pathname, setIsFrontOffice]);

  const handleSelectAll = () => {
    const selectedIds = selectedTabs.options?.map((tab) => tab.id) || [];
    const isAllSelected = tabsList?.every((item) =>
      selectedIds.includes(item.id)
    );

    if (isAllSelected) {
      tabsList?.forEach((item) => toggleItem("options", item, false));
    } else {
      tabsList?.forEach((item) => {
        if (!selectedIds.includes(item.id)) {
          toggleItem("options", item, true);
        }
      });
    }
  };

  const selectedDoc =
    documentsList?.filter((doc) => doc.ID === selectedDocumentId) || [];

  const apps = [
    { name: "search", icon: "📧", logo: "/logo.png" },
    { name: "reporting", icon: "📂", logo: "/logo.png" },
    { name: "DFX", icon: "📄", logo: "/logo.png" },
    { name: "DMS", icon: "📊", logo: "/logo.png" },
    { name: "Calendar", icon: "📅", logo: "/logo.png" },
    { name: "Meet", icon: "🎥", logo: "/logo.png" },
    { name: "Contacts", icon: "👥", logo: "/logo.png" },
    { name: "Tasks", icon: "✅", logo: "/logo.png" },
  ];

  console.log(uploadSource, 'uplaod source in header')

  // Version 1: Header when showHeader=true
  const HeaderVersion1 = () => (
    <div className="w-full flex justify-between items-center px-3 pr-4 pb-1">
      {/* Left */}
      <div className="flex gap-4 justify-center items-center">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH_URL}/logo.png`}
          alt="logo"
          width={42}
          height={42}
        />
        {!isFrontOffice && selectedDoc[0] && (
          <div className="flex gap-3 p-1 justify-start items-center h-full">
            <p className="text-gray-900/80 font-custom text-lg md:text-xl truncate">
              {selectedDoc[0].FileName}
            </p>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-muted-foreground text-sm h-fit mt-1 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <span className="text-xs opacity-70">(ID: {selectedDoc[0].ID})</span>
                    {copied ? (
                      <CopyCheck size={14} className="text-green-500 transition-transform duration-200 scale-110" />
                    ) : (
                      <Copy size={14} className="opacity-70 hover:opacity-100" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs px-2 py-1 bg-gray-900 text-white rounded-md">
                  {copied ? "Copied!" : "Click to copy ID"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {isFrontOffice && selectedFolder && (
          <Breadcrumb>
            <BreadcrumbList className="flex items-center gap-1 flex-wrap text-sm">
              {(() => {
                const parts = selectedFolder?.fullPath
                  ?.split("\\")
                  .filter(Boolean);
                const shouldCollapse = parts?.length > 3;
                const displayedParts = shouldCollapse
                  ? [parts[0], "...", parts[parts.length - 1]]
                  : parts;

                return displayedParts?.map((part, index, arr) => (
                  <div key={index} className="flex items-center">
                    <BreadcrumbItem>
                      {part === "..." ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="px-1.5 py-0.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100">
                            <Ellipsis className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-48 max-h-60 overflow-y-auto"
                          >
                            {parts
                              ?.slice(1, -1)
                              .map((hiddenPart, hiddenIndex) => (
                                <DropdownMenuItem
                                  key={hiddenIndex}
                                  className="text-xs"
                                  onClick={() =>
                                    console.log("Navigate:", hiddenPart)
                                  }
                                >
                                  {hiddenPart}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : index === arr.length - 1 ? (
                        <BreadcrumbPage className="truncate max-w-[160px] text-xs text-gray-700 font-medium">
                          {part}
                        </BreadcrumbPage>
                      ) : (
                        <>
                          <BreadcrumbLink
                            href="#"
                            className="truncate max-w-[140px] text-sm text-gray-500 hover:text-blue-600"
                          >
                            {part}
                          </BreadcrumbLink>
                          <BreadcrumbSeparator>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </BreadcrumbSeparator>
                        </>
                      )}
                    </BreadcrumbItem>
                  </div>
                ));
              })()}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {!isFrontOffice && (
          <div className="relative" ref={dropdownRef} onMouseLeave={() => setIsDropdownOpen(false)}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!selectedDocumentId || uploadSource === 'clientFolder'}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-9 w-9 p-0 text-muted-foreground/70 hover:text-muted-foreground hover:bg-gray-100/50 transition-colors focus-visible:ring-1 focus-visible:ring-gray-200"
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center items-center hover:bg-gray-200 p-1 rounded-full w-10 h-10">
                      <Columns3
                        size={18}
                        className="shrink-0 cursor-pointer"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-xs font-medium"
                  >
                    Select tabs
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 z-50 p-2">
                <div
                  onClick={handleSelectAll}
                  className="p-2 text-sm flex items-center gap-2 text-muted-foreground font-medium hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) {
                        const selectedIds =
                          selectedTabs.options?.map((tab) => tab.id) || [];
                        const isAllSelected = tabsList?.every((item) =>
                          selectedIds.includes(item.id)
                        );
                        const isSomeSelected = tabsList?.some((item) =>
                          selectedIds.includes(item.id)
                        );

                        el.checked = isAllSelected;
                        el.indeterminate = !isAllSelected && isSomeSelected;
                      }
                    }}
                    className="h-3 w-3 cursor-pointer accent-gray-600/50"
                  />
                  Select All
                </div>

                <div className="flex flex-col gap-1">
                  {tabsList?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem("options", item)}
                      className={`p-2 text-sm flex items-center gap-2 text-muted-foreground font-medium transition-colors rounded cursor-pointer ${
                        selectedTabs.options?.some((tab) => tab.id === item.id)
                          ? "bg-gray-100 dark:bg-gray-700/80"
                          : "hover:bg-gray-100/80 dark:hover:bg-gray-100/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTabs.options?.some(
                          (tab) => tab.id === item.id
                        )}
                        readOnly
                        className="h-3 w-3 cursor-pointer accent-gray-600/50"
                      />
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isFrontOffice && (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <DropdownMenuTrigger asChild>
                    <LayoutGrid
                      size={28}
                      className="p-1 text-muted-foreground cursor-pointer"
                    />
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>My Apps</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent
              align="end"
              className="w-64 p-4 grid grid-cols-3 gap-4 rounded-xl"
            >
              {apps.map((app, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH_URL}/logo.png`}
                    alt={app.name}
                    width={40}
                    height={40}
                  />
                  <span className="text-xs mt-1">{app.name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {user && (
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-sm">
                  <p>{user.User.Name.split("\\").pop()}</p>
                  <p className="text-xs text-gray-400">
                    {user.User.Roles[0]?.RoleName || "User"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );

  // Version 2: When showHeader=false
  const HeaderVersion2 = () => (
    <div className="w-full flex justify-between items-center px-3 pr-6 min-h-10">
      <div className="flex gap-4 px-2 justify-center items-center">
        {!isFrontOffice
          ? selectedDoc?.[0]
            ? (
              <div className="flex gap-3 p-1 justify-start items-center h-full">
                <p className="text-gray-900/80 font-custom text-lg md:text-xl truncate">
                  {selectedDoc[0].FileName}
                </p>

                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-muted-foreground text-sm h-fit mt-1 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <span className="text-xs opacity-70">(ID: {selectedDoc[0].ID})</span>
                        {copied ? (
                          <CopyCheck size={14} className="text-green-500 transition-transform duration-200 scale-110" />
                        ) : (
                          <Copy size={14} className="opacity-70 hover:opacity-100" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs px-2 py-1 bg-gray-900 text-white rounded-md">
                      {copied ? "Copied!" : "Click to copy ID"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )
            : <p className="text-gray-900/80 font-custom text-lg md:text-xl">{configs?.DOCUMENT_WORKSPACE_NAME}</p>
          : selectedFolder
            ? <Breadcrumb> {/* Similar breadcrumb code here */} </Breadcrumb>
            : <p className="text-gray-900/80 font-custom text-lg md:text-xl">{configs?.FRONT_OFFICE_NAME}</p>}
      </div>

      <div className="flex items-center gap-4">
        {!isFrontOffice && (
          <div className="relative" ref={dropdownRef} onMouseLeave={() => setIsDropdownOpen(false)}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!selectedDocumentId || uploadSource === 'clientFolder'}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-9 w-9 p-0 text-muted-foreground/70 hover:text-muted-foreground hover:bg-gray-100/50 transition-colors focus-visible:ring-1 focus-visible:ring-gray-200"
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center items-center hover:bg-gray-200 p-1 rounded-full w-10 h-10">
                      <Columns3
                        size={18}
                        className="shrink-0 cursor-pointer"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-xs font-medium"
                  >
                    Select tabs
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 z-50 p-2">
                <div
                  onClick={handleSelectAll}
                  className="p-2 text-sm flex items-center gap-2 text-muted-foreground font-medium hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) {
                        const selectedIds =
                          selectedTabs.options?.map((tab) => tab.id) || [];
                        const isAllSelected = tabsList?.every((item) =>
                          selectedIds.includes(item.id)
                        );
                        const isSomeSelected = tabsList?.some((item) =>
                          selectedIds.includes(item.id)
                        );

                        el.checked = isAllSelected;
                        el.indeterminate = !isAllSelected && isSomeSelected;
                      }
                    }}
                    className="h-3 w-3 cursor-pointer accent-gray-600/50"
                  />
                  Select All
                </div>

                <div className="flex flex-col gap-1">
                  {tabsList?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem("options", item)}
                      className={`p-2 text-sm flex items-center gap-2 text-muted-foreground font-medium transition-colors rounded cursor-pointer ${
                        selectedTabs.options?.some((tab) => tab.id === item.id)
                          ? "bg-gray-100 dark:bg-gray-700/80"
                          : "hover:bg-gray-100/80 dark:hover:bg-gray-100/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTabs.options?.some(
                          (tab) => tab.id === item.id
                        )}
                        readOnly
                        className="h-3 w-3 cursor-pointer accent-gray-600/50"
                      />
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isFrontOffice && (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <DropdownMenuTrigger asChild>
                    <LayoutGrid
                      size={28}
                      className="p-1 text-muted-foreground cursor-pointer"
                    />
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>My Apps</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent
              align="end"
              className="w-64 p-4 grid grid-cols-3 gap-4 rounded-xl"
            >
              {apps.map((app, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH_URL}/logo.png`}
                    alt={app.name}
                    width={40}
                    height={40}
                  />
                  <span className="text-xs mt-1">{app.name}</span>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  return showHeader ? <HeaderVersion1 /> : <HeaderVersion2 />;
};

// The main exported component.
// We wrap HeaderContent in a Suspense boundary here.
// This ensures that any page using <Header /> will not break during SSR.
const Header = () => {
  return (
    <Suspense fallback={<div className="w-full min-h-10" />}>
      <HeaderContent />
    </Suspense>
  );
};

export default Header;