"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, FileCode2, Database, Bot, LogOut,
  AlertTriangle, CheckCircle2, Clock, ChevronRight, Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const modules = [
  {
    icon: FileCode2,
    title: "Análise de Código-Fonte",
    description: "Scanner de repositórios Python e JavaScript via AST + regex.",
    status: "ativo",
    href: "/analyze",
  },
  {
    icon: Database,
    title: "Auditoria de Banco de Dados",
    description: "Conecta e audita PostgreSQL, MySQL, SQLite e SQL Server.",
    status: "ativo",
    href: "/db-audit",
  },
  {
    icon: Bot,
    title: "Motor de IA (Groq)",
    description: "Análise contextualizada com Llama 3.3 70B via Groq API.",
    status: "ativo",
    href: "/analyze",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState([
    { label: "Auditorias realizadas", value: "0", icon: Activity },
    { label: "Vulnerabilidades", value: "0", icon: AlertTriangle },
    { label: "Conformidade", value: "—", icon: ShieldCheck },
    { label: "Relatórios gerados", value: "0", icon: FileCode2 },
  ]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user) {
      setTimeout(() => setVisible(true), 50);
      try {
        const s = JSON.parse(localStorage.getItem("privyon_stats") || "{}");
        const audits = s.audits || 0;
        const vulns = s.vulnerabilities || 0;
        const score = audits > 0 ? Math.max(0, 100 - Math.round(vulns / audits) * 5) : 0;
        setStats([
          { label: "Auditorias realizadas", value: String(audits), icon: Activity },
          { label: "Vulnerabilidades", value: String(vulns), icon: AlertTriangle },
          { label: "Conformidade", value: audits > 0 ? score + "%" : "—", icon: ShieldCheck },
          { label: "Relatórios gerados", value: String(audits), icon: FileCode2 },
        ]);
      } catch {}
    }
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
    <div className="min-h-screen bg-bg text-[#cdd9e5] font-sans">
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#1e2d3d 1px, transparent 1px), linear-gradient(90deg, #1e2d3d 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 border-b border-border"
        style={{ height: "52px", background: "#080c10ee", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-accent" />
          <span className="font-bold text-white tracking-tight">Priv<span className="text-accent">yon</span></span>
          <span className="hidden sm:block text-border">|</span>
          <span className="hidden sm:block text-xs font-mono text-text-dim">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-white font-semibold">{user.name}</span>
            <span className="text-[10px] font-mono text-accent-soft uppercase tracking-wider">{user.role}</span>
          </div>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-text-dim hover:text-danger transition-colors border border-transparent hover:border-[#ff4d6d33]">
            <LogOut size={13} /> Sair
          </button>
        </div>
      </nav>

      <main className="relative max-w-5xl mx-auto px-6 py-10 transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}>

        <div className="mb-10">
          <p className="text-xs font-mono text-text-dim uppercase tracking-widest mb-1">// bem-vindo de volta</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{user.name}</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg p-4 border border-border" style={{ background: "#0d1117" }}>
              <div className="flex items-center justify-between mb-3">
                <Icon size={14} className="text-text-dim" />
              </div>
              <div className="text-2xl font-bold text-white font-mono mb-1">{value}</div>
              <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Módulos de Auditoria</h2>
          <span className="text-xs font-mono text-text-dim">Sprint 3 →</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {modules.map(({ icon: Icon, title, description, status, href }) => (
            <div key={title} onClick={() => href && router.push(href)}
              className={`group rounded-xl border border-border p-5 relative overflow-hidden transition-all duration-200 ${href ? "cursor-pointer hover:border-[#2a4a5a]" : "cursor-default"}`}
              style={{ background: "#0d1117" }}>
              <div className="absolute top-0 left-1/4 right-1/4 h-px opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ background: "linear-gradient(to right, transparent, #00e5ff, transparent)" }} />
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "#00e5ff11", border: "1px solid #00e5ff22" }}>
                <Icon size={16} className="text-accent" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 leading-tight">{title}</h3>
              <p className="text-xs font-mono text-text-dim leading-relaxed mb-4">{description}</p>
              <div className="flex items-center justify-between">
                {status === "ativo" ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ background: "#0a1f12", color: "#3ddc84", border: "1px solid #1e3a2a" }}>
                    <CheckCircle2 size={9} /> Disponível
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ background: "#1a2a1a", color: "#3ddc84aa", border: "1px solid #1e3a2a" }}>
                    <Clock size={9} /> Em breve
                  </span>
                )}
                <ChevronRight size={13} className="text-border group-hover:text-text-dim transition-colors" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border p-5" style={{ background: "#0d1117" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Status do Projeto</h2>
            <span className="text-xs font-mono text-text-dim">TCC 2026</span>
          </div>
          <div className="space-y-3">
            {[
              { sprint: "Sprint 1", desc: "Auth JWT + Frontend base", done: true },
              { sprint: "Sprint 2", desc: "Code Analyzer + Groq AI", done: true },
              { sprint: "Sprint 3", desc: "DB Auditor + Integração IA", done: true },
              { sprint: "Sprint 4", desc: "Relatórios PDF + Testes finais", done: true },
            ].map(({ sprint, desc, done }) => (
              <div key={sprint} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 size={15} className="text-success flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" />
                )}
                <span className={`text-xs font-mono ${done ? "text-white" : "text-text-dim"}`}>
                  <span className="text-accent mr-2">{sprint}</span>{desc}
                </span>
                {done && <span className="ml-auto text-[10px] font-mono text-success">concluído</span>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
