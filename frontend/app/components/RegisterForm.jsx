// frontend/app/components/RegisterForm.jsx
"use client";

import { useState, useRef, useContext } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import { AuthContext } from "../auth/AuthContext";

export default function RegisterForm() {
  const { register } = useContext(AuthContext);
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
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
      await register({
        full_name: fullName,
        email,
        password,
        recaptcha_token: token,
      });
      setSuccess(true);
      recaptchaRef.current?.reset();
      setToken("");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError("Registration failed. Maybe that email is taken or reCAPTCHA failed?");
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
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
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
        {loading ? "Creating…" : "Create Account"}
      </button>
    </form>
  );
}
