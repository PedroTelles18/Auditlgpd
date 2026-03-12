"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, LogOut, FileText, ArrowLeft, ChevronRight,
  Download, Loader2, FileCode2, Database, Calendar,
  CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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


export default function ReportsPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const token = Cookies.get("access_token");
        const res = await fetch(`${API_URL}/history/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReports(data.map((r: {id: string; audit_type: string; title: string; created_at: string; total_findings: number; score: number}) => ({
            id: r.id,
            type: r.audit_type as "code" | "db",
            title: r.title,
            date: r.created_at,
            findings: r.total_findings,
            score: Math.round(r.score),
            status: r.score >= 80 ? "ok" : r.score >= 50 ? "warning" : "critical",
          })));
        }
      } catch {} finally { setLoadingReports(false); }
    }
    fetchHistory();
  }, []);

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
    <div className="flex-1 flex flex-col min-w-0 page-enter">
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
  );
}
