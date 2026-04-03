"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import Cookies from "js-cookie";
import { Topbar, Card, Badge, BtnPrimary, BtnOutline } from "@/components/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Stats { audits: number; vulnerabilities: number; last_audit: string | null; }

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ audits: 0, vulnerabilities: 0, last_audit: null });

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (token) {
      fetch(`${API_URL}/history/stats`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setStats({ audits: d.audits, vulnerabilities: d.vulnerabilities, last_audit: d.last_audit }); })
        .catch(() => {
          try {
            const s = JSON.parse(localStorage.getItem("privyon_stats") || "{}");
            setStats({ audits: s.audits || 0, vulnerabilities: s.vulnerabilities || 0, last_audit: s.last_audit || null });
          } catch {}
        });
    }
  }, []);

  const conformidade = stats.audits > 0
    ? Math.max(0, Math.round(100 - (stats.vulnerabilities / stats.audits) * 5))
    : 0;

  const risco = conformidade >= 80 ? "Baixo" : conformidade >= 60 ? "Médio" : "Alto";
  const riscoColor = conformidade >= 80 ? "#15803d" : conformidade >= 60 ? "#b45309" : "#dc2626";
  const riscoBg   = conformidade >= 80 ? "#f0fdf4" : conformidade >= 60 ? "#fffbeb" : "#fef2f2";

  const KPI = ({ icon, val, label, trend, trendUp }: {
    icon: string; val: string | number; label: string; trend: string; trendUp: boolean | null;
  }) => (
    <Card className="p-5 card-hover cursor-default">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "#eff6ff" }}>{icon}</div>
        {trend && (
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full"
            style={{
              background: trendUp === null ? "#fffbeb" : trendUp ? "#f0fdf4" : "#f0fdf4",
              color: trendUp === null ? "#b45309" : "#15803d",
            }}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-[28px] font-extrabold leading-none mb-1" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
        {val}
      </div>
      <div className="text-[11px] font-semibold" style={{ color: "#94a3b8" }}>{label}</div>
    </Card>
  );

  const ALERTS = [
    { msg: "CPF armazenado sem criptografia", loc: "models.py · linha 45 · há 2h", sev: "red" as const,   label: "CRÍTICO" },
    { msg: "Query sem prepared statement",    loc: "db.py · linha 89 · há 3h",     sev: "amber" as const, label: "ALTO"    },
    { msg: "Log com dados pessoais",          loc: "views.py · linha 34 · há 5h",  sev: "blue" as const,  label: "MÉDIO"   },
  ];

  const QUICK = [
    { icon: "🔍", name: "Analisar código",  hint: "Python · JS",  href: "/analyze"  },
    { icon: "🗄️", name: "Auditar banco",   hint: "PostgreSQL",   href: "/db-audit" },
    { icon: "📄", name: "Relatórios",       hint: `${stats.audits} auditorias`, href: "/reports" },
    { icon: "🔔", name: "Alertas",          hint: "3 não lidos",  href: "/alerts"   },
  ];

  const BARS = [
    { d: "Seg", h: 40 }, { d: "Ter", h: 74 }, { d: "Qua", h: 50 },
    { d: "Qui", h: 100 }, { d: "Sex", h: 63 }, { d: "Sáb", h: 30 }, { d: "Dom", h: 20 },
  ];

  const PROGS = [
    { label: "Crítico", val: 12, pct: 28,  color: "#ef4444" },
    { label: "Alto",    val: 28, pct: 48,  color: "#f59e0b" },
    { label: "Médio",   val: 47, pct: 64,  color: "#2563eb" },
    { label: "Baixo",   val: 10, pct: 20,  color: "#22c55e" },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb="Dashboard">
        <BtnOutline onClick={() => router.push("/reports")}>
          <Download size={13} /> Exportar
        </BtnOutline>
        <BtnPrimary onClick={() => router.push("/analyze")}>
          <Plus size={13} /> Nova auditoria
        </BtnPrimary>
      </Topbar>

      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: "#f8fafc" }}>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            Dashboard
          </h1>
          <p className="text-[12px] font-medium" style={{ color: "#94a3b8" }}>
            Visão geral de conformidade · Atualizado agora
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 stagger">
          <KPI icon="📊" val={stats.audits}    label="Auditorias realizadas"   trend="▲ +12%" trendUp={true}  />
          <KPI icon="⚠️" val={stats.vulnerabilities} label="Ocorrências detectadas" trend="▼ −8%"  trendUp={true}  />
          <KPI icon="✅" val={`${conformidade}%`}    label="Score de conformidade"  trend="▲ +5pts" trendUp={true}  />
          <KPI icon="🎯" val={risco}            label="Nível de risco"          trend="→ estável" trendUp={null} />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-3 mb-4">
          {/* Bar chart */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-bold" style={{ color: "#0f172a" }}>Auditorias por dia</p>
              <p className="text-[10px] font-mono" style={{ color: "#94a3b8" }}>Últimos 7 dias</p>
            </div>
            <div className="flex items-end gap-1.5" style={{ height: 80 }}>
              {BARS.map(({ d, h }) => (
                <div key={d} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-t-md transition-opacity hover:opacity-75 cursor-pointer"
                    style={{ height: `${h}%`, minHeight: 4, background: h > 80 ? "#2563eb" : h > 50 ? "#93c5fd" : "#dbeafe" }} />
                  <span className="text-[9px] font-bold" style={{ color: "#94a3b8" }}>{d}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Donut */}
          <Card className="p-5">
            <p className="text-[13px] font-bold mb-4" style={{ color: "#0f172a" }}>Por severidade</p>
            <div className="flex flex-col gap-2.5">
              {PROGS.map(({ label, val, pct, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold w-12 flex-shrink-0" style={{ color: "#475569" }}>{label}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "#f1f5f9", overflow: "hidden" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[11px] font-extrabold w-6 text-right" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Alerts */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-bold" style={{ color: "#0f172a" }}>Alertas recentes</p>
              <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => router.push("/alerts")}>
                Ver todos →
              </button>
            </div>
            <div className="flex flex-col">
              {ALERTS.map(({ msg, loc, sev, label }) => (
                <div key={msg} className="flex items-center gap-3 py-2.5" style={{ borderBottom: "1px solid #e2e8f4" }}>
                  <div className="w-[3px] h-9 rounded-full flex-shrink-0"
                    style={{ background: sev === "red" ? "#ef4444" : sev === "amber" ? "#f59e0b" : "#2563eb" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: "#0f172a" }}>{msg}</p>
                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>{loc}</p>
                  </div>
                  <Badge variant={sev}>{label}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick access */}
          <Card className="p-5">
            <p className="text-[13px] font-bold mb-4" style={{ color: "#0f172a" }}>Acesso rápido</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(({ icon, name, hint, href }) => (
                <button key={href} onClick={() => router.push(href)}
                  className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                  style={{ border: "1px solid #e2e8f4", background: "#fff" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#bfdbfe"; (e.currentTarget as HTMLElement).style.background = "#eff6ff"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f4"; (e.currentTarget as HTMLElement).style.background = "#fff"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0"
                    style={{ background: "#f8fafc" }}>{icon}</div>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: "#0f172a" }}>{name}</p>
                    <p className="text-[10px]" style={{ color: "#94a3b8" }}>{hint}</p>
                  </div>
                  <span className="ml-auto text-[16px]" style={{ color: "#94a3b8" }}>›</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
