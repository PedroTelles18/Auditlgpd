"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  breadcrumb: string;
  children?: React.ReactNode;
}

export function Topbar({ breadcrumb, children }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-[58px] flex items-center justify-between px-6 flex-shrink-0 bg-white"
      style={{ borderBottom: "1px solid #e2e8f4", boxShadow: "0 1px 3px rgba(15,22,41,0.06)" }}>
      <div className="flex items-center gap-2 text-sm">
        <span style={{ color: "#94a3b8", fontWeight: 500 }}>Privyon</span>
        <span style={{ color: "#c8d4eb" }}>›</span>
        <span className="font-bold" style={{ color: "#0f172a" }}>{breadcrumb}</span>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Link href="/alerts"
          className="relative w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-colors"
          style={{ border: "1px solid #e2e8f4", background: "#fff", color: "#475569" }}>
          <Bell size={15} />
          <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full bg-red-500"
            style={{ border: "1.5px solid #fff" }} />
        </Link>
        <Link href="/profile"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: "1px solid #e2e8f4", background: "#fff" }}>
          <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-[11px] font-extrabold text-white"
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-[12px] font-bold" style={{ color: "#0f172a" }}>{user?.name?.split(" ")[0]}</span>
        </Link>
      </div>
    </header>
  );
}

/* ── Reusable UI primitives ── */

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl ${className}`}
      style={{ border: "1px solid #e2e8f4", boxShadow: "0 1px 3px rgba(15,22,41,0.06)" }}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = "blue" }: {
  children: React.ReactNode;
  variant?: "red" | "amber" | "blue" | "green" | "slate";
}) {
  const styles: Record<string, { bg: string; color: string; dot: string }> = {
    red:   { bg: "#fef2f2", color: "#ef4444", dot: "#ef4444" },
    amber: { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b" },
    blue:  { bg: "#eff6ff", color: "#2563eb", dot: "#2563eb" },
    green: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
    slate: { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
  };
  const s = styles[variant];
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {children}
    </span>
  );
}

export function BtnPrimary({ children, onClick, type = "button", disabled = false, className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold text-white transition-all disabled:opacity-50 ${className}`}
      style={{ background: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
      onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.background = "#1d4ed8"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#2563eb"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
      {children}
    </button>
  );
}

export function BtnOutline({ children, onClick, className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${className}`}
      style={{ background: "#fff", color: "#475569", border: "1px solid #e2e8f4" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f8fafc"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}>
      {children}
    </button>
  );
}
