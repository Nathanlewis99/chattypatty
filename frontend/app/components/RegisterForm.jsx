"use client";

import { useState, useRef } from "react";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";

export default function RegisterForm({ onSuccess }) {
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [fullName, setFullName]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");  // ← new
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const recaptchaRef                    = useRef(null);
  const [token, setToken]               = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Front-end password match check
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Please complete the reCAPTCHA");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${BACKEND}/auth/register`,
        {
          full_name: fullName,
          email,
          password,
          recaptcha_token: token,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      setSuccess(true);
      // reset for potential retry
      recaptchaRef.current?.reset();
      setToken("");
      // give UX a moment, then advance
      setTimeout(() => onSuccess(email), 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
        "Registration failed. Perhaps that email is taken or reCAPTCHA failed?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-red-400 bg-red-900 p-2 rounded">{error}</div>
      )}
      {success && (
        <div className="text-green-400 bg-green-900 p-2 rounded">
          Verification email sent! Redirecting…
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
          className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Confirm password field */}
      <div>
        <label className="block mb-1 text-sm font-medium">Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full bg-gray-700 border border-gray-600 text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        className={`w-full ${
          loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
        } text-white font-medium py-3 rounded transition`}
      >
        {loading ? "Creating…" : "Create Account"}
      </button>
    </form>
  );
}
