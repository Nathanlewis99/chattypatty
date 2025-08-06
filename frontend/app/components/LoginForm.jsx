"use client";

import { useState, useRef, useContext } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { AuthContext } from "../auth/AuthContext";

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const recaptchaRef            = useRef(null);
  const [token, setToken]       = useState("");
  const router                  = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Please complete the reCAPTCHA");
      return;
    }

    setLoading(true);
    try {
      await login({
        email,
        password,
        recaptcha_token: token,
      });
      router.push("/chat");
    } catch (err) {
      setError("Invalid credentials or reCAPTCHA failed");
      recaptchaRef.current?.reset();
      setToken("");
    } finally {
      setLoading(false);
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
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="
            w-full
            bg-gray-700
            border border-gray-600
            text-white
            placeholder-gray-400
            p-3
            rounded
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="
            w-full
            bg-gray-700
            border border-gray-600
            text-white
            placeholder-gray-400
            p-3
            rounded
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
      </div>

      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
        onChange={(t) => {
          setToken(t);
          setError("");
        }}
      />

      <button
        type="submit"
        disabled={loading}
        className={`
          w-full
          ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}
          text-white
          font-medium
          py-3
          rounded
          transition
        `}
      >
        {loading ? "Logging in…" : "Log In"}
      </button>
    </form>
  );
}