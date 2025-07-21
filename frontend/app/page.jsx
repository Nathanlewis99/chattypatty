// frontend/app/page.jsx
"use client";
export const dynamic    = "force-dynamic";
export const fetchCache = "force-no-store";

import { useContext, useEffect } from "react";
import { useRouter }             from "next/navigation";

import { AuthContext }      from "./auth/AuthContext";
import { useConversations } from "./ConversationContext";

import Header     from "./components/Header";
import Sidebar    from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInput  from "./components/ChatInput";

export default function Page() {
  const { token } = useContext(AuthContext);
  const router    = useRouter();

  const {
    conversations,
    activeId,
    messages,
    targetLanguage,
    languages,
    selectConversation,
    newConversation,
    deleteConversation,
    sendMessage,
  } = useConversations();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  const targetLabel =
    languages.find((l) => l.value === targetLanguage)?.label ||
    targetLanguage;

  return (
    <div className="relative flex h-screen bg-gray-900">
      {/* fixed header */}
      <Header />

      {/* fixed sidebar */}
      <aside
        className="
          fixed top-0 left-0 w-64 h-full
          bg-gray-800 text-white z-10
          shadow-2xl shadow-black/60
        "
      >
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
          onDelete={deleteConversation}
        />
      </aside>

      {/* main content sits to the right of sidebar, below header */}
      <main
        className="
          flex-1 flex flex-col
          ml-64           /* leave room for sidebar */
          mt-24           /* leave room for header (h-24) */
          overflow-hidden /* prevent main from pushing past viewport */
        "
      >
        {/* only this div scrolls */}
        <div className="flex-1 overflow-y-auto p-6">
          <ChatWindow messages={messages} />
        </div>

        {/* input bar always sticks to bottom */}
        <div className="border-t border-gray-700 p-4 bg-gray-800">
          <ChatInput
            onSend={sendMessage}
            placeholder={`Type in ${targetLabel}…`}
          />
        </div>
      </main>
    </div>
  );
}
