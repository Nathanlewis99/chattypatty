// frontend/app/components/ConversationList.jsx
import React from "react";
import ConversationItem from "./ConversationItem";

export default function ConversationList({ conversations, activeId, onSelect, onDelete }) {
  return (
    <ul className="flex-1 overflow-y-auto">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conv={conv}
          isActive={conv.id === activeId}
          onSelect={() => onSelect(conv.id)}
          onDelete={() => onDelete(conv.id)}
        />
      ))}
      {conversations.length === 0 && (
        <li className="p-4 text-gray-400">No conversations yet.</li>
      )}
    </ul>
  );
}
