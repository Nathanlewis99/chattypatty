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

  // — raw data + language options
  const [conversationsRaw, setConversationsRaw] = useState([]);
  const [languages, setLanguages]               = useState([]);

  // — UI state
  const [activeId, setActiveId]   = useState(null);
  const [nativeLanguage, setNativeLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [messages, setMessages]             = useState([]);

  // — scenario state
  const [scenarioEnabled, setScenarioEnabled] = useState(false);
  const [scenarioPrompt, setScenarioPrompt]   = useState("");

  // — loading indicator for “New Conversation”
  const [isCreating, setIsCreating] = useState(false);

  // normalize API messages → { from, text, streaming }
  const normalize = (msgs) =>
    msgs.map((m) => ({
      from: m.sender === "assistant" || m.sender === "bot" ? "bot" : "user",
      text: m.content,
      streaming: false,
    }));

  // 1️⃣ fetch saved conversations
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKEND}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setConversationsRaw(data))
      .catch(console.error);
  }, [token]);

  // 2️⃣ fetch Google‐Translate language list
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKEND}/languages?target=en`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) =>
        setLanguages(
          data.map(({ language, name }) => ({ value: language, label: name }))
        )
      )
      .catch(console.error);
  }, [token]);

  // 3️⃣ decorate with title + sort by last activity
  const conversations = useMemo(() => {
    const withActivity = conversationsRaw.map((conv) => {
      const lastMsgTs =
        conv.messages && conv.messages.length
          ? Math.max(
              ...conv.messages.map((m) => new Date(m.created_at).getTime())
            )
          : new Date(conv.created_at).getTime();

      const lang = languages.find((l) => l.value === conv.target_language);
      const title = conv.prompt
        ? conv.prompt
        : `${lang?.label || conv.target_language} Conversation`;

      return { ...conv, title, lastActivity: lastMsgTs };
    });

    withActivity.sort((a, b) => b.lastActivity - a.lastActivity);
    return withActivity.map(({ lastActivity, ...keep }) => keep);
  }, [conversationsRaw, languages]);

  // 4️⃣ load one conversation’s messages
  const selectConversation = async (id) => {
    try {
      const { data: conv } = await axios.get(
        `${BACKEND}/conversations/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveId(conv.id);
      setNativeLanguage(conv.source_language);
      setTargetLanguage(conv.target_language);
      setMessages(normalize(conv.messages || []));
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  // 5️⃣ create + select a new conversation (now returns the new ID)
  const startConversation = async () => {
    setIsCreating(true);
    try {
      const payload = {
        source_language: nativeLanguage,
        target_language: targetLanguage,
      };
      if (scenarioEnabled && scenarioPrompt.trim()) {
        payload.prompt = scenarioPrompt.trim();
      }

      const { data: conv } = await axios.post(
        `${BACKEND}/conversations`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConversationsRaw((prev) => [conv, ...prev]);
      await selectConversation(conv.id);
      return conv.id;
    } catch (err) {
      console.error("Failed to start new conversation:", err);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // 6️⃣ delete a conversation
  const deleteConversation = async (id) => {
    try {
      await axios.delete(`${BACKEND}/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversationsRaw((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setNativeLanguage("en");
        setTargetLanguage("es");
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7️⃣ send/stream a chat message
  const sendMessage = async (text) => {
    // ensure there's a conversation before sending
    let convId = activeId;
    if (!convId) {
      convId = await startConversation();
      if (!convId) return;
    }

    const now = new Date().toISOString();

    // locally append user
    setMessages((m) => [...m, { from: "user", text }]);
    setConversationsRaw((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [
                ...(c.messages || []),
                { sender: "user", content: text, created_at: now },
              ],
            }
          : c
      )
    );

    // placeholder bot bubble
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
          conversation_id: convId,
          prompt:
            scenarioEnabled && scenarioPrompt.trim()
              ? scenarioPrompt.trim()
              : undefined,
        }),
      });
      if (!res.ok) throw new Error(res.statusText);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let assistantReply = "";
      let done = false;

      while (!done) {
        const { value, done: dr } = await reader.read();
        done = dr;
        if (value) {
          const chunk = dec.decode(value);
          assistantReply += chunk;
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

      // append assistant to raw
      const botTimestamp = new Date().toISOString();
      setConversationsRaw((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [
                  ...(c.messages || []),
                  {
                    sender: "assistant",
                    content: assistantReply.trim(),
                    created_at: botTimestamp,
                  },
                ],
              }
            : c
        )
      );
    } catch (err) {
      console.error(err);
      // error bubble
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
        // data
        conversations,
        activeId,
        nativeLanguage,
        targetLanguage,
        messages,
        languages,
        scenarioEnabled,
        scenarioPrompt,
        isCreating,
        // setters
        setNativeLanguage,
        setTargetLanguage,
        setScenarioEnabled,
        setScenarioPrompt,
        // actions
        selectConversation,
        startConversation,
        deleteConversation,
        sendMessage,
        // raw setter for voice flows
        setConversationsRaw,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  return useContext(ConversationContext);
}
