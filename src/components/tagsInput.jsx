"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import useStore from "@/store/useStore";
import { toast } from "sonner"; // ✅ using sonner toast library

export default function TagInput({
  placeholder = "Enter document IDs...",
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const { tags, setTags, collectionTags, setCollectionTags } = useStore();

  // ✅ Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const showDuplicateToast = (duplicateIds) => {
    toast.warning(
      `Duplicate ID${duplicateIds.length > 1 ? "s" : ""} omitted: ${duplicateIds.join(", ")}`
    );
  };

  const addTag = (tag) => {
    const trimmed = tag.trim();
    const allExisting = [...tags, ...collectionTags];

    if (!trimmed) return;

    if (allExisting.includes(trimmed)) {
      showDuplicateToast([trimmed]);
      return;
    }

    const updatedTags = [...tags, trimmed];
    setTags(updatedTags);
  };

  const cleanInput = (input) => {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map(String).join(",");
      }
    } catch (e) {}

    return input
      .replace(/^["'\[{]+|["'\]}]+$/g, "")
      .replace(/["'\]]/g, "")
      .replace(/\s*,\s*/g, ",")
      .replace(/\n/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  };

  const addMultipleTags = (tagString) => {
    const cleanedInput = cleanInput(tagString);
    const allExisting = [...tags, ...collectionTags];

    const newTags = cleanedInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag && !allExisting.includes(tag));

    const duplicateIds = cleanedInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag && allExisting.includes(tag));

    if (duplicateIds.length > 0) {
      showDuplicateToast(duplicateIds);
    }

    if (newTags.length) {
      const updatedTags = [...tags, ...newTags];
      setTags(updatedTags);
    }
  };

  const removeTag = (index, source) => {
    if (source === "input") {
      const updated = tags.filter((_, i) => i !== index);
      setTags(updated);
    } else if (source === "collection") {
      const updated = collectionTags.filter((_, i) => i !== index);
      setCollectionTags(updated);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (/[,"'\[\]]/.test(inputValue)) {
        addMultipleTags(inputValue);
      } else {
        addTag(inputValue);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && inputValue === "" && tags.length) {
      removeTag(tags.length - 1, "input");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^\d,]/g, ""); // only digits & commas
    addMultipleTags(pasteData);
    setInputValue("");
  };

  // ⛔ Prevent alphabets in input
  const handleChange = (e) => {
    const value = e.target.value.replace(/[^\d,]/g, ""); // allow only numbers & commas
    setInputValue(value);
  };

  const allTags = [...collectionTags, ...tags];
  const hasNoTags = allTags.length === 0;

  return (
    <div className="relative h-full">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-3 h-full max-h-[390px] overflow-y-auto hover:border-gray-300 transition-colors focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex flex-wrap gap-2">
          {collectionTags.map((tag, index) => (
            <div
              key={`collection-${index}`}
              className="group flex items-center gap-1.5 bg-gradient-to-r from-blue-50 shadow-xs to-blue-100/50 text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg text-xs font-medium hover:border-blue-300 transition-all"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(index, "collection")}
                className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {tags.map((tag, index) => (
            <div
              key={`input-${index}`}
              className="group flex items-center gap-1.5 bg-gray-100 shadow-xs text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium hover:border-gray-300 transition-all"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(index, "input")}
                className="ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={hasNoTags ? placeholder : ""}
            className="flex-1 min-w-[200px] px-2 py-1.5 text-sm focus:outline-none placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
