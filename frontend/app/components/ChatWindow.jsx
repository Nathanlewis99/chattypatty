"use client";

import { useEffect, useRef } from 'react';

export default function ChatWindow({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto bg-gray-800 p-4 space-y-3 rounded text-white flex flex-col">
      {messages.map((m, i) => {
        // Typing indicator
        if (m.streaming) {
          return (
            <div key={i} className="flex justify-start">
              <div className="inline-block bg-gray-700 text-white px-4 py-2 rounded animate-pulse">
                Typing...
              </div>
            </div>
          );
        }

        const isUser = m.from === 'user';
        return (
          <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`
                max-w-[75%]
                whitespace-pre-wrap
                break-words
                px-4 py-2
                rounded
                ${isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white'
                }
              `}
            >
              {m.text}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
