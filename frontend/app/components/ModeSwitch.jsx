"use client";

export default function ModeSwitch({ enabled, onToggle }) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm">Mode:</span>
      <select
        className="bg-gray-800 text-white text-sm p-1 rounded"
        value={enabled ? "scenario" : "open"}
        onChange={(e) => onToggle(e.target.value === "scenario")}
      >
        <option value="open">Open Conversation</option>
        <option value="scenario">Specific Scenario</option>
      </select>
    </div>
  );
}
