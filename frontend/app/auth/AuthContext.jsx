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
  const [token, setToken] = useState(() => {
    // load from localStorage on first render
    return typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;
  });

  useEffect(() => {
    if (token) {
      // set axios default header so all calls carry your JWT
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, [token]);

  const login = async ({ email, password }) => {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/jwt/login`,
      // FastAPI-Users expects form data
      new URLSearchParams({ username: email, password })
    );
    const t = res.data.access_token;
    // persist it
    localStorage.setItem("token", t);
    setToken(t);
  };

  const register = async ({ email, password, full_name }) => {
    // this one doesn't return a token; you still need to call login()
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
