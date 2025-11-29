"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Search, RefreshCcw, X, User, Folder } from "lucide-react";
import TreeView from "./tree-view";
import useFrontOfficeStore from "@/store/useFrontOfficeStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ──────────────────────────────
// Client List Item Component
// ──────────────────────────────
const ClientListItem = React.memo(({ client, isSelected, onClick }) => (
  <div
    onClick={() => onClick(client)}
    className={cn(
      "relative flex items-center gap-3 px-3 py-2 cursor-pointer transition-all duration-150",
      "border-b border-gray-100 last:border-b-0",
      {
        "bg-blue-50/50 hover:bg-blue-50": isSelected,
        "hover:bg-gray-50": !isSelected,
      }
    )}
  >
    {isSelected && (
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
    )}

    <div
      className={cn("flex items-center justify-center h-8 w-8 rounded-full", {
        "bg-blue-100": isSelected,
        "bg-gray-100": !isSelected,
      })}
    >
      <User
        className={cn("h-4 w-4", {
          "text-blue-600": isSelected,
          "text-gray-600": !isSelected,
        })}
      />
    </div>

    <div className="flex-1 min-w-0">
      <p
        className={cn("text-sm truncate", {
          "font-semibold text-gray-900": isSelected,
          "font-medium text-gray-800": !isSelected,
        })}
      >
        {client.name}
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
        {client.partyCode && <span>{client.partyCode}</span>}
        {client.department && client.partyCode && <span>•</span>}
        {client.department && <span>{client.department}</span>}
      </div>
    </div>

    <div className="flex-shrink-0">
      <div
        className={cn("h-6 w-6 rounded flex items-center justify-center", {
          "bg-blue-100": isSelected,
          "bg-transparent": !isSelected,
        })}
      >
        <svg
          className={cn("h-4 w-4", {
            "text-blue-600": isSelected,
            "text-gray-400": !isSelected,
          })}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
));
ClientListItem.displayName = "ClientListItem";

// ──────────────────────────────
// Main FolderTab Component
// ──────────────────────────────
export default function FolderTab() {
  const [isClient, setIsClient] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ CORRECTED: Select individual state slices to prevent re-render loops.
  const clientsList = useFrontOfficeStore((s) => s.clientsList);
  const selectedClient = useFrontOfficeStore((s) => s.selectedClient);
  const selectedFolderTab = useFrontOfficeStore((s) => s.selectedFolderTab);
  const setSelectedClient = useFrontOfficeStore((s) => s.setSelectedClient);
  const fetchFrontOfficeFolders = useFrontOfficeStore((s) => s.fetchFrontOfficeFolders);
  const setSearchTerm = useFrontOfficeStore((s) => s.setSearchTerm);
  const fetchFOLawMetadata = useFrontOfficeStore((s) => s.fetchFOLawMetadata);



  useEffect(() => setIsClient(true), []);

  // ──────────────────────────────
  // Handlers
  // ──────────────────────────────
  const handleChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);

    if (selectedClient) {
      setSearchTerm(val);
    } else {
      setSearchQuery(val);
    }
  };

  const handleClearSearch = useCallback(() => {
    setLocalSearch("");
    setSearchQuery("");
    setSearchTerm("");
  }, [setSearchTerm]);
  
  // ──────────────────────────────
  // Filtered clients (for client list view)
  // ──────────────────────────────
  const filteredClients = useMemo(() => {
    if (!clientsList) return [];
    if (!searchQuery.trim()) return clientsList;

    const q = searchQuery.toLowerCase();
    return clientsList.filter(
      (client) =>
        client.name?.toLowerCase().includes(q) ||
        client.partyCode?.toLowerCase().includes(q) ||
        client.department?.toLowerCase().includes(q) ||
        client.no?.toString().includes(q)
    );
  }, [clientsList, searchQuery]);

  const handleClientSelect = useCallback(
    (client) => {
      setSelectedClient(client);
      setLocalSearch("");
      setSearchQuery("");
      setSearchTerm("");

      if (selectedFolderTab) {
        fetchFrontOfficeFolders(selectedFolderTab.folderType, "ROOT");
      }
    },
    [setSelectedClient, selectedFolderTab, fetchFrontOfficeFolders, setSearchTerm]
  );

  const handleBackToClients = useCallback(() => {
    setSelectedClient(null);
    setLocalSearch("");
    setSearchQuery("");
    setSearchTerm("");
  }, [setSelectedClient, setSearchTerm]);

  const handleRefresh = useCallback(() => {
    if (selectedClient && selectedFolderTab) {
      fetchFOLawMetadata()
    }
  }, [selectedClient, selectedFolderTab, fetchFrontOfficeFolders]);

  // ──────────────────────────────
  // Render
  // ──────────────────────────────
  if (!isClient) return null;

  return (
    <Card className="w-full h-full max-w-xs xl:max-w-sm shadow-sm flex flex-col rounded-lg border-gray-200">
      {/* Header */}
      <CardHeader className="p-3 border-b border-gray-200 bg-gray-50/80 flex flex-row items-center justify-between gap-2 rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedClient ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToClients}
                className="h-7 w-7 p-0 hover:bg-gray-200 rounded-md flex-shrink-0"
              >
                <svg
                  className="h-4 w-4 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-800 truncate">
                  {selectedClient.name}
                </h3>
              </div>
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-800">Clients</h3>
            </>
          )}
        </div>

        {selectedClient && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  className="h-7 w-7 p-0 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Refresh folders</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-grow p-0 overflow-hidden">
        {/* Search Bar */}
        <div className="relative p-3 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />

            <Input
              type="text"
              placeholder={
                selectedClient
                  ? "Search folders..."
                  : "Search clients by name, code..."
              }
              value={localSearch}
              onChange={handleChange}
              className="w-full h-9 pl-9 pr-9 text-sm border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 rounded-md transition-colors duration-150"
            />

            {localSearch && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="h-5 w-5 p-0 hover:bg-transparent rounded"
                >
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden min-h-0">
          {!selectedClient ? (
            <div className="h-full overflow-y-auto">
              {filteredClients.length > 0 ? (
                <div className="py-1">
                  {filteredClients.map((client) => (
                    <ClientListItem
                      key={client.id}
                      client={client}
                      isSelected={false}
                      onClick={handleClientSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {searchQuery ? "No clients found" : "No clients available"}
                  </p>
                  <p className="text-xs text-gray-500 max-w-[200px]">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Clients will appear here when loaded"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-hidden">
              <TreeView />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}