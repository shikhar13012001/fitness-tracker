"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

const STORAGE_KEY = "fittrack-theme";

type Theme = "dark" | "light" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

export function ThemeApplier() {
  const profile = useLiveQuery(() => db.userProfile.get(1));

  // Apply persisted theme synchronously on mount (before DB loads)
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) ?? "dark") as Theme;
    applyTheme(stored);

    // Re-apply if system preference changes while on "system"
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const t = (localStorage.getItem(STORAGE_KEY) ?? "dark") as Theme;
      if (t === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Sync with DB profile
  useEffect(() => {
    if (profile === undefined) return;
    const theme = (profile?.theme ?? "dark") as Theme;
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }, [profile?.theme]);

  return null;
}
