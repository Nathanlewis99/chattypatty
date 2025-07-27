// frontend/app/chat/page.jsx
"use client";
export const dynamic    = "force-dynamic";
export const fetchCache = "force-no-store";

import { useContext, useEffect, useState } from "react";
import { useRouter }                        from "next/navigation";

import { AuthContext }      from "../auth/AuthContext";
import { useConversations } from "../ConversationContext";

import Header       from "../components/Header";
import Sidebar      from "../components/Sidebar";
import ChatWindow   from "../components/ChatWindow";
import ChatInput    from "../components/ChatInput";
import VoiceOverlay from "../components/VoiceOverlay";

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

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  // human‐readable target label
  const targetLabel =
    languages.find((l) => l.value === targetLanguage)?.label ||
    targetLanguage;

  /**
   * Make sure we have a conversation to send into—if none, create one;
   * if one already exists, re‑select it so ChatWindow/sidebar both load it.
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

    // 1) update ChatWindow if this is the active conversation
    if (convId === activeId) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: assistantText, streaming: false },
      ]);
    }

    // 2) persist in your raw conversations list
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

  /** NEW: called whenever the user speaks in VoiceOverlay */
  const handleUserSpeak = (userText, convId) => {
    const now = new Date().toISOString();

    // 1) update ChatWindow if this is the active conversation
    if (convId === activeId) {
      setMessages((m) => [
        ...m,
        { from: "user", text: userText, streaming: false },
      ]);
    }

    // 2) persist in your raw conversations list
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

  return (
    <div className="relative h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} />

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

      {/* Sidebar handle */}
      <button
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        onClick={() => setSidebarOpen((s) => !s)}
        className={`
          hidden md:flex fixed top-1/2 -translate-y-1/2 z-50
          h-12 w-4 items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-r
          transition-colors duration-150
          ${sidebarOpen ? "left-64" : "left-0"}
        `}
      >
        {sidebarOpen ? "«" : "»"}
      </button>

      {/* Main content */}
      <main
        className={`
          absolute top-0 right-0 bottom-0 pt-24 flex flex-col transition-all duration-200 ease-in-out overflow-hidden
          ${sidebarOpen ? "md:left-64 left-0" : "md:left-0 left-0"} bg-gray-900 z-10
        `}
      >
        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-6">
          <ChatWindow messages={messages} />
        </div>

        {/* Text input (hidden when voice overlay is up) */}
        {!voiceOpen && (
          <div className="border-t border-gray-700 p-4 bg-gray-800 flex items-center">
            <div className="flex-1">
              <ChatInput
                onSend={sendMessage}
                onVoice={() => setVoiceOpen(true)}
                placeholder={`Type in ${targetLabel}…`}
              />
            </div>
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
