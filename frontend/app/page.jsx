"use client";

import { useState } from 'react';
import axios from 'axios';

export default function Page() {
  const [text, setText] = useState('');
  const [chat, setChat] = useState([]);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const send = async () => {
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/chat`,
        { text },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setChat(prev => [...prev, { from: 'bot', text: data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="space-y-2 h-96 overflow-y-auto">
        {chat.map((m, i) => (
          <div key={i} className={m.from === 'bot' ? 'text-left' : 'text-right'}>
            {m.text}
          </div>
        ))}
      </div>
      <textarea
        rows={2}
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full border p-2"
      />
      <button onClick={send} className="mt-2 p-2 bg-blue-600 text-white rounded">
        Send
      </button>
    </div>
  );
}
