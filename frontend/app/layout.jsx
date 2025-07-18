// frontend/app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./auth/AuthContext";
import { ConversationProvider } from "./ConversationContext";
import Header from "./components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Chattypatty",
  description: "AI-powered language buddy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ConversationProvider>
            {/* add the header here */}
            <Header />
            {/* your existing app */}
            {children}
          </ConversationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
