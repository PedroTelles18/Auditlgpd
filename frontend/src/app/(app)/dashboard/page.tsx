"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, Activity, ArrowRight, Database, FileCode2 } from "lucide-react";
import Cookies from "js-cookie";
import { Topbar, Card, Badge, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DEMO_EMAIL = "demo@privyon.com.br";

function rand(a: number, b: number) { return Math.random() * (b - a) + a; }
function randInt(a: number, b: number) { return Math.floor(rand(a, b)); }

interface Stats { audits: number; vulnerabilities: number; last_audit: string | null; }
interface Alert  { msg: string; loc: string; sev: "red"|"amber"|"blue"; label: string; }
interface DBMini { online: boolean; conn: number; latency: number; cpu: number; memory: number; qps: number; slowQ: number; }

// ── Demo data ──────────────────────────────────────────────────────────────────
const DEMO_STATS: Stats    = { audits: 24, vulnerabilities: 87, last_audit: new Date().toISOString() };
const DEMO_ALERTS: Alert[] = [
  { msg: "CPF armazenado sem criptografia",  loc: "models.py · linha 45 · há 2h",    sev: "red",   label: "CRÍTICO" },
  { msg: "Query sem prepared statement",     loc: "db.py · linha 89 · há 3h",        sev: "amber", label: "ALTO"    },
  { msg: "Log com dados pessoais",           loc: "views.py · linha 34 · há 5h",     sev: "blue",  label: "MÉDIO"   },
];
const DEMO_BARS = [
  { d:"Seg",h:40},{ d:"Ter",h:74},{ d:"Qua",h:50},
  { d:"Qui",h:100},{ d:"Sex",h:63},{ d:"Sáb",h:30},{ d:"Dom",h:20},
];
const DEMO_PROGS = [
  { label:"Crítico", val:12, pct:28, color:"var(--danger)"  },
  { label:"Alto",    val:28, pct:48, color:"var(--warning)" },
  { label:"Médio",   val:47, pct:64, color:"var(--accent)"  },
  { label:"Baixo",   val:10, pct:20, color:"var(--success)" },
];
// ──────────────────────────────────────────────────────────────────────────────

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values); const min = Math.min(...values);
  const range = max - min || 1;
  const PAD = 8;
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1)) * 100},${PAD + (1 - (v - min) / range) * (100 - PAD * 2)}`
  ).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width:"100%", height:36 }} overflow="visible">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function MiniGauge({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ background:"var(--bg3)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width:`${Math.min(value,100)}%`, background:color }} />
    </div>
  );
}

// Empty state for real users with no data
function EmptyState({ icon: Icon, title, desc, action, onAction }: {
  icon: React.ElementType; title: string; desc: string; action: string; onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background:"var(--accent-l)", border:"1px solid var(--accent-m)" }}>
        <Icon size={24} style={{ color:"var(--accent)" }} />
      </div>
      <p className="text-[14px] font-bold mb-1" style={{ color:"var(--text)" }}>{title}</p>
      <p className="text-[12px] mb-4 max-w-[220px]" style={{ color:"var(--text-3)" }}>{desc}</p>
      <button onClick={onAction}
        className="px-4 py-2 rounded-lg text-[12px] font-bold text-white transition-all"
        style={{ background:"var(--accent)", boxShadow:"0 2px 8px rgba(37,99,235,0.3)" }}>
        {action}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const router   = useRouter();

  const isDemo = user?.email === DEMO_EMAIL;

  // Stats — real for everyone, demo overrides with fake
  const [stats, setStats]   = useState<Stats>({ audits: 0, vulnerabilities: 0, last_audit: null });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bars, setBars]     = useState<{ d: string; h: number }[]>([]);
  const [progs, setProgs]   = useState<{ label: string; val: number; pct: number; color: string }[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // DB monitor — always simulated (no real DB metrics endpoint yet)
  const [db, setDb] = useState<DBMini>({
    online: false, conn: 0, latency: 0, cpu: 0, memory: 0, qps: 0, slowQ: 0,
  });
  const [dbConnected, setDbConnected] = useState(false);
  const [cpuHist, setCpuHist] = useState<number[]>(Array(20).fill(0));
  const [latHist, setLatHist] = useState<number[]>(Array(20).fill(0));

  // Load real stats
  useEffect(() => {
    if (isDemo) {
      // Demo: inject fake data immediately
      setStats(DEMO_STATS);
      setAlerts(DEMO_ALERTS);
      setBars(DEMO_BARS);
      setProgs(DEMO_PROGS);
      // Simulate connected DB for demo
      setDbConnected(true);
      setCpuHist(Array.from({ length: 20 }, () => rand(25, 55)));
      setLatHist(Array.from({ length: 20 }, () => rand(2, 8)));
      setDb({ online:true, conn:randInt(18,42), latency:parseFloat(rand(2,8).toFixed(1)),
        cpu:parseFloat(rand(25,65).toFixed(1)), memory:parseFloat(rand(58,78).toFixed(1)),
        qps:randInt(140,280), slowQ:randInt(0,3) });
      setLoadingStats(false);
      return;
    }

    // Real account: fetch from backend
    const token = Cookies.get("access_token");
    if (!token) { setLoadingStats(false); return; }

    Promise.all([
      fetch(`${API_URL}/history/stats`,  { headers: { Authorization:`Bearer ${token}` } }),
      fetch(`${API_URL}/history/?limit=3`, { headers: { Authorization:`Bearer ${token}` } }),
    ])
      .then(async ([sRes, hRes]) => {
        if (sRes.ok) {
          const s = await sRes.json();
          setStats({ audits: s.audits, vulnerabilities: s.vulnerabilities, last_audit: s.last_audit });
        }
        if (hRes.ok) {
          const history = await hRes.json();
          // Build alerts from real recent findings
          const realAlerts: Alert[] = history.slice(0, 3).map((r: {
            title: string; audit_type: string; score: number;
          }) => ({
            msg: r.title,
            loc: `${r.audit_type === "code" ? "código" : "banco"} · ${new Date().toLocaleDateString("pt-BR")}`,
            sev: r.score < 50 ? "red" : r.score < 75 ? "amber" : "blue" as "red"|"amber"|"blue",
            label: r.score < 50 ? "CRÍTICO" : r.score < 75 ? "ALTO" : "MÉDIO",
          }));
          setAlerts(realAlerts);

          // Build bar chart from history dates
          const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
          const counts = Array(7).fill(0);
          history.forEach((r: { created_at: string }) => {
            const d = new Date(r.created_at).getDay();
            counts[d] = Math.min(counts[d] + 1, 5);
          });
          const today = new Date().getDay();
          const ordered = Array.from({ length: 7 }, (_, i) => {
            const idx = (today - 6 + i + 7) % 7;
            return { d: days[idx].slice(0,3), h: counts[idx] * 20 || 5 };
          });
          setBars(ordered);

          // Build severity progs from real data
          const critical = history.filter((r: { critical: number }) => (r.critical || 0) > 0).length;
          const high     = history.filter((r: { high: number }) => (r.high || 0) > 0).length;
          const medium   = history.filter((r: { medium: number }) => (r.medium || 0) > 0).length;
          const low      = history.filter((r: { low: number }) => (r.low || 0) > 0).length;
          const total    = Math.max(critical + high + medium + low, 1);
          setProgs([
            { label:"Crítico", val:critical, pct:Math.round(critical/total*100), color:"var(--danger)"  },
            { label:"Alto",    val:high,     pct:Math.round(high/total*100),     color:"var(--warning)" },
            { label:"Médio",   val:medium,   pct:Math.round(medium/total*100),   color:"var(--accent)"  },
            { label:"Baixo",   val:low,      pct:Math.round(low/total*100),      color:"var(--success)" },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [isDemo]);

  // DB monitor refresh — only runs if demo OR if user has connected a DB
  const refreshDB = useCallback(() => {
    if (!isDemo && !dbConnected) return;
    const cpu     = rand(25, 65);
    const latency = rand(2, 9);
    setDb({ online:true, conn:randInt(18,42), latency:parseFloat(latency.toFixed(1)),
      cpu:parseFloat(cpu.toFixed(1)), memory:parseFloat(rand(58,78).toFixed(1)),
      qps:randInt(140,280), slowQ:randInt(0,3) });
    setCpuHist(prev => [...prev.slice(1), cpu]);
    setLatHist(prev => [...prev.slice(1), latency]);
  }, [isDemo, dbConnected]);

  useEffect(() => {
    if (!isDemo && !dbConnected) return;
    const iv = setInterval(refreshDB, 2000);
    return () => clearInterval(iv);
  }, [refreshDB, isDemo, dbConnected]);

  const conformidade = stats.audits > 0
    ? Math.max(0, Math.round(100 - (stats.vulnerabilities / stats.audits) * 5))
    : 0;
  const risco = conformidade >= 80 ? t.low : conformidade >= 60 ? t.medium : t.high;

  const KPIS = [
    { icon:"📊", val:stats.audits,          label:t.audits_done,      trend:"▲ +12%",       trendUp:true  },
    { icon:"⚠️", val:stats.vulnerabilities, label:t.occurrences,      trend:"▼ −8%",         trendUp:true  },
    { icon:"✅", val:`${conformidade}%`,     label:t.compliance_score, trend:"▲ +5pts",       trendUp:true  },
    { icon:"🎯", val:stats.audits > 0 ? risco : "—", label:t.risk_level, trend:`→ ${t.stable}`, trendUp:null },
  ];

  const QUICK = [
    { icon:"🔍", name:t.analyze_code, hint:"Python · JS",               href:"/analyze"   },
    { icon:"🗄️", name:t.audit_db,    hint:"PostgreSQL · MySQL",          href:"/db-audit"  },
    { icon:"📄", name:t.reports,      hint:`${stats.audits} auditorias`, href:"/reports"   },
    { icon:"🔔", name:t.alerts,       hint:`${alerts.length} recentes`,  href:"/alerts"    },
  ];

  const cpuColor  = db.cpu    > 80 ? "var(--danger)" : db.cpu    > 60 ? "var(--warning)" : "var(--success)";
  const memColor  = db.memory > 80 ? "var(--danger)" : db.memory > 70 ? "var(--warning)" : "var(--accent)";
  const latColor  = db.latency > 6 ? "var(--danger)" : db.latency > 4 ? "var(--warning)" : "var(--success)";
  const connColor = db.conn   > 80 ? "var(--danger)" : db.conn   > 60 ? "var(--warning)" : "var(--success)";

  const DBMetric = ({ label, val, color="var(--accent)" }: { label:string; val:string|number; color?:string }) => (
    <div className="rounded-lg p-3" style={{ background:"var(--bg3)", border:"1px solid var(--border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:"var(--text-3)" }}>{label}</p>
      <p className="text-[18px] font-extrabold leading-none" style={{ color, letterSpacing:"-0.02em" }}>{val}</p>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color:"var(--text)", letterSpacing:"-0.02em" }}>
              {t.dash_title}
            </h1>
            <p className="text-[12px] font-medium" style={{ color:"var(--text-3)" }}>
              {isDemo ? "Conta demo — dados de exemplo" : t.dash_sub}
            </p>
          </div>
          {isDemo && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ background:"var(--warning-l)", border:"1px solid var(--warning-m)", color:"var(--warning)" }}>
              ⚠️ Modo Demo — dados simulados
            </div>
          )}
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
                style={{ color:"var(--text)", letterSpacing:"-0.03em" }}>
                {loadingStats ? <div className="skeleton h-8 w-16 rounded" /> : val}
              </div>
              <div className="text-[11px] font-semibold" style={{ color:"var(--text-3)" }}>{label}</div>
            </Card>
          ))}
        </div>

        {/* Charts — only show if has data */}
        {(stats.audits > 0 || isDemo) ? (
          <div className="grid lg:grid-cols-3 gap-3 mb-4">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-bold" style={{ color:"var(--text)" }}>{t.audits_by_day}</p>
                <p className="text-[10px] font-mono" style={{ color:"var(--text-3)" }}>{t.last_7_days}</p>
              </div>
              <div className="flex items-end gap-1.5" style={{ height:80 }}>
                {bars.map(({ d, h }) => (
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
              {progs.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {progs.map(({ label, val, pct, color }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold w-12 flex-shrink-0" style={{ color:"var(--text-2)" }}>{label}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:"var(--bg3)" }}>
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:color }} />
                      </div>
                      <span className="text-[11px] font-extrabold w-6 text-right" style={{ color }}>{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-center py-6" style={{ color:"var(--text-3)" }}>
                  Sem dados ainda
                </p>
              )}
            </Card>
          </div>
        ) : (
          /* No data yet — prompt to start */
          !loadingStats && (
            <div className="grid lg:grid-cols-2 gap-3 mb-4">
              <Card>
                <EmptyState
                  icon={FileCode2}
                  title="Nenhuma análise de código ainda"
                  desc="Envie seus primeiros arquivos .py ou .js para ver os resultados aqui."
                  action="Fazer primeira análise"
                  onAction={() => router.push("/analyze")}
                />
              </Card>
              <Card>
                <EmptyState
                  icon={Database}
                  title="Nenhum banco auditado ainda"
                  desc="Conecte seu PostgreSQL, MySQL ou SQLite para auditar conformidade LGPD."
                  action="Conectar banco de dados"
                  onAction={() => router.push("/db-audit")}
                />
              </Card>
            </div>
          )
        )}

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
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: dbConnected || isDemo ? "var(--success)" : "var(--text-3)",
                      animation: (dbConnected || isDemo) ? "ping 1.2s infinite" : "none" }} />
                  <span className="text-[10px] font-semibold"
                    style={{ color: dbConnected || isDemo ? "var(--success)" : "var(--text-3)" }}>
                    {dbConnected || isDemo ? "ONLINE · Live" : "Aguardando conexão"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/db-monitor")}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg"
              style={{ color:"var(--accent)", border:"1px solid var(--accent-m)", background:"var(--accent-l)" }}>
              Ver detalhes <ArrowRight size={12} />
            </button>
          </div>

          {(dbConnected || isDemo) ? (
            <>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
                <DBMetric label="Conexões"  val={`${db.conn}/100`}              color={connColor} />
                <DBMetric label="Latência"  val={`${db.latency.toFixed(1)} ms`} color={latColor}  />
                <DBMetric label="Queries/s" val={db.qps}                        color="var(--accent)" />
                <DBMetric label="Lentas"    val={db.slowQ}                      color={db.slowQ > 2 ? "var(--danger)" : "var(--warning)"} />
                <DBMetric label="CPU"       val={`${db.cpu.toFixed(0)}%`}       color={cpuColor}  />
                <DBMetric label="Memória"   val={`${db.memory.toFixed(0)}%`}    color={memColor}  />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"CPU %",      hist:cpuHist, val:`${db.cpu.toFixed(0)}%`, color:cpuColor, gaugeVal:db.cpu },
                  { label:"Latência ms",hist:latHist, val:`${db.latency.toFixed(1)} ms`, color:latColor, gaugeVal:db.latency * 10 },
                ].map(({ label, hist, val, color, gaugeVal }) => (
                  <div key={label} className="rounded-lg p-3" style={{ background:"var(--bg3)", border:"1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color:"var(--text-3)" }}>{label}</span>
                      <span className="text-[12px] font-extrabold" style={{ color }}>{val}</span>
                    </div>
                    <MiniSparkline values={hist} color={color} />
                    <MiniGauge value={gaugeVal} color={color} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Real user, DB not connected yet */
            <EmptyState
              icon={Database}
              title="Banco de dados não conectado"
              desc="Conecte seu banco na página de Auditoria para monitorar as métricas em tempo real."
              action="Conectar banco"
              onAction={() => router.push("/db-audit")}
            />
          )}
        </Card>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Alerts */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-bold" style={{ color:"var(--text)" }}>{t.recent_alerts}</p>
              <button className="text-[11px] font-bold" style={{ color:"var(--accent)" }}
                onClick={() => router.push("/alerts")}>
                {t.see_all}
              </button>
            </div>
            {alerts.length > 0 ? (
              <div className="flex flex-col">
                {alerts.map(({ msg, loc, sev, label }) => (
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
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-[13px] font-bold mb-1" style={{ color:"var(--text)" }}>Nenhum alerta</p>
                <p className="text-[12px]" style={{ color:"var(--text-3)" }}>
                  {stats.audits === 0 ? "Faça sua primeira auditoria para ver alertas aqui." : "Sistema sem violações detectadas."}
                </p>
              </div>
            )}
          </Card>

          {/* Quick access */}
          <Card className="p-5">
            <p className="text-[13px] font-bold mb-4" style={{ color:"var(--text)" }}>{t.quick_access}</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(({ icon, name, hint, href }) => (
                <button key={href} onClick={() => router.push(href)}
                  className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                  style={{ border:"1px solid var(--border)", background:"var(--bg2)" }}
                  onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor="var(--accent-m)"; el.style.background="var(--accent-l)"; el.style.transform="translateY(-1px)"; }}
                  onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor="var(--border)"; el.style.background="var(--bg2)"; el.style.transform="translateY(0)"; }}>
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
