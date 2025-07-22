"use client";

import { useState, useRef, useEffect } from "react";
import { useChatInputBridge } from "../hooks/useChatInputBridge";

export default function ChatInput({ onSend, placeholder = "Type your message…" }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  // pull injected text from the vocab helper
  const { buffer, setBuffer } = useChatInputBridge();

  // when buffer changes, append and clear it
  useEffect(() => {
    if (buffer) {
      setValue((v) => (v ? v + " " + buffer : buffer));
      setBuffer("");
      textareaRef.current?.focus();
    }
  }, [buffer, setBuffer]);

  const handleSend = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-start space-x-2">
      <textarea
        ref={textareaRef}
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          flex-1
          bg-gray-800
          text-white
          border
          border-gray-600
          p-2
          rounded
          resize-none
          focus:outline-none
          focus:ring
        "
      />
      <button
        onClick={handleSend}
        type="button"
        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Send
      </button>
    </div>
  );
}
