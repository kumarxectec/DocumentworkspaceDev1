import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const EditableFolderName = ({ name, onSave, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const inputRef = useRef(null);

  // Handle F2 key press to start editing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        setIsEditing(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setEditedName(name);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editedName.trim() !== name) {
      onSave(editedName.trim());
    } else {
      setEditedName(name); // Reset if unchanged
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditedName(name);
      setIsEditing(false);
    }
  };

  return isEditing ? (
    <div className="flex items-center gap-2">
      <Input
  ref={inputRef}
  type="text"
  value={editedName}
  onChange={(e) => setEditedName(e.target.value)}
  onBlur={handleBlur}
  onKeyDown={handleKeyPress}
  className="text-gray-800 px-2 py-1 h-7 text-sm rounded-md border-b  bg-white selection:bg-blue-100 selection:text-gray-900"
  style={{
    minWidth: "180px", // Ensures comfortable typing space
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)" // subtle shadow
  }}
/>

      {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
    </div>
  ) : (
    <div className="flex items-center group">
      <p
        className="text-base font-semibold text-gray-800 leading-tight select-none"
        onDoubleClick={startEditing}
      >
        {name}
      </p>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={startEditing}
            className="cursor-pointer transition-opacity hover:bg-gray-100 rounded-lg"
            variant={"icon"}
            size={"sm"}
          >
            <Pencil className="w-3 h-3 text-gray-500 hover:text-blue-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          Rename folder
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default EditableFolderName;
