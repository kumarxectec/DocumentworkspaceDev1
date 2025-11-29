"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const mockData = [
  { id: 1, label: "data1" },
  { id: 2, label: "data2" },
  { id: 3, label: "data3" },
  { id: 4, label: "data4" },
  { id: 5, label: "data5" },
];

const AddSourceDropdown = () => {
  const [selectedItems, setSelectedItems] = useState([]);

  const handleSelectItem = (item) => {
    setSelectedItems((prevSelectedItems) => {
      if (
        prevSelectedItems.some((selectedItem) => selectedItem.id === item.id)
      ) {
        return prevSelectedItems.filter(
          (selectedItem) => selectedItem.id !== item.id
        );
      } else {
        return [...prevSelectedItems, item];
      }
    });
  };

  return (
    <div className="w-full flex justify-between items-center px-2 pt-2">
      <div className={"w-full flex justify-start items-center gap-2"}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={"w-full h-10 cursor-pointer text-slate-900 rounded-md hover:bg-indigo-900/80 hover:text-slate-50"}
            >
              select a pack
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={"w-full bg-background dark:bg-primary space-y-1 p-2"}
            align="start"
          >
            {mockData.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className={
                  "dark:text-muted-foreground min-w-[445px] h-10 font-light text-md text-muted-foreground hover:text-slate-50 dark:hover:text-indigo-50 hover:bg-indigo-900/80 border-gray-300"
                }
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AddSourceDropdown;
