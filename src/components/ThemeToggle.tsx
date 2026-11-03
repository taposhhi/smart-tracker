"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-9 w-9 rounded-lg border border-gray-300 bg-white text-base transition hover:bg-gray-100 dark:border-gray-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    >
      {mounted ? (dark ? "☀️" : "🌙") : ""}
    </button>
  );
}