"use client";

export default function MicButton({ onToggle }) {
  return (
    <button
      onClick={() => onToggle(true)}
      aria-label="Start voice conversation"
      className="
        fixed bottom-24 right-6
        h-14 w-14
        rounded-full
        bg-red-600 hover:bg-red-700
        flex items-center justify-center
        shadow-lg
        z-40
      "
    >
      {/* mic svg */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19.93V22h2v-2.07a8.001 8.001 0 0 0 6.938-6.938l-1.999-.264A6 6 0 0 1 6.06 15.06l-2 .265A8 8 0 0 0 11 19.93z" />
      </svg>
    </button>
  );
}
