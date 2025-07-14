// frontend/components/NewConversationBtn.jsx
"use client";

import { useState } from "react";
import { useConversations } from "../ConversationContext";
import LanguageSelector from "./LanguageSelector";

export default function NewConversationBtn() {
  const { createConversation } = useConversations();
  const [native, setNative] = useState("en");
  const [target, setTarget] = useState("es");

  const handleClick = () => {
    createConversation({ native, target });
  };

  return (
    <div className="new-conv-btn p-4 border-b">
      <div className="flex space-x-2 items-center">
        <LanguageSelector
          label="From"
          value={native}
          onChange={setNative}
          disabled={false}
        />
        <LanguageSelector
          label="To"
          value={target}
          onChange={setTarget}
          disabled={false}
        />
        <button
          onClick={handleClick}
          className="ml-auto bg-blue-600 text-white px-3 py-1 rounded"
        >
          + New
        </button>
      </div>
    </div>
  );
}
