// frontend/app/reset-password/page.jsx
"use client";

import { useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

export default function ResetPasswordPage() {
  const { /* you might add a resetPassword fn */ } = useContext(AuthContext);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // call your reset API here...
    alert("Reset link sent (stub)!");
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span>Email</span>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
