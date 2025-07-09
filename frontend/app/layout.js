// frontend/app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// your font variables
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// NOTE: This import is a Client Component
import { AuthProvider } from "./auth/AuthContext";

export const metadata = {
  title: "Chattypatty",
  description: "AI-powered language buddy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Wrap everything in the AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
