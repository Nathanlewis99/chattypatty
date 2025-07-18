// frontend/app/ConversationContext.jsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import axios from "axios";
import { AuthContext } from "./auth/AuthContext";

const ConversationContext = createContext(null);

export function ConversationProvider({ children }) {
  const { token } = useContext(AuthContext);
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  // — raw data from the API —
  const [conversationsRaw, setConversationsRaw] = useState([]);
  const [languages, setLanguages] = useState([]);

  // — “current” state —
  const [activeId, setActiveId] = useState(null);
  const [nativeLanguage, setNativeLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [messages, setMessages] = useState([]);

  // 1️⃣ Load saved conversations list
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKEND}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setConversationsRaw(data))
      .catch(console.error);
  }, [token]);

  // 2️⃣ Load Google‐Translate languages once
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKEND}/languages?target=en`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) =>
        setLanguages(
          data.map(({ language, name }) => ({
            value: language,
            label: name,
          }))
        )
      )
      .catch(console.error);
  }, [token]);

  // 3️⃣ Add a nice “title” to each conversation
  const conversations = useMemo(() => {
    return conversationsRaw.map((conv) => {
      const lang = languages.find((l) => l.value === conv.target_language);
      return {
        ...conv,
        title: `${lang?.label || conv.target_language} Conversation`,
      };
    });
  }, [conversationsRaw, languages]);

  // 4️⃣ Select + load a conversation by its ID
  const selectConversation = async (id) => {
    try {
      const { data: conv } = await axios.get(
        `${BACKEND}/conversations/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setActiveId(conv.id);
      setNativeLanguage(conv.source_language);
      setTargetLanguage(conv.target_language);

      // ← **map** each API message into { from, text }
      const mapped = (conv.messages || []).map((m) => ({
        from: m.sender,    // "user" or "assistant"
        text: m.content,   // the actual text
        streaming: false,  // already-complete messages
      }));
      setMessages(mapped);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  // 5️⃣ Create (and immediately select) a brand-new conversation
  const createConversation = async ({ native, target }) => {
    try {
      const { data: conv } = await axios.post(
        `${BACKEND}/conversations`,
        {
          source_language: native,
          target_language: target,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // add into the raw list...
      setConversationsRaw((prev) => [...prev, conv]);

      // select it and clear out old messages
      setActiveId(conv.id);
      setNativeLanguage(conv.source_language);
      setTargetLanguage(conv.target_language);
      setMessages([]);
    } catch (err) {
      console.error("Failed to start new conversation:", err);
    }
  };

  // 6️⃣ Alias for your “New Conversation” button (uses current dropdowns)
  const startConversation = async () => {
    await createConversation({
      native: nativeLanguage,
      target: targetLanguage,
    });
  };

  // 7️⃣ Delete a conversation
  const deleteConversation = async (id) => {
    try {
      await axios.delete(`${BACKEND}/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationsRaw((prev) => prev.filter((c) => c.id !== id));

      if (activeId === id) {
        // reset to defaults
        setActiveId(null);
        setNativeLanguage("en");
        setTargetLanguage("es");
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 8️⃣ Send / stream a message (auto-creates conv on first send)
  const sendMessage = async (text) => {
    if (!activeId) {
      await startConversation();
    }

    // push user + placeholder
    setMessages((m) => [...m, { from: "user", text }]);
    setMessages((m) => [...m, { from: "bot", text: "", streaming: true }]);

    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          native_language: nativeLanguage,
          target_language: targetLanguage,
          conversation_id: activeId,
        }),
      });
      if (!res.ok) throw new Error(res.statusText);

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let done     = false;

      while (!done) {
        const { value, done: dr } = await reader.read();
        done = dr;
        if (value) {
          const chunk = dec.decode(value);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last.from === "bot" && last.streaming) {
              last.text += chunk;
            }
            return [...prev.slice(0, -1), last];
          });
        }
      }

      // finish streaming
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.from === "bot" && last.streaming) {
          last.streaming = false;
        }
        return [...prev.slice(0, -1), last];
      });
    } catch (err) {
      console.error(err);
      // show an error bubble
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.from === "bot" && last.streaming) {
          last.text = "Sorry, something went wrong.";
          last.streaming = false;
        }
        return [...prev.slice(0, -1), last];
      });
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        // Data
        conversations,
        activeId,
        nativeLanguage,
        targetLanguage,
        messages,
        languages,
        // Actions
        selectConversation,
        createConversation,
        startConversation,
        deleteConversation,
        sendMessage,
        setNativeLanguage,
        setTargetLanguage,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  return useContext(ConversationContext);
}
