"use client";

import React from "react";

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring"
    />
  );
}
