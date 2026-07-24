"use client";

import { Sun, Moon, Check, Loader2 } from "lucide-react";
import { useTheme, ACCENT_LABELS, type AccentColor } from "@/context/ThemeContext";

const SWATCH_COLORS: Record<AccentColor, string> = {
  blue: "#2563eb",
  cyan: "#0891b2",
  violet: "#7c3aed",
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
};

export default function ThemeSwitcher() {
  const { accent, mode, setAccent, setMode, saving } = useTheme();

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold" style={{ color: "var(--text)" }}>
          Aparência
        </h3>
        {saving && <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-3)" }} />}
      </div>

      {/* Claro / Escuro */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] mb-2" style={{ color: "var(--text-2)" }}>
          Modo
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("light")}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: mode === "light" ? "var(--accent-l)" : "var(--bg3)",
              color: mode === "light" ? "var(--accent)" : "var(--text-2)",
              border: `1.5px solid ${mode === "light" ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <Sun size={13} /> Claro
          </button>
          <button
            type="button"
            onClick={() => setMode("dark")}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: mode === "dark" ? "var(--accent-l)" : "var(--bg3)",
              color: mode === "dark" ? "var(--accent)" : "var(--text-2)",
              border: `1.5px solid ${mode === "dark" ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <Moon size={13} /> Escuro
          </button>
        </div>
      </div>

      {/* Cor de destaque */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] mb-2" style={{ color: "var(--text-2)" }}>
          Cor de destaque
        </p>
        <div className="flex gap-2.5 flex-wrap">
          {(Object.keys(SWATCH_COLORS) as AccentColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAccent(color)}
              title={ACCENT_LABELS[color]}
              className="relative w-9 h-9 rounded-full transition-transform hover:scale-110"
              style={{
                background: SWATCH_COLORS[color],
                boxShadow: accent === color ? `0 0 0 2px var(--card-bg), 0 0 0 4px ${SWATCH_COLORS[color]}` : "none",
              }}
            >
              {accent === color && (
                <Check size={15} className="absolute inset-0 m-auto" color="#fff" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
