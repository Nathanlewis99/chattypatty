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
    selectConversation,
    newConversation,
    deleteConversation,
    sendMessage,
  } = useConversations();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  return (
    <div className="relative flex h-full min-h-screen bg-gray-900">
      {/* Header */}
      <Header />

      {/* Sidebar with dark drop-shadow */}
      <aside className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white z-10
                        shadow-2xl shadow-black/60">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
          onDelete={deleteConversation}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col ml-64 mt-16">
        <div className="flex-1 overflow-y-auto p-6">
          <ChatWindow messages={messages} />
        </div>
        <div className="border-t border-gray-700 p-4 bg-gray-800">
          <ChatInput
            onSend={sendMessage}
            placeholder={`Type in ${targetLanguage}…`}
          />
        </div>
      </main>
    </div>
  );
}
