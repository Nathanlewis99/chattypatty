"use client";

export default function VoiceSettings({ rate, setRate }) {
  return (
    <div className="flex items-center space-x-2 text-white text-sm">
      <label htmlFor="rate">Speech speed</label>
      <input
        id="rate"
        type="range"
        min="0.6"
        max="1.4"
        step="0.1"
        value={rate}
        onChange={(e) => setRate(parseFloat(e.target.value))}
      />
      <span>{rate.toFixed(1)}x</span>
    </div>
  );
}
