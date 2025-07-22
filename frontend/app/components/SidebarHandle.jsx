// frontend/app/components/SidebarHandle.jsx
"use client";

export default function SidebarHandle({ open, onToggle }) {
  return (
    <button
      aria-label="Toggle sidebar"
      onClick={onToggle}
      className={`
        fixed top-1/2
        -translate-y-1/2
        z-30
        h-14 w-7
        flex items-center justify-center
        bg-gray-800 text-white
        shadow-xl rounded-r
        hover:bg-gray-700 transition
        // position depends on open state + breakpoint
        ${open ? "left-64 md:left-64" : "left-0 md:left-0"}
      `}
    >
      {/* Arrow: when open show “<” (collapse), when closed show “>” (expand) */}
      <span className="text-lg leading-none">{open ? "«" : "»"}</span>
    </button>
  );
}
