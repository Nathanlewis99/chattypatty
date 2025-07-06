"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

import LanguageSelector from './components/LanguageSelector';
import ChatWindow       from './components/ChatWindow';
import ChatInput        from './components/ChatInput';

export default function Page() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [languages,  setLanguages]  = useState([]);
  const [nativeLang, setNativeLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [chat,        setChat]       = useState([]);

  // Fetch language list…
  useEffect(() => {
    axios.get(`${BACKEND}/languages?target=en`)
      .then(({ data }) => {
        setLanguages(data.map(({ language, name }) => ({
          value: language,
          label: name
        })));
      })
      .catch(console.error);
  }, [BACKEND]);

  // Send & append messages…
  const handleSend = async text => {
    setChat(prev => [...prev, { from: 'user', text }]);
    try {
      const { data } = await axios.post(
        `${BACKEND}/chat`,
        { text, native_language: nativeLang, target_language: targetLang },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setChat(prev => [...prev, { from: 'bot', text: data.reply }]);
    } catch {
      setChat(prev => [...prev, { from: 'bot', text: "Sorry, something went wrong." }]);
    }
  };

  return (
    <>
      {/* Full‐height flex container */}
      <div className="flex flex-col min-h-screen max-w-3xl mx-auto px-6 pt-6 pb-32">
        
        {/* Selectors row */}
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

        {/* Chat window – flex‐1 to grow */}
        <div className="flex-1">
          <ChatWindow messages={chat} />
        </div>
      </div>

      {/* Fixed input */}
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