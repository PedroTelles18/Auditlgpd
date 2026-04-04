"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeCtx { dark: boolean; toggle: () => void; }
const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("privyon_prefs") || "{}");
    if (saved.darkMode) apply(true);
  }, []);

  function apply(d: boolean) {
    if (d) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    setDark(d);
  }

  function toggle() {
    const next = !dark;
    apply(next);
    // Persist in prefs
    try {
      const saved = JSON.parse(localStorage.getItem("privyon_prefs") || "{}");
      localStorage.setItem("privyon_prefs", JSON.stringify({ ...saved, darkMode: next }));
    } catch {}
  }

  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
