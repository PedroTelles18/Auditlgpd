"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, Activity, ArrowRight } from "lucide-react";
import Cookies from "js-cookie";
import { Topbar, Card, Badge, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function rand(a: number, b: number) { return Math.random() * (b - a) + a; }
function randInt(a: number, b: number) { return Math.floor(rand(a, b)); }

interface Stats { audits: number; vulnerabilities: number; last_audit: string | null; }
interface DBMini {
  online: boolean; conn: number; latency: number; cpu: number;
  memory: number; qps: number; slowQ: number;
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values); const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 32 }}>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function MiniGauge({ value, color }: { value: number; color: string }) {
  const pct = Math.min(value / 100, 1);
  return (
    <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLang();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ audits: 0, vulnerabilities: 0, last_audit: null });
  const [db, setDb] = useState<DBMini>({ online: true, conn: 24, latency: 4.2, cpu: 38, memory: 65, qps: 187, slowQ: 1 });
  const [cpuHist, setCpuHist] = useState<number[]>(() => Array.from({ length: 20 }, () => rand(25, 55)));
  const [latHist, setLatHist] = useState<number[]>(() => Array.from({ length: 20 }, () => rand(2, 8)));

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

  // Real-time DB update every 2s
  const refreshDB = useCallback(() => {
    const cpu    = rand(25, 65);
    const latency = rand(2, 9);
    setDb({ online: true, conn: randInt(18, 42), latency: parseFloat(latency.toFixed(1)),
      cpu: parseFloat(cpu.toFixed(1)), memory: parseFloat(rand(58, 78).toFixed(1)),
      qps: randInt(140, 280), slowQ: randInt(0, 3) });
    setCpuHist(prev => [...prev.slice(1), cpu]);
    setLatHist(prev => [...prev.slice(1), latency]);
  }, []);

  useEffect(() => {
    const iv = setInterval(refreshDB, 2000);
    return () => clearInterval(iv);
  }, [refreshDB]);

  const conformidade = stats.audits > 0 ? Math.max(0, Math.round(100 - (stats.vulnerabilities / stats.audits) * 5)) : 0;
  const risco = conformidade >= 80 ? t.low : conformidade >= 60 ? t.medium : t.high;
  const riscoColor = conformidade >= 80 ? "var(--success)" : conformidade >= 60 ? "var(--warning)" : "var(--danger)";

  const KPIS = [
    { icon: "📊", val: stats.audits,            label: t.audits_done,       trend: "▲ +12%", trendUp: true  },
    { icon: "⚠️", val: stats.vulnerabilities,   label: t.occurrences,       trend: "▼ −8%",  trendUp: true  },
    { icon: "✅", val: `${conformidade}%`,       label: t.compliance_score,  trend: "▲ +5pts",trendUp: true  },
    { icon: "🎯", val: risco,                    label: t.risk_level,        trend: `→ ${t.stable}`, trendUp: null },
  ];

  const ALERTS = [
    { msg: "CPF armazenado sem criptografia", loc: "models.py · linha 45 · há 2h", sev: "red"   as const, label: "CRÍTICO" },
    { msg: "Query sem prepared statement",    loc: "db.py · linha 89 · há 3h",     sev: "amber" as const, label: "ALTO"    },
    { msg: "Log com dados pessoais",          loc: "views.py · linha 34 · há 5h",  sev: "blue"  as const, label: "MÉDIO"   },
  ];

  const QUICK = [
    { icon: "🔍", name: t.analyze_code, hint: "Python · JS",             href: "/analyze"  },
    { icon: "🗄️", name: t.audit_db,    hint: "PostgreSQL",               href: "/db-audit" },
    { icon: "📄", name: t.reports,      hint: `${stats.audits} auditorias`, href: "/reports"  },
    { icon: "🔔", name: t.alerts,       hint: "3 não lidos",              href: "/alerts"   },
  ];

  const BARS = [
    { d: "Seg", h: 40 }, { d: "Ter", h: 74 }, { d: "Qua", h: 50 },
    { d: "Qui", h: 100 }, { d: "Sex", h: 63 }, { d: "Sáb", h: 30 }, { d: "Dom", h: 20 },
  ];

  const PROGS = [
    { label: "Crítico", val: 12, pct: 28, color: "var(--danger)"  },
    { label: "Alto",    val: 28, pct: 48, color: "var(--warning)" },
    { label: "Médio",   val: 47, pct: 64, color: "var(--accent)"  },
    { label: "Baixo",   val: 10, pct: 20, color: "var(--success)" },
  ];

  const cpuColor  = db.cpu  > 80 ? "var(--danger)" : db.cpu  > 60 ? "var(--warning)" : "var(--success)";
  const memColor  = db.memory > 80 ? "var(--danger)" : db.memory > 70 ? "var(--warning)" : "var(--accent)";
  const latColor  = db.latency > 6 ? "var(--danger)" : db.latency > 4 ? "var(--warning)" : "var(--success)";
  const connPct   = Math.round((db.conn / 100) * 100);
  const connColor = connPct > 80 ? "var(--danger)" : connPct > 60 ? "var(--warning)" : "var(--success)";

  const DBMetric = ({ label, val, suffix="", color="var(--accent)" }: { label:string; val:string|number; suffix?:string; color?:string }) => (
    <div className="rounded-lg p-3" style={{ background:"var(--bg3)", border:"1px solid var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:"var(--text-3)" }}>{label}</p>
      <p className="text-[18px] font-extrabold leading-none" style={{ color, letterSpacing:"-0.02em" }}>
        {val}<span className="text-[11px] font-semibold ml-0.5" style={{ color:"var(--text-3)" }}>{suffix}</span>
      </p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.dashboard}>
        <BtnOutline onClick={() => router.push("/reports")}>
          <Download size={13} /> {t.export}
        </BtnOutline>
        <BtnPrimary onClick={() => router.push("/analyze")}>
          <Plus size={13} /> {t.new_audit}
        </BtnPrimary>
      </Topbar>

      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background:"var(--bg2)" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color:"var(--text)", letterSpacing:"-0.02em" }}>
            {t.dash_title}
          </h1>
          <p className="text-[12px] font-medium" style={{ color:"var(--text-3)" }}>{t.dash_sub}</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 stagger">
          {KPIS.map(({ icon, val, label, trend, trendUp }) => (
            <Card key={label} className="p-5 card-hover cursor-default">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background:"var(--accent-l)" }}>{icon}</div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full"
                  style={{ background: trendUp === null ? "var(--warning-l)" : "var(--success-l)",
                    color: trendUp === null ? "var(--warning)" : "var(--success)" }}>
                  {trend}
                </span>
              </div>
              <div className="text-[28px] font-extrabold leading-none mb-1"
                style={{ color:"var(--text)", letterSpacing:"-0.03em" }}>{val}</div>
              <div className="text-[11px] font-semibold" style={{ color:"var(--text-3)" }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-3 mb-4">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-bold" style={{ color:"var(--text)" }}>{t.audits_by_day}</p>
              <p className="text-[10px] font-mono" style={{ color:"var(--text-3)" }}>{t.last_7_days}</p>
            </div>
            <div className="flex items-end gap-1.5" style={{ height:80 }}>
              {BARS.map(({ d, h }) => (
                <div key={d} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-t-md transition-opacity hover:opacity-75 cursor-pointer"
                    style={{ height:`${h}%`, minHeight:4,
                      background: h > 80 ? "var(--accent)" : h > 50 ? "var(--accent-m)" : "var(--border)" }} />
                  <span className="text-[9px] font-bold" style={{ color:"var(--text-3)" }}>{d}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-[13px] font-bold mb-4" style={{ color:"var(--text)" }}>{t.by_severity}</p>
            <div className="flex flex-col gap-2.5">
              {PROGS.map(({ label, val, pct, color }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold w-12 flex-shrink-0" style={{ color:"var(--text-2)" }}>{label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:"var(--bg3)" }}>
                    <div className="h-full rounded-full" style={{ width:`${pct}%`, background:color }} />
                  </div>
                  <span className="text-[11px] font-extrabold w-6 text-right" style={{ color }}>{val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── MINI DB MONITOR ── */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background:"var(--accent-l)" }}>
                <Activity size={15} style={{ color:"var(--accent)" }} />
              </div>
              <div>
                <p className="text-[13px] font-bold" style={{ color:"var(--text)" }}>Monitor de Banco</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: db.online ? "var(--success)" : "var(--danger)" }} />
                  <span className="text-[10px] font-semibold" style={{ color: db.online ? "var(--success)" : "var(--danger)" }}>
                    {db.online ? "ONLINE" : "OFFLINE"} · Live
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/db-monitor")}
              className="flex items-center gap-1.5 text-[11px] font-bold transition-colors px-3 py-1.5 rounded-lg"
              style={{ color:"var(--accent)", border:"1px solid var(--accent-m)", background:"var(--accent-l)" }}>
              Ver detalhes <ArrowRight size={12} />
            </button>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
            <DBMetric label="Conexões"   val={`${db.conn}/100`}          color={connColor} />
            <DBMetric label="Latência"   val={db.latency} suffix=" ms"   color={latColor}  />
            <DBMetric label="Queries/s"  val={db.qps}                    color="var(--accent)" />
            <DBMetric label="Lentas"     val={db.slowQ}                  color={db.slowQ > 2 ? "var(--danger)" : "var(--warning)"} />
            <DBMetric label="CPU"        val={`${db.cpu.toFixed(0)}%`}   color={cpuColor}  />
            <DBMetric label="Memória"    val={`${db.memory.toFixed(0)}%`}color={memColor}  />
          </div>

          {/* Mini charts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ background:"var(--bg3)", border:"1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color:"var(--text-3)" }}>CPU %</span>
                <span className="text-[12px] font-extrabold" style={{ color:cpuColor }}>{db.cpu.toFixed(0)}%</span>
              </div>
              <MiniSparkline values={cpuHist} color={cpuColor} />
              <MiniGauge value={db.cpu} color={cpuColor} />
            </div>
            <div className="rounded-lg p-3" style={{ background:"var(--bg3)", border:"1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color:"var(--text-3)" }}>Latência ms</span>
                <span className="text-[12px] font-extrabold" style={{ color:latColor }}>{db.latency.toFixed(1)} ms</span>
              </div>
              <MiniSparkline values={latHist} color={latColor} />
              <MiniGauge value={db.latency * 10} color={latColor} />
            </div>
          </div>
        </Card>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-3">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-bold" style={{ color:"var(--text)" }}>{t.recent_alerts}</p>
              <button className="text-[11px] font-bold transition-colors" style={{ color:"var(--accent)" }}
                onClick={() => router.push("/alerts")}>
                {t.see_all}
              </button>
            </div>
            <div className="flex flex-col">
              {ALERTS.map(({ msg, loc, sev, label }) => (
                <div key={msg} className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom:"1px solid var(--border)" }}>
                  <div className="w-[3px] h-9 rounded-full flex-shrink-0"
                    style={{ background: sev==="red" ? "var(--danger)" : sev==="amber" ? "var(--warning)" : "var(--accent)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color:"var(--text)" }}>{msg}</p>
                    <p className="text-[10px]" style={{ color:"var(--text-3)" }}>{loc}</p>
                  </div>
                  <Badge variant={sev}>{label}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[13px] font-bold mb-4" style={{ color:"var(--text)" }}>{t.quick_access}</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(({ icon, name, hint, href }) => (
                <button key={href} onClick={() => router.push(href)}
                  className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                  style={{ border:"1px solid var(--border)", background:"var(--bg2)" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="var(--accent-m)"; el.style.background="var(--accent-l)"; el.style.transform="translateY(-1px)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor="var(--border)"; el.style.background="var(--bg2)"; el.style.transform="translateY(0)"; }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[16px] flex-shrink-0"
                    style={{ background:"var(--bg3)" }}>{icon}</div>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color:"var(--text)" }}>{name}</p>
                    <p className="text-[10px]" style={{ color:"var(--text-3)" }}>{hint}</p>
                  </div>
                  <span className="ml-auto text-[16px]" style={{ color:"var(--text-3)" }}>›</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
