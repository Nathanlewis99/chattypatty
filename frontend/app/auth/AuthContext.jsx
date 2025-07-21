// frontend/app/auth/AuthContext.jsx
"use client";

import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// ————— GLOBAL 401 HANDLER —————
// Runs as soon as this module is loaded (on the client).
// Any axios response with status 401 will clear the token & do a hard redirect.
if (typeof window !== "undefined") {
  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        delete axios.defaults.headers.common.Authorization;
        window.location.href = "/login";
      }
      return Promise.reject(err);
    }
  );
}

export const AuthContext = createContext({
  token: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
});

export function AuthProvider({ children }) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // 1️⃣ On mount, re‑hydrate your token & set up axios default header
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setToken(t);
      axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    }
    setInitialized(true);
  }, []);

  // 2️⃣ Don’t render *any* children (and thus avoid any early axios calls)
  //    until after we’ve finished that re‑hydration above.
  if (!initialized) {
    return null; // or a loading spinner if you prefer
  }

  // ———— auth actions ————
  const login = async ({ email, password }) => {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/jwt/login`,
      new URLSearchParams({ username: email, password })
    );
    const t = res.data.access_token;
    localStorage.setItem("token", t);
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    setToken(t);
    router.replace("/");
  };

  const register = async ({ email, password, full_name }) => {
    await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
      { email, password, full_name }
    );
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
