"use client";

import React, { useState } from "react";
import LanguageSelector from "./LanguageSelector";
import ModeSwitch from "./ModeSwitch";
import ScenarioPrompt from "./ScenarioPrompt";
import SearchBar from "./SearchBar";
import { useConversations } from "../ConversationContext";
import ConversationList from "./ConversationList";

export default function Sidebar() {
  const {
    languages,
    nativeLanguage,
    targetLanguage,
    setNativeLanguage,
    setTargetLanguage,

    // scenario bits
    scenarioEnabled,
    setScenarioEnabled,
    scenarioPrompt,
    setScenarioPrompt,

    startConversation,
    conversations,
    activeId,
    selectConversation,
    deleteConversation,
    isCreating,
  } = useConversations();

  // local search state
  const [searchTerm, setSearchTerm] = useState("");

  // filter conversations by title
  const filtered = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white shadow-lg">
      <div className="p-4 space-y-4">
        {/* Language selectors */}
        <LanguageSelector
          label="Native Language"
          options={languages}
          value={nativeLanguage}
          onChange={setNativeLanguage}
        />
        <LanguageSelector
          label="Practice Language"
          options={languages}
          value={targetLanguage}
          onChange={setTargetLanguage}
        />

        {/* Mode switch component */}
        <ModeSwitch enabled={scenarioEnabled} onToggle={setScenarioEnabled} />

        {/* Conditional prompt component */}
        {scenarioEnabled && (
          <ScenarioPrompt value={scenarioPrompt} onChange={setScenarioPrompt} />
        )}

        {/* New Conversation button */}
        <button
          onClick={startConversation}
          disabled={isCreating}
          className={`w-full ${
            isCreating ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white py-2 rounded flex items-center justify-center`}
        >
          {isCreating ? "Loading…" : "+ New Conversation"}
        </button>
      </div>

      <hr className="border-gray-700" />

      {/* Search bar */}
      <div className="px-4 py-2">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="🔎 Search Conversations"
        />
      </div>

      <ConversationList
        conversations={filtered}
        activeId={activeId}
        onSelect={selectConversation}
        onDelete={deleteConversation}
      />
    </div>
  );
}
