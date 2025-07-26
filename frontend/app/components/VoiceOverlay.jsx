// frontend/app/components/VoiceOverlay.jsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import axios from "axios";

export default function VoiceOverlay({
  open,
  onClose,
  ensureConversation,
  onNewAssistantTurn,
  nativeLanguage,
  targetLanguage,
  scenarioPrompt,
}) {
  const { token } = useContext(AuthContext);
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const recognitionRef = useRef(null);
  const convIdRef = useRef(null);
  const isProcessingRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles one utterance cycle:
   * 1) Abort recognition
   * 2) Ensure conversation
   * 3) Call voice-turn & update UI
   * 4) Call TTS & play
   * 5) Restart recognition
   */
  const processVoiceTurn = useCallback(
    async (text) => {
      const rec = recognitionRef.current;
      isProcessingRef.current = true;

      // 1) Abort recognition
      try { rec.abort(); } catch {}
      setListening(false);

      // 2) Ensure conversation
      let id = convIdRef.current;
      if (!id) {
        id = await ensureConversation();
        convIdRef.current = id;
      }
      if (!id) {
        console.error("No conversation ID");
        isProcessingRef.current = false;
        return;
      }

      // 3) Voice turn
      let assistantText = "";
      try {
        const { data: vt } = await axios.post(
          `${BACKEND}/voice-turn`,
          { text, native_language: nativeLanguage, target_language: targetLanguage, conversation_id: id, prompt: scenarioPrompt },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        assistantText = vt.assistant_text || vt.text || "";
      } catch (err) {
        console.error("voice-turn error", err);
        // Restart recognition
        if (open) { try { rec.start(); setListening(true); } catch {} }
        isProcessingRef.current = false;
        return;
      }

      // Update UI
      try {
        onNewAssistantTurn(assistantText, id);
      } catch (err) {
        console.error("onNewAssistantTurn error", err);
      }

      // 4) TTS playback
      try {
        const { data: ttsBytes } = await axios.post(
          `${BACKEND}/tts`,
          { text: assistantText },
          { headers: { Authorization: `Bearer ${token}` }, responseType: "arraybuffer" }
        );
        const blob = new Blob([ttsBytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          isProcessingRef.current = false;
          if (open) { try { rec.start(); setListening(true); } catch {} }
        };
        await audio.play();
      } catch (err) {
        console.error("tts error", err);
        isProcessingRef.current = false;
        if (open) { try { rec.start(); setListening(true); } catch {} }
      }
    },
    [BACKEND, ensureConversation, nativeLanguage, onNewAssistantTurn, scenarioPrompt, targetLanguage, token, open]
  );

  // Initialize speech recognition
  useEffect(() => {
    if (!open) return;
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      setError("Speech recognition not supported");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = targetLanguage === "es"
      ? "es-ES"
      : targetLanguage === "en"
      ? "en-US"
      : `${targetLanguage}-${targetLanguage.toUpperCase()}`;

    rec.onstart = () => setListening(true);
    rec.onerror = (e) => {
      if (e.error !== "aborted") {
        console.error("SpeechRecognition error", e);
        setError(e.error || "Recognition error");
      }
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
      // If not processing, restart automatically
      if (!isProcessingRef.current && open) {
        try { rec.start(); setListening(true); } catch {}
      }
    };
    rec.onresult = async (evt) => {
      const transcript = evt.results[evt.resultIndex][0].transcript.trim();
      if (transcript) await processVoiceTurn(transcript);
    };

    recognitionRef.current = rec;
    rec.start();

    return () => {
      rec.onstart = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onresult = null;
      rec.stop();
    };
  }, [open, targetLanguage, processVoiceTurn]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl">✕</button>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <div className="flex flex-col items-center">
        <div className={`p-4 rounded-full bg-gray-700 ${listening ? "animate-pulse" : ""}`}>          
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19.93V22h2v-2.07a8 8 0 0 0 6.938-6.938l-1.999-.264A6 6 0 0 1 6.06 15.06l-2 .265A8 8 0 0 0 11 19.93z" />
          </svg>
        </div>
        <p className="mt-4 text-lg text-gray-300">{listening ? "Listening…" : "Waiting…"}</p>
      </div>
    </div>
  );
}
