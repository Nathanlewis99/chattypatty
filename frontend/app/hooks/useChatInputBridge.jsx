"use client";

import { createContext, useContext, useState } from "react";

const ChatInputBridge = createContext(null);

/**
 * Provides a simple buffer to push text from anywhere (e.g. VocabHelper)
 * into ChatInput without prop drilling.
 */
export function ChatInputBridgeProvider({ children }) {
  const [buffer, setBuffer] = useState("");
  return (
    <ChatInputBridge.Provider value={{ buffer, setBuffer }}>
      {children}
    </ChatInputBridge.Provider>
  );
}

export function useChatInputBridge() {
  return useContext(ChatInputBridge);
}
