// frontend/app/components/SidebarHandle.jsx
"use client";

export default function SidebarHandle({ open, onToggle }) {
  return (
    <button
      aria-label="Toggle sidebar"
      onClick={onToggle}
      className={`
        fixed top-1/2 -translate-y-1/2
        z-50                      /* <<< bump above sidebar’s z-40 */
        h-14 w-7
        flex items-center justify-center
        bg-gray-800 text-white
        shadow-xl rounded-r
        hover:bg-gray-700 transition
        ${open ? "left-64" : "left-0"}  /* <<< no more md: prefix */
      `}
    >
      <span className="text-lg leading-none">
        {open ? "«" : "»"}
      </span>
    </button>
  );
}
