// frontend/app/components/ChatInput.jsx
"use client";

import { useState, useRef } from "react";
import { MicrophoneIcon } from "@heroicons/react/24/outline";

export default function ChatInput({
  onSend,
  onVoice,
  placeholder = "Type your message…",
}) {
  const [value, setValue] = useState("");
  const textareaRef      = useRef(null);

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
    <div className="flex items-center space-x-2">
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
          border border-gray-600
          p-2 rounded
          resize-none
          focus:outline-none focus:ring
        "
      />

      {/* existing mic button, to the right of the textarea */}
      <button
        onClick={onVoice}
        className="p-2 hover:bg-gray-700 rounded"
        aria-label="Speak"
      >
        <MicrophoneIcon className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={handleSend}
        className="p-2 bg-blue-600 text-white animated-gradient rounded hover:scale-105 transition cursor-pointer"
      >
        Send
      </button>
    </div>
  );
}
