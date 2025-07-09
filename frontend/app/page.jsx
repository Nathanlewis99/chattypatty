// frontend/app/page.jsx
"use client";

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

import { AuthContext } from './auth/AuthContext';
import LanguageSelector from './components/LanguageSelector';
import ChatWindow       from './components/ChatWindow';
import ChatInput        from './components/ChatInput';

export default function Page() {
  const { token } = useContext(AuthContext);
  const router    = useRouter();
  const BACKEND   = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [languages,  setLanguages]  = useState([]);
  const [nativeLang, setNativeLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [chat,        setChat]      = useState([]);

  // Redirect to /login if not authenticated
  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Fetch Google Translate language list once the user is authenticated
  useEffect(() => {
    if (!token) return;
    axios.get(`${BACKEND}/languages?target=en`)
      .then(({ data }) => {
        setLanguages(
          data.map(({ language, name }) => ({
            value: language,
            label: name
          }))
        );
      })
      .catch(err => console.error("Failed to fetch languages:", err));
  }, [BACKEND, token]);

  // Send a message and stream the assistant's reply
  const handleSend = async (text) => {
    // Append the user's message
    setChat(prev => [...prev, { from: 'user', text }]);
    // Append a placeholder for the streaming bot response
    setChat(prev => [...prev, { from: 'bot', text: '', streaming: true }]);

    try {
      const response = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          native_language:  nativeLang,
          target_language: targetLang
        }),
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.statusText}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let done      = false;

      // Read and append streaming chunks
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          setChat(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.from === 'bot' && last.streaming) {
              last.text += chunk;
            }
            return updated;
          });
        }
      }

      // Turn off the streaming flag
      setChat(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.from === 'bot' && last.streaming) {
          last.streaming = false;
        }
        return updated;
      });

    } catch (err) {
      console.error("Chat streaming error:", err);
      // Replace the streaming placeholder with an error message
      setChat(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.from === 'bot' && last.streaming) {
          last.text = "Sorry, something went wrong.";
          last.streaming = false;
        }
        return updated;
      });
    }
  };

  return (
    <>
      {/* Container */}
      <div className="flex flex-col min-h-screen max-w-3xl mx-auto px-6 pt-6 pb-32">
        
        {/* Language selectors */}
        <div className="flex justify-between mb-6">
          <div className="w-80">
            <LanguageSelector
              label="Native language"
              options={languages}
              value={nativeLang}
              onChange={setNativeLang}
            />
          </div>
          <div className="w-80">
            <LanguageSelector
              label="Practice language"
              options={languages}
              value={targetLang}
              onChange={setTargetLang}
            />
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1">
          <ChatWindow messages={chat} />
        </div>
      </div>

      {/* Fixed ChatInput at bottom */}
      <div className="fixed bottom-4 inset-x-0 flex justify-center">
        <div className="w-full max-w-3xl px-6">
          <ChatInput
            onSend={handleSend}
            placeholder={`Type in ${targetLang}…`}
          />
        </div>
      </div>
    </>
  );
}
