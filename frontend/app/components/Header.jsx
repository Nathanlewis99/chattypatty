// frontend/app/components/Header.jsx
"use client";

import { useState, useRef, useEffect, useContext } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AuthContext } from "../auth/AuthContext";

export default function Header() {
  const { logout } = useContext(AuthContext);
  const router    = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header
      className="
        fixed top-0 left-0 right-0
        h-24            /* 96px high */
        bg-gray-900
        flex items-center justify-between
        px-4 pl-64      /* leave room for sidebar */
        z-0
      "
    >
      {/* left: logo */}
      <div className="flex items-center">
        <Image
          src="/ChattyPattyLogo.png"
          alt="ChattyPatty Logo"
          width={100}
          height={100}
          className="
            object-contain
            h-20 w-20      /* 80px on smallest */
            sm:h-24 sm:w-24/* 96px on sm+ */
          "
        />
      </div>

      {/* right: profile menu */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-full hover:bg-gray-800"
        >
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white rounded shadow-lg overflow-hidden">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-800"
            >
              Logout
            </button>
            <button
              onClick={() => {
                setOpen(false);
                router.push("/reset-password");
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-800"
            >
              Reset Password
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
