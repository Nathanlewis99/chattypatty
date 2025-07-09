"use client";

import { useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const { register } = useContext(AuthContext);
  const [email, setEmail]         = useState("");
  const [fullName, setFullName]   = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const router = useRouter();

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      await register({ email, password, full_name: fullName });
      setSuccess(true);
      // after a short delay, redirect to login
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError("Registration failed. Maybe that email is taken?");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-red-400 bg-red-900 p-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-400 bg-green-900 p-2 rounded">
          Registration successful! Redirecting…
        </div>
      )}

      <div>
        <label className="block mb-1 text-sm font-medium">Full name</label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Jane Doe"
          className="
            w-full
            bg-gray-700 border border-gray-600 text-white placeholder-gray-400
            p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="
            w-full
            bg-gray-700 border border-gray-600 text-white placeholder-gray-400
            p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="
            w-full
            bg-gray-700 border border-gray-600 text-white placeholder-gray-400
            p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          required
        />
      </div>

      <button
        type="submit"
        className="
          w-full bg-blue-600 hover:bg-blue-700 text-white font-medium
          py-3 rounded transition
        "
      >
        Create Account
      </button>
    </form>
  );
}
