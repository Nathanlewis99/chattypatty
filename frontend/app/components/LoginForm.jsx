"use client";

import { useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const router = useRouter();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login({ email, password });
      router.push("/");
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-red-400 bg-red-900 p-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-1 text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="
            w-full
            bg-gray-700
            border
            border-gray-600
            text-white
            placeholder-gray-400
            p-3
            rounded
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
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
            bg-gray-700
            border
            border-gray-600
            text-white
            placeholder-gray-400
            p-3
            rounded
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
          required
        />
      </div>

      <button
        type="submit"
        className="
          w-full
          bg-blue-600
          hover:bg-blue-700
          text-white
          font-medium
          py-3
          rounded
          transition
        "
      >
        Log In
      </button>
    </form>
  );
}