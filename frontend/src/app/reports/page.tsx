"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, LogOut, FileText, ArrowLeft, ChevronRight,
  Download, Loader2, FileCode2, Database, Calendar,
  CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ReportEntry {
  id: string;
  type: "code" | "db";
  title: string;
  date: string;
  findings: number;
  score: number;
  status: "ok" | "warning" | "critical";
}

function Sidebar({ router, logout, user }: { router: ReturnType<typeof useRouter>; logout: () => void; user: { name: string; role: string } }) {
  const NAV = [
    { icon: require("lucide-react").LayoutDashboard, label: "Dashboard",          href: "/dashboard" },
    { icon: FileCode2,    label: "Análise de Código",  href: "/analyze" },
    { icon: Database,     label: "Auditoria de Banco", href: "/db-audit" },
    { icon: FileText,     label: "Relatórios",         href: "/reports" },
    { icon: require("lucide-react").Bell, label: "Alertas", href: "/alerts" },
    { icon: require("lucide-react").Settings, label: "Configurações", href: "/settings" },
  ];
  return (
    <aside className="hidden lg:flex flex-col border-r border-border flex-shrink-0" style={{ width: 220, background: "#070b0f" }}>
      <div className="flex items-center gap-2.5 px-5 h-[52px] border-b border-border">
        <ShieldCheck size={18} className="text-accent" />
        <span className="font-bold text-white tracking-tight text-sm">Priv<span className="text-accent">yon</span></span>
      </div>
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = href === "/reports";
          return (
            <button key={label} onClick={() => router.push(href)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all w-full text-left ${active ? "text-white" : "text-text-dim hover:text-white hover:bg-white/[0.04]"}`}
              style={active ? { background: "#00e5ff11" } : {}}>
              <Icon size={15} className={active ? "text-accent" : ""} />
              {label}
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-accent" />}
            </button>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ background: "#ffffff05" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #00e5ff, #0099aa)" }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-white truncate">{user.name}</p>
            <p className="text-[9px] font-mono text-accent uppercase tracking-wider">{user.role}</p>
          </div>
          <button onClick={logout} className="text-text-dim hover:text-danger transition-colors"><LogOut size={13} /></button>
        </div>
      </div>
    </aside>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [reports] = useState<ReportEntry[]>([
    { id: "r1", type: "code", title: "Análise — app.py, models.py", date: "2026-03-10T08:30:00Z", findings: 4, score: 72, status: "warning" },
    { id: "r2", type: "db",   title: "Auditoria — PostgreSQL prod", date: "2026-03-09T14:22:00Z", findings: 7, score: 48, status: "critical" },
    { id: "r3", type: "code", title: "Análise — routes.ts, auth.ts", date: "2026-03-08T11:10:00Z", findings: 1, score: 91, status: "ok" },
  ]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  async function downloadReport(report: ReportEntry) {
    setGeneratingId(report.id);
    try {
      const token = Cookies.get("access_token");
      const endpoint = report.type === "code" ? "/reports/code-analysis" : "/reports/db-audit";
      const mockData = report.type === "code"
        ? { analysis_data: { total_files: 2, total_findings: report.findings, critical: 1, high: 1, medium: 1, low: 1, results: [] }, auditor_name: user?.name }
        : { audit_data: { database_name: "prod", total_findings: report.findings, score: report.score, findings_by_table: [] }, auditor_name: user?.name };
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(mockData),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `privyon-${report.type}-${report.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Erro ao gerar PDF."); } finally { setGeneratingId(null); }
  }

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-bg text-[#cdd9e5] font-sans flex">
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <Sidebar router={router} logout={logout} user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 border-b border-border flex-shrink-0"
          style={{ height: 52, background: "#070b0fee", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1 text-xs font-mono text-text-dim hover:text-accent transition-colors">
              <ArrowLeft size={12} /> Dashboard
            </button>
            <ChevronRight size={12} className="text-border" />
            <span className="text-xs font-mono text-white">Relatórios</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Relatórios</h1>
            <p className="text-xs font-mono text-text-dim mt-0.5">Histórico de auditorias e exportação de PDFs.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Total de relatórios", value: reports.length, color: "#00e5ff" },
              { label: "Conformes",           value: reports.filter(r => r.status === "ok").length, color: "#3ddc84" },
              { label: "Com problemas",       value: reports.filter(r => r.status !== "ok").length, color: "#ff4d6d" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border p-4" style={{ background: "#0b1117" }}>
                <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
                <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Reports list */}
          <div className="rounded-xl border border-border overflow-hidden" style={{ background: "#0b1117" }}>
            <div className="px-5 py-3 border-b border-border">
              <span className="text-xs font-mono text-text-dim uppercase tracking-wider">Auditorias realizadas</span>
            </div>
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0 hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: r.type === "code" ? "#00e5ff11" : "#3ddc8411", border: `1px solid ${r.type === "code" ? "#00e5ff22" : "#3ddc8422"}` }}>
                    {r.type === "code" ? <FileCode2 size={14} className="text-accent" /> : <Database size={14} className="text-success" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{r.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] font-mono text-text-dim flex items-center gap-1">
                        <Calendar size={8} /> {new Date(r.date).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-[10px] font-mono text-text-dim flex items-center gap-1">
                        <AlertTriangle size={8} /> {r.findings} achados
                      </span>
                      <span className="text-[10px] font-mono" style={{
                        color: r.status === "ok" ? "#3ddc84" : r.status === "warning" ? "#ffd166" : "#ff4d6d"
                      }}>
                        {r.score}% conforme
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => downloadReport(r)} disabled={generatingId === r.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                  style={{ background: "#00e5ff", color: "#000" }}>
                  {generatingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  PDF
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
