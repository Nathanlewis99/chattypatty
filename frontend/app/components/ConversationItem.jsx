import React from "react";

export default function ConversationItem({
  conv,
  isActive,
  onSelect,
  onDelete,
}) {
  return (
    <li
      onClick={onSelect}
      className={`flex items-center justify-between px-4 py-2 cursor-pointer
        ${isActive ? "bg-gray-700" : "hover:bg-gray-800"} 
      `}
    >
      <span className="truncate">{conv.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-gray-400 hover:text-red-500"
        title="Delete"
      >
        ×
      </button>
    </li>
  );
}
