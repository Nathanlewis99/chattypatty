// frontend/app/page.jsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-6">
        <h1 className="text-5xl font-bold">ChattyPatty</h1>
        <p className="max-w-2xl text-lg text-gray-300">
          A conversational AI language tutor. Practice chatting in over 100
          languages, get instant corrections, and simulate real‑world scenarios
          (ordering food, asking for directions, and more). Learn faster by
          speaking—just like being immersed in a foreign country.
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-medium transition"
          >
            Sign Up
          </Link>
        </div>
      </header>

      <section className="bg-gray-800 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8 text-gray-200">
          <h2 className="text-3xl font-semibold text-center">Why ChattyPatty?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Real‑time conversation in your target language.</li>
            <li>Instant corrections with explanations in your native tongue.</li>
            <li>Role‑play food orders, travel questions, business chats, and more.</li>
            <li>100+ languages supported.</li>
            <li>Type or speak—hear your tutor respond out loud.</li>
          </ul>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-500 text-sm text-center py-4">
        &copy; {new Date().getFullYear()} ChattyPatty. All rights reserved.
      </footer>
    </div>
  );
}
