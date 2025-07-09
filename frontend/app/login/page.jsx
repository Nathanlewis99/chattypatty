// frontend/app/login/page.jsx
"use client";

import LoginForm from "../components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl mb-6 text-center">Log in</h1>
        <LoginForm />
        <p className="mt-4 text-center text-gray-400">
          Don’t have an account?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
