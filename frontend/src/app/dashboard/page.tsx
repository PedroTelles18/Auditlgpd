"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ShieldCheck, FileCode2, Database, LogOut, LayoutDashboard,
  AlertTriangle, CheckCircle2, Activity, FileText, Bell,
  Settings, ChevronRight, TrendingUp, TrendingDown, Zap,
  Clock, RefreshCw, Wifi, WifiOff, Server, Eye, Lock,
  BarChart2, Shield, Menu, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats { audits: number; vulnerabilities: number; last_audit: string | null; }
interface Alert { id: number; type: "critical" | "high" | "medium" | "low"; msg: string; time: string; }
interface DbMetric { label: string; value: string; delta: number; unit: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",          href: "/dashboard" },
  { icon: FileCode2,       label: "Análise de Código",  href: "/analyze" },
  { icon: Database,        label: "Auditoria de Banco", href: "/db-audit" },
  { icon: FileText,        label: "Relatórios",         href: "/dashboard" },
  { icon: Bell,            label: "Alertas",            href: "/dashboard" },
  { icon: Settings,        label: "Configurações",      href: "/dashboard" },
];

const SEV_COLOR: Record<string, string> = {
  critical: "#ff4d6d", high: "#ff8c42", medium: "#ffd166", low: "#00e5ff",
};

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const R = 36; const cx = 48; const cy = 48; const stroke = 10;
  const circ = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4">
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1e2d3d" strokeWidth={stroke} />
        {data.map((d, i) => {
          const dash = (d.value / total) * circ;
          const gap = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none"
              stroke={d.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ / total}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
              transform="rotate(-90 48 48)" />
          );
          offset += d.value;
          return el;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#5c7080" fontSize={8}>total</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] font-mono text-text-dim capitalize">{d.label}</span>
            <span className="text-[11px] font-mono text-white ml-auto font-bold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#00e5ff" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120; const h = 36;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" points={pts} />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - (data[data.length - 1] / max) * h}
        r={3} fill={color} />
    </svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 w-full">
      {data.map(({ label, value }) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-sm transition-all duration-500 relative group"
            style={{ height: `${(value / max) * 64}px`, background: "linear-gradient(to top, #00e5ff, #00e5ff44)", minHeight: 2 }}>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{value}</span>
          </div>
          <span className="text-[8px] font-mono text-text-dim">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({ audits: 0, vulnerabilities: 0, last_audit: null });
  const [dbOnline, setDbOnline] = useState(true);
  const [dbMetrics, setDbMetrics] = useState<DbMetric[]>([
    { label: "Queries/s",    value: "0",    delta: 0,  unit: "q/s" },
    { label: "Latência",     value: "0ms",  delta: 0,  unit: "ms"  },
    { label: "Conexões",     value: "0",    delta: 0,  unit: ""    },
    { label: "Cache Hit",    value: "0%",   delta: 0,  unit: "%"   },
  ]);
  const [cpuHistory, setCpuHistory]       = useState<number[]>([20, 35, 28, 45, 32, 50, 42, 38, 55, 47]);
  const [queryHistory, setQueryHistory]   = useState<number[]>([10, 25, 18, 40, 22, 35, 28, 45, 30, 38]);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, type: "high",     msg: "Coluna 'cpf' sem criptografia detectada",     time: "2m atrás" },
    { id: 2, type: "medium",   msg: "Tabela 'users' sem campo de consentimento",   time: "15m atrás" },
    { id: 3, type: "low",      msg: "Índice exposto em 'email' — risco de enumeração", time: "1h atrás" },
    { id: 4, type: "critical", msg: "Senha em texto plano detectada no schema",    time: "3h atrás" },
  ]);
  const [weeklyData] = useState([
    { label: "Seg", value: randomBetween(2, 8) },
    { label: "Ter", value: randomBetween(3, 10) },
    { label: "Qua", value: randomBetween(1, 7) },
    { label: "Qui", value: randomBetween(4, 12) },
    { label: "Sex", value: randomBetween(2, 9) },
    { label: "Sáb", value: randomBetween(1, 5) },
    { label: "Dom", value: randomBetween(0, 4) },
  ]);

  // Load stats
  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user) {
      setTimeout(() => setVisible(true), 50);
      try {
        const s = JSON.parse(localStorage.getItem("privyon_stats") || "{}");
        setStats({ audits: s.audits || 0, vulnerabilities: s.vulnerabilities || 0, last_audit: s.last_audit || null });
      } catch {}
    }
  }, [user, loading, router]);

  // Simulate real-time DB metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setDbOnline(Math.random() > 0.05);
      setDbMetrics([
        { label: "Queries/s",  value: randomBetween(120, 980).toString(),    delta: randomBetween(-20, 20),  unit: "q/s" },
        { label: "Latência",   value: randomBetween(2, 48) + "ms",           delta: randomBetween(-5, 5),    unit: "ms"  },
        { label: "Conexões",   value: randomBetween(8, 64).toString(),       delta: randomBetween(-3, 3),    unit: ""    },
        { label: "Cache Hit",  value: randomBetween(88, 99) + "%",           delta: randomBetween(-2, 2),    unit: "%"   },
      ]);
      setCpuHistory((prev) => [...prev.slice(-9), randomBetween(20, 90)]);
      setQueryHistory((prev) => [...prev.slice(-9), randomBetween(50, 500)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const conformidade = stats.audits > 0 ? Math.max(0, 100 - Math.round(stats.vulnerabilities / stats.audits) * 5) : 0;
  const donutData = [
    { label: "Crítico",  value: Math.round(stats.vulnerabilities * 0.15), color: "#ff4d6d" },
    { label: "Alto",     value: Math.round(stats.vulnerabilities * 0.30), color: "#ff8c42" },
    { label: "Médio",    value: Math.round(stats.vulnerabilities * 0.35), color: "#ffd166" },
    { label: "Baixo",    value: Math.round(stats.vulnerabilities * 0.20), color: "#00e5ff" },
  ];

  if (loading || !user) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-[#cdd9e5] font-sans flex">
      {/* Grid bg */}
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed top-0 left-0 h-full z-30 flex flex-col border-r border-border transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}
          style={{ width: 220, background: "#070b0f", minHeight: "100vh" }}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 h-[52px] border-b border-border flex-shrink-0">
            <ShieldCheck size={18} className="text-accent" />
            <span className="font-bold text-white tracking-tight text-sm">Priv<span className="text-accent">yon</span></span>
            <button className="ml-auto lg:hidden text-text-dim" onClick={() => setSidebarOpen(false)}><X size={16} /></button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
            {NAV.map(({ icon: Icon, label, href }) => {
              const active = label === "Dashboard";
              return (
                <button key={label} onClick={() => { router.push(href); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all w-full text-left
                    ${active ? "text-white" : "text-text-dim hover:text-white hover:bg-white/[0.04]"}`}
                  style={active ? { background: "#00e5ff11", color: "#fff", border: "none" } : {}}>
                  <Icon size={15} className={active ? "text-accent" : ""} />
                  {label}
                  {active && <div className="ml-auto w-1 h-1 rounded-full bg-accent" />}
                </button>
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
      </>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 border-b border-border flex-shrink-0"
          style={{ height: 52, background: "#070b0fee", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-text-dim hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} />
            </button>
            <div>
              <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest hidden sm:block">Privyon / Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono ${dbOnline ? "text-success" : "text-danger"}`}
              style={{ background: dbOnline ? "#0a1f1266" : "#1a0a0d66", border: `1px solid ${dbOnline ? "#3ddc8444" : "#ff4d6d44"}` }}>
              {dbOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {dbOnline ? "Online" : "Offline"}
            </div>
            <div className="relative">
              <Bell size={15} className="text-text-dim hover:text-white cursor-pointer transition-colors" />
              {alerts.some(a => a.type === "critical") && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-danger" />
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)" }}>

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Visão Geral</h1>
            <p className="text-xs font-mono text-text-dim mt-0.5">
              {stats.last_audit ? `Última auditoria: ${new Date(stats.last_audit).toLocaleString("pt-BR")}` : "Nenhuma auditoria realizada ainda"}
            </p>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Auditorias",        value: stats.audits,         icon: Shield,        color: "#00e5ff", trend: +12 },
              { label: "Vulnerabilidades",  value: stats.vulnerabilities, icon: AlertTriangle, color: "#ff4d6d", trend: -5  },
              { label: "Conformidade",      value: `${conformidade}%`,   icon: CheckCircle2,  color: "#3ddc84", trend: +3  },
              { label: "Risco Geral",       value: conformidade > 70 ? "Baixo" : conformidade > 40 ? "Médio" : "Alto",
                icon: Zap, color: conformidade > 70 ? "#3ddc84" : conformidade > 40 ? "#ffd166" : "#ff4d6d", trend: 0 },
            ].map(({ label, value, icon: Icon, color, trend }) => (
              <div key={label} className="rounded-xl border border-border p-4 relative overflow-hidden group hover:border-[#2a3d52] transition-all"
                style={{ background: "#0b1117" }}>
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-5"
                  style={{ background: color, transform: "translate(30%, -30%)" }} />
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: color + "18", border: `1px solid ${color}30` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  {trend !== 0 && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-mono ${trend > 0 ? "text-success" : "text-danger"}`}>
                      {trend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {Math.abs(trend)}%
                    </div>
                  )}
                </div>
                <div className="text-xl font-bold text-white font-mono">{value}</div>
                <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* ── Row 2: Charts ── */}
          <div className="grid lg:grid-cols-3 gap-4 mb-4">

            {/* Vulnerabilidades por severidade */}
            <div className="rounded-xl border border-border p-5" style={{ background: "#0b1117" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Por Severidade</h3>
                <BarChart2 size={13} className="text-text-dim" />
              </div>
              <DonutChart data={donutData} />
            </div>

            {/* Auditorias da semana */}
            <div className="rounded-xl border border-border p-5" style={{ background: "#0b1117" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Auditorias / Semana</h3>
                <Activity size={13} className="text-accent" />
              </div>
              <BarChart data={weeklyData} />
            </div>

            {/* CPU/Load monitor */}
            <div className="rounded-xl border border-border p-5" style={{ background: "#0b1117" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Carga do Servidor</h3>
                <div className="flex items-center gap-1 text-[9px] font-mono text-success">
                  <RefreshCw size={8} className="animate-spin" /> live
                </div>
              </div>
              <Sparkline data={cpuHistory} color="#00e5ff" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-dim">CPU Usage</span>
                <span className="text-[10px] font-mono text-white">{cpuHistory[cpuHistory.length - 1]}%</span>
              </div>
              <Sparkline data={queryHistory} color="#3ddc84" />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-dim">Queries/s</span>
                <span className="text-[10px] font-mono text-white">{queryHistory[queryHistory.length - 1]}</span>
              </div>
            </div>
          </div>

          {/* ── Row 3: DB Monitor + Alerts ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-4">

            {/* Real-time DB Monitor */}
            <div className="rounded-xl border border-border p-5" style={{ background: "#0b1117" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server size={13} className="text-accent" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Monitor de Banco</h3>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded ${dbOnline ? "text-success" : "text-danger"}`}
                  style={{ background: dbOnline ? "#0a1f1244" : "#1a0a0d44" }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbOnline ? "bg-success animate-pulse" : "bg-danger"}`} />
                  {dbOnline ? "Conectado" : "Desconectado"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {dbMetrics.map(({ label, value, delta }) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: "#ffffff05", border: "1px solid #1e2d3d" }}>
                    <p className="text-[9px] font-mono text-text-dim uppercase mb-1">{label}</p>
                    <p className="text-base font-bold text-white font-mono">{value}</p>
                    <p className={`text-[9px] font-mono ${delta >= 0 ? "text-success" : "text-danger"}`}>
                      {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
                    </p>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/db-audit")}
                className="mt-4 w-full py-2 rounded-lg text-xs font-bold text-black transition-all hover:opacity-90"
                style={{ background: "#00e5ff" }}>
                Iniciar Auditoria
              </button>
            </div>

            {/* Alerts */}
            <div className="rounded-xl border border-border p-5" style={{ background: "#0b1117" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-accent" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Alertas Recentes</h3>
                </div>
                <span className="text-[9px] font-mono text-text-dim">{alerts.length} alertas</span>
              </div>
              <div className="flex flex-col gap-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#ffffff04", border: "1px solid #1e2d3d" }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: SEV_COLOR[a.type] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white leading-tight">{a.msg}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: SEV_COLOR[a.type] + "22", color: SEV_COLOR[a.type] }}>
                          {a.type}
                        </span>
                        <span className="text-[9px] font-mono text-text-dim flex items-center gap-1">
                          <Clock size={7} /> {a.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Row 4: Quick Access ── */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: FileCode2, title: "Análise de Código", desc: "Detecta violações LGPD em Python e JS via AST + regex.", href: "/analyze", label: "Iniciar →" },
              { icon: Database,  title: "Auditoria de Banco", desc: "Conecta e audita seu banco de dados em busca de riscos.", href: "/db-audit", label: "Conectar →" },
              { icon: Lock,      title: "Relatório LGPD",    desc: "Gere relatórios PDF profissionais das auditorias.", href: "/analyze", label: "Gerar →" },
            ].map(({ icon: Icon, title, desc, href, label }) => (
              <div key={title} onClick={() => router.push(href)}
                className="group rounded-xl border border-border p-5 cursor-pointer hover:border-[#2a4a5a] transition-all relative overflow-hidden"
                style={{ background: "#0b1117" }}>
                <div className="absolute top-0 left-1/4 right-1/4 h-px opacity-0 group-hover:opacity-50 transition-all"
                  style={{ background: "linear-gradient(to right, transparent, #00e5ff, transparent)" }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: "#00e5ff10", border: "1px solid #00e5ff20" }}>
                  <Icon size={15} className="text-accent" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                <p className="text-[11px] font-mono text-text-dim leading-relaxed mb-3">{desc}</p>
                <span className="text-[11px] font-mono text-accent group-hover:gap-2 transition-all">{label}</span>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
