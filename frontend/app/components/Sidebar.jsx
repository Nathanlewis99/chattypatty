"use client";

import React, { useState } from "react";
import LanguageSelector from "./LanguageSelector";
import ModeSwitch from "./ModeSwitch";
import ScenarioPrompt from "./ScenarioPrompt";
import SearchBar from "./SearchBar";
import ConversationList from "./ConversationList";
import VocabHelper from "./VocabHelper";
import { useConversations } from "../ConversationContext";
import { useChatInputBridge } from "../hooks/useChatInputBridge";

export default function Sidebar() {
  const {
    languages,
    nativeLanguage,
    targetLanguage,
    setNativeLanguage,
    setTargetLanguage,

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

  const { setBuffer } = useChatInputBridge(); // to push vocab → chat input

  const [searchTerm, setSearchTerm] = useState("");

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

        {/* Mode switch */}
        <ModeSwitch enabled={scenarioEnabled} onToggle={setScenarioEnabled} />

        {/* Scenario prompt */}
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

        {/* Vocab Helper */}
        <VocabHelper
          native={nativeLanguage}
          target={targetLanguage}
          onInsert={(txt) => setBuffer(txt)}
        />
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

      {/* Conversation list */}
      <ConversationList
        conversations={filtered}
        activeId={activeId}
        onSelect={selectConversation}
        onDelete={deleteConversation}
      />
    </div>
  );
}
