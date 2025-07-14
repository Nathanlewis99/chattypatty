// frontend/app/ConversationContext.jsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import axios from "axios";
import { AuthContext } from "./auth/AuthContext";

const ConversationContext = createContext({
  conversations: [],
  activeId: null,
  nativeLanguage: "en",
  targetLanguage: "es",
  messages: [],
  languages: [],
  selectConversation: () => {},
  newConversation: () => {},
  deleteConversation: () => {},
  sendMessage: () => {},
  setNativeLanguage: () => {},
  setTargetLanguage: () => {},
});

export function ConversationProvider({ children }) {
  const { token } = useContext(AuthContext);
  const BACKEND   = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [conversations,  setConversations ]  = useState([]);
  const [activeId,       setActiveId]        = useState(null);
  const [nativeLanguage, setNativeLanguage]  = useState("en");
  const [targetLanguage, setTargetLanguage]  = useState("es");
  const [messages,       setMessages]        = useState([]);
  const [languages,      setLanguages]       = useState([]);

  // load conversation list
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKEND}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => setConversations(data))
      .catch(console.error);
  }, [token, BACKEND]);

  // load languages once
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKEND}/languages?target=en`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) =>
        setLanguages(data.map(({ language, name }) => ({
          value: language,
          label: name,
        })))
      )
      .catch(console.error);
  }, [token, BACKEND]);

  const selectConversation = (id) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    setActiveId(id);
    setNativeLanguage(conv.source_language);
    setTargetLanguage(conv.target_language);
    setMessages(conv.messages || []);
  };

  const newConversation = () => {
    setActiveId(null);
    setNativeLanguage("en");
    setTargetLanguage("es");
    setMessages([]);
  };

  const deleteConversation = async (id) => {
    try {
      await axios.delete(`${BACKEND}/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) newConversation();
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (text) => {
    let convId = activeId;

    // if this is the first message in a new convo, create it
    if (!convId) {
      const { data: newConv } = await axios.post(
        `${BACKEND}/conversations`,
        {
          source_language: nativeLanguage,
          target_language: targetLanguage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      convId = newConv.id;
      setActiveId(convId);
      // put the newly created conversation at the top of the list
      setConversations((prev) => [newConv, ...prev]);
    }

    // locally update the chat window
    setMessages((prev) => [...prev, { from: "user", text }]);
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "", streaming: true },
    ]);

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
            if (last.from === "bot" && last.streaming) last.text += chunk;
            return [...prev.slice(0, -1), last];
          });
        }
      }

      // end streaming
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.from === "bot" && last.streaming) last.streaming = false;
        return [...prev.slice(0, -1), last];
      });
    } catch (err) {
      console.error(err);
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
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  return useContext(ConversationContext);
}
