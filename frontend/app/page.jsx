// frontend/app/page.jsx
"use client";

import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AuthContext } from "./auth/AuthContext";
import LanguageSelector from "./components/LanguageSelector";

export default function LandingPage() {
  const { token } = useContext(AuthContext);
  const [languages, setLanguages] = useState([]);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetch(`${BACKEND}/languages?target=en`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load languages");
        return res.json();
      })
      .then((data) =>
        setLanguages(
          data.map(({ language, name }) => ({
            value: language,
            label: name,
          }))
        )
      )
      .catch((err) => {
        console.error("Error fetching languages:", err);
      });
  }, [BACKEND]);

  return (
    <div className="mt-24 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Hero Section */}
      <header className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-6">
        <div className="flex items-center">
          <Link href="/">
              <Image
                src="/ChattyPattyLogo.png"
                alt="ChattyPatty Logo"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
          </Link>
        </div>

        <h1 className="text-5xl font-bold animated-text-gradient mb-3">
          ChattyPatty
        </h1>

        <div className="max-w-2xl text-lg text-gray-300 space-y-6">
          <p>
            ChattyPatty is a conversational language tutor, powered by artificial
            intelligence. With ChattyPatty you can practice conversing in over 100
            languages, receiving instant corrections with comprehensive explanations
            any time you make a mistake, or where ChattyPatty spots room for improvement.
          </p>
          <p>
            ChattyPatty allows you to simulate real‑world scenarios and conversations.
            You can do this with specific prompting (for example “You are a waiter in a
            restaurant taking my food order,” or “I’m a driver asking you for directions”),
            or with a fully open conversation, where ChattyPatty will roll with you
            leaving you free to take the conversation wherever you like.
          </p>
          <p>
            ChattyPatty is built on the premise that you learn languages faster and in
            more depth when you’re in a country and speaking that language on a
            regular basis, throwing yourself in the deep end. The problem many people
            face is when they go home, they have no one to speak with in the
            practice language, and so conversational skills begin to recede. ChattyPatty
            solves this problem, not only by giving you someone to speak with and practice
            whichever skills best suit your use case, but also by coaching you along the way.
          </p>
          <p>
            Learn faster through conversation — just like being immersed in a foreign country.
          </p>
        </div>

        <div className="space-x-4 mb-8">
          {!token ? (
            <>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition cursor-pointer"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-medium transition cursor-pointer"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <Link href="/chat">
              <button
                className="
                  inline-block px-6 py-3
                  animated-gradient
                  text-white font-medium rounded
                  hover:scale-105 transform transition
                  cursor-pointer
                "
              >
                Chat
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* Why ChattyPatty */}
      <section className="bg-gray-800 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8 text-gray-200">
          <h2 className="text-3xl font-semibold text-center">Why ChattyPatty?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Real‑time conversation in your target language.</li>
            <li>Instant corrections with explanations in your native tongue.</li>
            <li>Role‑play any scenario, like food orders, travel questions, business chats, and anything in between.</li>
            <li>100+ languages supported.</li>
            <li>Type or speak — hear your tutor respond out loud (with transcriptions as you go).</li>
            <li>Built-in vocab helper; don't know how to say a word or phrase? Just ask the vocab helper how to say it!</li>
            <li>Translate individual words, or the whole phrases from ChattyPatty's response if you don't understand.</li>
            <li>Full conversation history — pick up old conversations where you left off.</li>
          </ul>
        </div>
      </section>

      {/* Who should use ChattyPatty */}
      <section className="bg-gray-600 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8 text-gray-200">
          <h2 className="text-3xl font-semibold text-center">Who should use ChattyPatty?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Great for beginners looking to practice real world conversations.</li>
            <li>Those with intermediate to advanced language skills, who don't have anyone to practice with.</li>
            <li>People looking to level up from basic vocab to understanding real / common conversational phrases.</li>
            <li>Anyone looking to improve speaking, reading or writing skills in a foreign language.</li>
            <li>Nervous about a convo in a foreign language? Simulate it with ChattyPatty first to practice!</li>
          </ul>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="bg-gray-700 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6 text-white">
          <h2 className="text-3xl font-semibold text-center">Supported Languages</h2>
          <LanguageSelector
            label="Languages"
            options={languages}
            value=""
            onChange={() => {}}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 text-sm text-center py-4">
        &copy; {new Date().getFullYear()} ChattyPatty. All rights reserved.
      </footer>
    </div>
  );
}
