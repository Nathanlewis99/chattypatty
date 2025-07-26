// frontend/app/components/VoiceControls.jsx
"use client";

import { useRef, useState } from "react";
import { useConversations } from "../ConversationContext";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

export default function VoiceControls() {
  const { sendMessage } = useConversations();
  const { token } = useContext(AuthContext);

  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const start = async () => {
    if (recording) return;
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      setBusy(true);
      try {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const form = new FormData();
        form.append("file", blob, "audio.webm");

        const res = await fetch(`${BACKEND}/stt`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        });

        if (!res.ok) throw new Error("STT failed");
        const data = await res.json(); // { text: "..." }
        if (data.text) {
          await sendMessage(data.text);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    };

    mr.start();
    setRecording(true);
  };

  const stop = () => {
    if (!recording) return;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={busy}
        onClick={recording ? stop : start}
        className={`px-3 py-1 rounded text-white ${
          recording ? "bg-red-600" : "bg-green-600"
        } disabled:opacity-50`}
      >
        {recording ? "Stop" : "Speak"}
      </button>
      {busy && <span className="text-sm text-gray-400">Transcribing…</span>}
    </div>
  );
}
