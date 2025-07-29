// frontend/app/register/page.jsx
"use client";

import { useRouter } from "next/navigation";
import RegisterForm from "../components/RegisterForm";

export default function RegisterPage() {
  const router = useRouter();

  /** 
   * Called by the form when registration completes.
   * Redirects to /auth/verify‑sent?email=… 
   */
  const handleRegisterSuccess = (email) => {
    router.push(
      `/auth/verify-sent?email=${encodeURIComponent(email)}`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-3xl mb-6 text-center">Create Account</h1>

        {/* pass our callback into the form */}
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </div>
    </div>
  );
}
