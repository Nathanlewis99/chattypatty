"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function VerifyPage() {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get("token");
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    axios
      .get(`${BACKEND}/auth/verify`, { params: { token } })
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/login"), 2000);
      })
      .catch(() => {
        setStatus("error");
      });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      {status === "pending" && <p>Verifying your email…</p>}
      {status === "success" && (
        <div className="text-green-400">
          <p>Email verified! Redirecting to login…</p>
        </div>
      )}
      {status === "error" && (
        <div className="text-red-400 space-y-4 text-center">
          <p>Something went wrong verifying your email.</p>
          <button
            onClick={() => router.push("/register")}
            className="text-blue-300 hover:underline"
          >
            Back to sign up
          </button>
        </div>
      )}
    </div>
  );
}
