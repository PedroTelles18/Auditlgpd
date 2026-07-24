"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import type { ThemePreferences } from "@/types/auth";

export type AccentColor = NonNullable<ThemePreferences["accent"]>;
export type ThemeMode = NonNullable<ThemePreferences["mode"]>;

const PREFS_KEY = "privyon_prefs";

// Paleta: cada cor tem uma versão para modo claro e uma para modo escuro,
// reaproveitando os mesmos 4 tokens que já existem no globals.css
// (--accent, --accent-h, --accent-l, --accent-m).
const ACCENT_PALETTE: Record<AccentColor, Record<ThemeMode, Record<string, string>>> = {
  blue: {
    light: { accent: "#2563eb", "accent-h": "#1d4ed8", "accent-l": "#eff6ff", "accent-m": "#bfdbfe" },
    dark:  { accent: "#60a5fa", "accent-h": "#3b82f6", "accent-l": "#1e3a5f", "accent-m": "#1e3a5f" },
  },
  cyan: {
    light: { accent: "#0891b2", "accent-h": "#0e7490", "accent-l": "#ecfeff", "accent-m": "#a5f3fc" },
    dark:  { accent: "#22d3ee", "accent-h": "#06b6d4", "accent-l": "#164e63", "accent-m": "#164e63" },
  },
  violet: {
    light: { accent: "#7c3aed", "accent-h": "#6d28d9", "accent-l": "#f5f3ff", "accent-m": "#ddd6fe" },
    dark:  { accent: "#a78bfa", "accent-h": "#8b5cf6", "accent-l": "#3b2f63", "accent-m": "#3b2f63" },
  },
  emerald: {
    light: { accent: "#059669", "accent-h": "#047857", "accent-l": "#ecfdf5", "accent-m": "#a7f3d0" },
    dark:  { accent: "#34d399", "accent-h": "#10b981", "accent-l": "#14432f", "accent-m": "#14432f" },
  },
  amber: {
    light: { accent: "#d97706", "accent-h": "#b45309", "accent-l": "#fffbeb", "accent-m": "#fde68a" },
    dark:  { accent: "#fbbf24", "accent-h": "#f59e0b", "accent-l": "#4a3510", "accent-m": "#4a3510" },
  },
  rose: {
    light: { accent: "#e11d48", "accent-h": "#be123c", "accent-l": "#fff1f2", "accent-m": "#fecdd3" },
    dark:  { accent: "#fb7185", "accent-h": "#f43f5e", "accent-l": "#4a1620", "accent-m": "#4a1620" },
  },
};

export const ACCENT_LABELS: Record<AccentColor, string> = {
  blue: "Azul", cyan: "Ciano", violet: "Violeta",
  emerald: "Esmeralda", amber: "Âmbar", rose: "Rosa",
};

interface ThemeContextType {
  accent: AccentColor;
  mode: ThemeMode;
  setAccent: (color: AccentColor) => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  saving: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  accent: "blue",
  mode: "dark",
  setAccent: async () => {},
  setMode: async () => {},
  saving: false,
});

function applyTheme(accent: AccentColor, mode: ThemeMode) {
  const root = document.documentElement;

  // Aplica claro/escuro reaproveitando a classe que o globals.css já usa
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  // Sobrescreve os tokens de cor via inline style (tem prioridade sobre o CSS)
  const palette = ACCENT_PALETTE[accent]?.[mode] ?? ACCENT_PALETTE.blue[mode];
  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(`--${token}`, value);
  });

  // ← Mantém o localStorage sincronizado — é o que o script anti-flash
  // no layout.tsx lê antes do React montar, evitando piscar tema errado
  try {
    const existing = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ ...existing, darkMode: mode === "dark", accent })
    );
  } catch {
    // localStorage indisponível (modo privado, etc.) — não é crítico, ignora
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, refresh } = useAuth();
  const [accent, setAccentState] = useState<AccentColor>("blue");
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [saving, setSaving] = useState(false);

  // Quando o usuário carrega (login/refresh), aplica a preferência salva dele
  useEffect(() => {
    if (!user) return;
    const prefs = user.theme_preferences;
    const savedAccent = prefs?.accent ?? "blue";
    const savedMode = prefs?.mode ?? "dark";
    setAccentState(savedAccent);
    setModeState(savedMode);
    applyTheme(savedAccent, savedMode);
  }, [user]);

  const setAccent = useCallback(async (color: AccentColor) => {
    setSaving(true);
    setAccentState(color);
    applyTheme(color, mode);
    try {
      await api.patch("/auth/me/theme", { accent: color });
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [mode, refresh]);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setSaving(true);
    setModeState(newMode);
    applyTheme(accent, newMode);
    try {
      await api.patch("/auth/me/theme", { mode: newMode });
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [accent, refresh]);

  return (
    <ThemeContext.Provider value={{ accent, mode, setAccent, setMode, saving }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
