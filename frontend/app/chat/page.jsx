// frontend/app/chat/page.jsx
"use client";
export const dynamic    = "force-dynamic";
export const fetchCache = "force-no-store";

import { useContext, useEffect, useState } from "react";
import { useRouter }                        from "next/navigation";
import { QuestionMarkCircleIcon }           from "@heroicons/react/24/solid";

import { AuthContext }      from "../auth/AuthContext";
import { useConversations } from "../ConversationContext";

import Header         from "../components/Header";
import Sidebar        from "../components/Sidebar";
import SidebarHandle  from "../components/SidebarHandle";
import ChatWindow     from "../components/ChatWindow";
import ChatInput      from "../components/ChatInput";
import VocabHelper    from "../components/VocabHelper";
import VoiceOverlay   from "../components/VoiceOverlay";

export default function ChatPage() {
  const { token } = useContext(AuthContext);
  const router    = useRouter();

  const {
    conversations,
    activeId,
    messages,
    targetLanguage,
    nativeLanguage,
    languages,
    selectConversation,
    startConversation,
    deleteConversation,
    sendMessage,
    setMessages,
    setConversationsRaw,
    scenarioEnabled,
    scenarioPrompt,
  } = useConversations();

  // sidebar open/close
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // voice overlay open/close
  const [voiceOpen, setVoiceOpen]     = useState(false);
  // vocab helper toggle
  const [showVocab, setShowVocab]     = useState(false);
  // controlled input value
  const [inputValue, setInputValue]   = useState("");

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  // human‑readable target label
  const targetLabel =
    languages.find((l) => l.value === targetLanguage)?.label ||
    targetLanguage;

  /**
   * Ensure there's a conversation before sending voice or text.
   * Creates/selects as needed.
   */
  const ensureConversation = async () => {
    if (!activeId) {
      const newId = await startConversation();
      return newId;
    } else {
      await selectConversation(activeId);
      return activeId;
    }
  };

  /** Called when the assistant replies */
  const handleAssistantTurn = (assistantText, convId) => {
    const now = new Date().toISOString();

    if (convId === activeId) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: assistantText, streaming: false },
      ]);
    }

    setConversationsRaw((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [
                ...(c.messages || []),
                { sender: "assistant", content: assistantText, created_at: now },
              ],
            }
          : c
      )
    );
  };

  /** Called whenever the user speaks in VoiceOverlay */
  const handleUserSpeak = (userText, convId) => {
    const now = new Date().toISOString();

    if (convId === activeId) {
      setMessages((m) => [
        ...m,
        { from: "user", text: userText, streaming: false },
      ]);
    }

    setConversationsRaw((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [
                ...(c.messages || []),
                { sender: "user", content: userText, created_at: now },
              ],
            }
          : c
      )
    );
  };

  /** Send text from ChatInput */
  const handleSendText = (text) => {
    sendMessage(text);
    setInputValue("");
  };

  return (
    <div className="relative h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} />

      {/* Sidebar toggle handle */}
      <SidebarHandle
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((s) => !s)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-800 shadow-2xl z-40
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={startConversation}
          onDelete={deleteConversation}
        />
      </aside>

      {/* Main content */}
      <main
        className={`
          absolute top-0 right-0 bottom-0 pt-24 flex flex-col transition-all duration-200 ease-in-out overflow-hidden
          ${sidebarOpen ? "md:left-64 left-0" : "left-0"} bg-gray-900 z-10
        `}
      >
        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-6">
          <ChatWindow messages={messages} />
        </div>

        {/* Input area (hidden when voice overlay is up) */}
        {!voiceOpen && (
          <div className="border-t border-gray-700 bg-gray-800 p-4 space-y-2">
            {/* Vocab toggle */}
            <button
              onClick={() => setShowVocab((v) => !v)}
              className="flex items-center space-x-1 text-sm text-gray-200 hover:text-gray-100 underline cursor-pointer"
            >
              <span>Vocab Assistant</span>
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                <QuestionMarkCircleIcon className="w-4 h-4" />
              </span>
            </button>

            {/* Helper panel */}
            {showVocab && (
              <div className="mb-2">
                <VocabHelper
                  native={nativeLanguage}
                  target={targetLanguage}
                  onInsert={(word) =>
                    setInputValue((prev) =>
                      prev ? `${prev} ${word}` : word
                    )
                  }
                />
              </div>
            )}

            {/* ChatInput */}
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendText}
              onVoice={() => setVoiceOpen(true)}
              placeholder={`Type in ${targetLabel}…`}
            />
          </div>
        )}
      </main>

      {/* Voice overlay */}
      <VoiceOverlay
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        nativeLanguage={nativeLanguage}
        targetLanguage={targetLanguage}
        ensureConversation={ensureConversation}
        onUserSpeak={handleUserSpeak}
        onNewAssistantTurn={handleAssistantTurn}
        scenarioPrompt={
          scenarioEnabled && scenarioPrompt.trim() ? scenarioPrompt.trim() : null
        }
      />
    </div>
  );
}
