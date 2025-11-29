import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// folderUtils.js
export const updateFolderNameInTree = (nodes, id, newName) => {
  if (!Array.isArray(nodes)) return [];
  return nodes.map(node =>
    node.id === id
      ? { ...node, name: newName }
      : node.children
      ? { ...node, children: updateFolderNameInTree(node.children, id, newName) }
      : node
  );
};

export const removeFolderFromTree = (nodes, id) => {
  if (!Array.isArray(nodes)) return [];
  return nodes
    .filter(node => node.id !== id)
    .map(node =>
      node.children
        ? { ...node, children: removeFolderFromTree(node.children, id) }
        : node
    );
};

export function debounce(func, delay) {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

