// frontend/app/auth/AuthContext.jsx
"use client";

import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// ————— GLOBAL 401 HANDLER —————
// Any 401 from axios will clear the token & redirect to login.
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

  // 1️⃣ Re‑hydrate token on mount
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setToken(t);
      axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    }
    setInitialized(true);
  }, []);

  // 2️⃣ Avoid rendering until we've re‑hydrated
  if (!initialized) return null;

  // ———— auth actions ————

  // LOGIN
  // Accepts { email, password, recaptcha_token }
  const login = async ({ email, password, recaptcha_token }) => {
    // We need form‑encoded so FastAPI sees it as form data
    const params = new URLSearchParams({
      username: email,
      password,
    });
    // send the reCAPTCHA checkbox token under “token”
    if (recaptcha_token) {
      params.append("token", recaptcha_token);
    }

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/jwt/login`,
      params
    );
    const t = res.data.access_token;
    localStorage.setItem("token", t);
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    setToken(t);
    router.replace("/chat");
  };

  // REGISTER
  // Accepts { full_name, email, password, recaptcha_token }
  const register = async ({ full_name, email, password, recaptcha_token }) => {
    // JSON body is fine for register; our recaptcha verifier will pull from JSON
    const payload = {
      full_name,
      email,
      password,
    };
    if (recaptcha_token) {
      payload.recaptcha_token = recaptcha_token;
    }
    await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/register`,
      payload
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
