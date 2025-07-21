"use client";

export default function ScenarioPrompt({ value, onChange }) {
  return (
    <textarea
      className="w-full bg-gray-800 text-white p-2 rounded resize-none"
      rows={3}
      placeholder="Enter scenario prompt (optional)…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
