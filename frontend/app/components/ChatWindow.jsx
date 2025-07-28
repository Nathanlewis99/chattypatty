// frontend/app/components/ChatWindow.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useConversations } from "../ConversationContext";

export default function ChatWindow({ messages }) {
  const bottomRef = useRef(null);
  const { nativeLanguage, targetLanguage } = useConversations();
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  // cache for full‑message translations:
  const [fullTranslations, setFullTranslations] = useState({});
  // which messages are showing translation:
  const [showTranslated, setShowTranslated]   = useState({});

  // cache for per‑word translations:
  const [wordCache, setWordCache] = useState({});

  // timers for hover delays
  const hoverTimersRef = useRef({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTranslated]);

  // fetch full translation of message idx
  const fetchFull = async (idx, text) => {
    if (fullTranslations[idx]) return;
    try {
      const res = await axios.post(
        `${BACKEND}/languages/translate`,
        {
          text,
          source: targetLanguage,
          target: nativeLanguage,
        }
      );
      setFullTranslations(ft => ({ ...ft, [idx]: res.data.translation }));
    } catch (err) {
      console.error("Full‐translate error:", err);
    }
  };

  // fetch a single word
  const fetchWord = async (word) => {
    if (wordCache[word]) return;
    try {
      const res = await axios.post(
        `${BACKEND}/languages/translate`,
        {
          text: word,
          source: targetLanguage,
          target: nativeLanguage,
        }
      );
      setWordCache(wc => ({ ...wc, [word]: res.data.translation }));
    } catch (err) {
      console.error("Word‐translate error:", err);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-800 p-4 space-y-3 rounded text-white flex flex-col">
      {messages.map((m, i) => {
        if (m.streaming) {
          return (
            <div key={i} className="flex justify-start">
              <div className="inline-block bg-gray-700 text-white px-4 py-2 rounded animate-pulse">
                Typing...
              </div>
            </div>
          );
        }

        const isUser = m.from === "user";
        const bubbleClasses = isUser
          ? "bg-blue-600 text-white"
          : "bg-gray-700 text-white";

        const displayText = (!isUser && showTranslated[i] && fullTranslations[i])
          ? fullTranslations[i]
          : m.text;

        return (
          <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] whitespace-pre-wrap break-words px-4 py-2 rounded ${bubbleClasses}`}>
              { !isUser
                ? displayText.split(" ").map((word, wi) => {
                    const timerId = `msg${i}-word${wi}`;
                    return (
                      <span
                        key={wi}
                        className="relative cursor-help"
                        title={wordCache[word] || ""}
                        onMouseEnter={() => {
                          // start 0.8s timer to fetch translation
                          hoverTimersRef.current[timerId] = setTimeout(
                            () => fetchWord(word),
                            450
                          );
                        }}
                        onMouseLeave={() => {
                          // cancel if you leave early
                          clearTimeout(hoverTimersRef.current[timerId]);
                          delete hoverTimersRef.current[timerId];
                        }}
                      >
                        {word}{" "}
                      </span>
                    );
                  })
                : displayText
              }
            </div>
            { !isUser && (
              <button
                onClick={async () => {
                  if (!fullTranslations[i]) {
                    await fetchFull(i, m.text);
                  }
                  setShowTranslated(st => ({ ...st, [i]: !st[i] }));
                }}
                className="ml-2 self-end text-xs text-gray-400 hover:text-gray-200"
              >
                {showTranslated[i] ? "Original" : "Translate"}
              </button>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
