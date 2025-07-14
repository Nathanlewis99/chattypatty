// frontend/app/page.jsx
"use client";
export const dynamic    = "force-dynamic";
export const fetchCache = "force-no-store";

import { useContext, useEffect } from "react";
import { useRouter }            from "next/navigation";

import { AuthContext }          from "./auth/AuthContext";
import { useConversations }     from "./ConversationContext";

import Sidebar          from "./components/Sidebar";
import LanguageSelector from "./components/LanguageSelector";
import ChatWindow       from "./components/ChatWindow";
import ChatInput        from "./components/ChatInput";

export default function Page() {
  const { token } = useContext(AuthContext);
  const router    = useRouter();

  // grab everything from our ConversationProvider
  const {
    conversations,
    activeId,
    nativeLanguage,
    targetLanguage,
    messages,
    languages,
    selectConversation,
    newConversation,
    deleteConversation,
    sendMessage,
    setNativeLanguage,
    setTargetLanguage,
  } = useConversations();

  // redirect if not authed
  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  return (
    <div className="flex h-full min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-700 bg-gray-800">
        <Sidebar />
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          {/* Language selectors */}
          <div className="flex justify-between mb-6">
            <div className="w-80">
              <LanguageSelector
                label="Native language"
                options={languages}
                value={nativeLanguage}
                onChange={setNativeLanguage}
                disabled={messages.length > 0}
              />
            </div>
            <div className="w-80">
              <LanguageSelector
                label="Practice language"
                options={languages}
                value={targetLanguage}
                onChange={setTargetLanguage}
                disabled={messages.length > 0}
              />
            </div>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto">
            <ChatWindow messages={messages} />
          </div>
        </div>

        {/* Input at bottom */}
        <div className="border-t p-4 bg-gray-900">
          <ChatInput
            onSend={sendMessage}
            placeholder={`Type in ${targetLanguage}…`}
          />
        </div>
      </main>
    </div>
  );
}
