"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeCtx { dark: boolean; toggle: () => void; }
const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read initial state synchronously from html class (set by inline script)
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Check current state of html element (set by inline script in head)
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  function apply(d: boolean) {
    if (d) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setDark(d);
    // Persist
    try {
      const saved = JSON.parse(localStorage.getItem("privyon_prefs") || "{}");
      localStorage.setItem("privyon_prefs", JSON.stringify({ ...saved, darkMode: d }));
    } catch {}
  }

  function toggle() { apply(!dark); }

  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }

// Inline script to inject in <head> to apply dark class before hydration
// Add this to your root layout.tsx:
// <Script id="theme-init" strategy="beforeInteractive">{`
//   try{var p=JSON.parse(localStorage.getItem('privyon_prefs')||'{}');if(p.darkMode)document.documentElement.classList.add('dark')}catch(e){}
// `}</Script>
