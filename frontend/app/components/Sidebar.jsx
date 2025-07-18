// frontend/app/components/Sidebar.jsx
"use client";

import React from "react";
import LanguageSelector from "./LanguageSelector";
import { useConversations } from "../ConversationContext";
import ConversationList from "./ConversationList";

export default function Sidebar() {
  const {
    languages,
    nativeLanguage,
    targetLanguage,
    setNativeLanguage,
    setTargetLanguage,
    startConversation,
    conversations,
    activeId,
    selectConversation,
    deleteConversation,
  } = useConversations();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white z-10">
      <div className="p-4 space-y-4">
        <LanguageSelector
          label="Native Language"
          options={languages}
          value={nativeLanguage}
          onChange={setNativeLanguage}
        />
        <LanguageSelector
          label="Learning Language"
          options={languages}
          value={targetLanguage}
          onChange={setTargetLanguage}
        />
        <button
          onClick={startConversation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          + New Conversation
        </button>
      </div>
      <hr className="border-gray-700" />
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onDelete={deleteConversation}
      />
    </div>
  );
}
