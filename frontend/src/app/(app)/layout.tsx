"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldCheck, LogOut, LayoutDashboard, FileCode2,
  Database, FileText, Bell, Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",          href: "/dashboard" },
  { icon: FileCode2,        label: "Análise de Código",  href: "/analyze" },
  { icon: Database,         label: "Auditoria de Banco", href: "/db-audit" },
  { icon: FileText,         label: "Relatórios",         href: "/reports" },
  { icon: Bell,             label: "Alertas",            href: "/alerts" },
  { icon: Settings,         label: "Configurações",      href: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-text-dim">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-[#cdd9e5] font-sans flex">
      {/* Grid bg */}
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR (montado UMA vez, nunca re-monta) ── */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r border-border transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}
        style={{ width: 220, background: "#070b0f", minHeight: "100vh" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-[52px] border-b border-border flex-shrink-0">
          <ShieldCheck size={18} className="text-accent" />
          <span className="font-bold text-white tracking-tight text-sm">
            Priv<span className="text-accent">yon</span>
          </span>
        </div>

        {/* Nav — usa <Link> para prefetch automático */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} prefetch={true}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all
                  ${active ? "text-white" : "text-text-dim hover:text-white hover:bg-white/[0.04]"}`}
                style={active ? { background: "#00e5ff11" } : {}}>
                <Icon size={15} className={active ? "text-accent" : ""} />
                {label}
                {active && <div className="ml-auto w-1 h-1 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: "#ffffff05" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #00e5ff, #0099aa)" }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white truncate">{user.name}</p>
              <p className="text-[9px] font-mono text-accent uppercase tracking-wider">{user.role}</p>
            </div>
            <button onClick={logout} className="text-text-dim hover:text-danger transition-colors flex-shrink-0">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── PAGE CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
