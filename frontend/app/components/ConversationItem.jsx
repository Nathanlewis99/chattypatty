// frontend/app/components/ConversationItem.jsx
import React from "react";
import { useConversations } from "../ConversationContext";

export default function ConversationItem({ conv, isActive, onSelect, onDelete }) {
  const { languages } = useConversations();
  // find human‐readable target language name
  const langName =
    languages.find((l) => l.value === conv.target_language)?.label ||
    conv.target_language;

  return (
    <li
      onClick={onSelect}
      className={`flex items-center justify-between px-4 py-2 cursor-pointer
        ${isActive ? "bg-gray-700" : "hover:bg-gray-800"} 
      `}
    >
      <span className="truncate">
        {langName} Conversation
      </span>
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
