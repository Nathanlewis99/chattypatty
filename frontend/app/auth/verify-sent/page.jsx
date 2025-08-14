"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function VerifySentPage() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const params  = useSearchParams();
  const email   = params.get("email") || "";
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setStatus("");
    try {
      await axios.post(
        `${BACKEND}/auth/verify/resend`,
        { email },
        { headers: { "Content-Type": "application/json" } }
      );
      setStatus("Verification email resent!");
    } catch (err) {
      console.error(err);
      setStatus("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-gray-800 p-6 rounded shadow">
        <h1 className="text-2xl font-bold">Verification Email Sent</h1>

        <p>
          We’ve sent a verification email to{" "}
          <strong className="break-all">{email}</strong>. Please check your inbox.
        </p>

        <div>
          <span>Not received?{" "}</span>
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-blue-400 hover:underline disabled:text-gray-500"
          >
            {loading ? "Resending…" : "Resend"}
          </button>
        </div>

        {status && <p className="text-sm text-green-400">{status}</p>}

        <p className="pt-4 text-sm">
          Once you have verified your email,{" "}
          <Link href="/login">
            <a className="text-blue-400 hover:underline">you can log in</a>
          </Link>.
        </p>
      </div>
    </div>
  );
}
