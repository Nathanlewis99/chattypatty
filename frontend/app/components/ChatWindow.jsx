"use client";

import { useEffect, useRef } from 'react';

export default function ChatWindow({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto bg-gray-800 p-2 space-y-2 rounded text-white">
      {messages.map((m, i) => (
        <div
          key={i}
          className={m.from === "bot" ? "text-left" : "text-right"}
        >
          {m.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}