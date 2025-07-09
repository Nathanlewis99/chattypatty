// frontend/app/auth/AuthContext.jsx
"use client";

import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext({
  token: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      setToken(t);
      axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    }
  }, []);

  const login = async ({ email, password }) => {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/jwt/login`,
      new URLSearchParams({ username: email, password })
    );
    const t = res.data.access_token;
    localStorage.setItem("token", t);
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    setToken(t);
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
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
