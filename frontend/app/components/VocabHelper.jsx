"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function VocabHelper({ native, target, onInsert }) {
  const [srcText, setSrcText] = useState("");
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!srcText.trim()) {
      setTranslated("");
      setErr("");
      return;
    }

    setLoading(true);
    setErr("");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.post("/languages/translate", {
          text: srcText,
          source: native,
          target: target,
        });
        setTranslated(data.translation || "");
      } catch (e) {
        console.error(e);
        setErr("Translate failed");
        setTranslated("");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [srcText, native, target]);

  const handleInsert = () => {
    if (!translated) return;
    onInsert?.(translated);
  };

  return (
    <div className="bg-gray-800 rounded p-3 space-y-2">
      <h3 className="text-sm font-semibold text-gray-300">Vocab Helper</h3>

      <input
        value={srcText}
        onChange={(e) => setSrcText(e.target.value)}
        placeholder={`Type a word/phrase in ${native?.toUpperCase?.() || "source"}…`}
        className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded outline-none focus:ring"
      />

      <textarea
        readOnly
        value={loading ? "…" : translated}
        placeholder={`Translation in ${target?.toUpperCase?.() || "target"}…`}
        className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded h-16 resize-none"
      />

      {err && <p className="text-xs text-red-400">{err}</p>}

      <button
        type="button"
        onClick={handleInsert}
        disabled={!translated}
        className={`w-full text-sm py-1 rounded transition ${
          translated
            ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            : "bg-blue-400 cursor-not-allowed"
        }`}
        title={translated ? "Insert into message box" : "Nothing to insert"}
      >
        Insert
      </button>
    </div>
  );
}
