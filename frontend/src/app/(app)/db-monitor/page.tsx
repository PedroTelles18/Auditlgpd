"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw, ChevronDown, ChevronUp, Wifi, Cpu, HardDrive, Clock, AlertTriangle, CheckCircle, XCircle, Database, Zap, Lock, BarChart2, Server, FileText } from "lucide-react";
import { Topbar, Card, Badge, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }

interface Metric { value: number; history: number[]; }
function mkMetric(val: number): Metric { return { value: val, history: Array.from({ length: 20 }, () => val + rand(-5, 5)) }; }

interface DBState {
  online: boolean;
  uptime: string;
  activeConn: number; maxConn: number;
  latency: Metric; qps: Metric;
  slowQueries: number;
  cpu: Metric; memory: Metric; disk: Metric; io: Metric;
  dbSize: string; tableGrowth: string;
  tables: { name: string; size: string; rows: string; }[];
  locks: number; deadlocks: number; waiting: number;
  replicaOnline: boolean; replicaDelay: string;
  logs: { time: string; level: "info"|"warn"|"error"; msg: string; }[];
  dbAlerts: { msg: string; severity: "critical"|"high"|"medium"; }[];
}

function generateState(): DBState {
  return {
    online: true, uptime: "14d 6h 32m",
    activeConn: randInt(18, 45), maxConn: 100,
    latency: mkMetric(rand(2, 8)), qps: mkMetric(rand(120, 280)),
    slowQueries: randInt(0, 4),
    cpu: mkMetric(rand(20, 55)), memory: mkMetric(rand(60, 80)),
    disk: mkMetric(rand(35, 50)), io: mkMetric(rand(200, 600)),
    dbSize: "2.4 GB", tableGrowth: "+12 MB/dia",
    tables: [
      { name: "audit_history",  size: "842 MB", rows: "1.2M" },
      { name: "users",          size: "128 MB", rows: "4.8K" },
      { name: "code_findings",  size: "614 MB", rows: "890K" },
      { name: "db_findings",    size: "390 MB", rows: "540K" },
      { name: "sessions",       size: "48 MB",  rows: "28K"  },
    ],
    locks: randInt(0, 3), deadlocks: 0, waiting: randInt(0, 2),
    replicaOnline: true, replicaDelay: `${randInt(10, 80)} ms`,
    logs: [
      { time: "14:32:01", level: "info",  msg: "Checkpoint completed: 512 buffers written" },
      { time: "14:28:44", level: "warn",  msg: "Slow query detected (1.8s): SELECT * FROM audit_history WHERE..." },
      { time: "14:21:17", level: "info",  msg: "Autovacuum: table users processed" },
      { time: "14:15:03", level: "error", msg: "Connection timeout from 192.168.1.45" },
      { time: "13:58:30", level: "info",  msg: "Backup snapshot completed successfully" },
    ],
    dbAlerts: [
      { msg: "Memory usage acima de 75%", severity: "medium" },
      { msg: "Query lenta detectada (>1.5s)", severity: "high" },
    ],
  };
}

function Sparkline({ history, color }: { history: number[]; color: string }) {
  const max = Math.max(...history);
  const min = Math.min(...history);
  const range = max - min || 1;
  const pts = history.map((v, i) => `${(i / (history.length - 1)) * 100},${100 - ((v - min) / range) * 100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function Gauge({ value, max = 100, color, size = 72 }: { value: number; max?: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const dashLen = circ * 0.75;
  const dashOffset = dashLen * (1 - pct);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth="8"
        strokeDasharray={`${dashLen} ${circ}`} strokeDashoffset={-circ * 0.125} strokeLinecap="round" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dashLen} ${circ}`} strokeDashoffset={-circ * 0.125 + dashOffset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--text)">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

function ExpandableCard({ title, icon: Icon, iconColor, children, expanded, onToggle, extra }: {
  title: string; icon: React.ElementType; iconColor: string;
  children: React.ReactNode; expanded: boolean; onToggle: () => void; extra?: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={onToggle}
        style={{ borderBottom: expanded ? "1px solid #e2e8f4" : "none" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}18` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <span className="text-[13px] font-bold flex-1" style={{ color: "var(--text)" }}>{title}</span>
        {extra}
        <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
          style={{ background: "var(--bg3)", color: "var(--text-2)" }}>
          {expanded ? <><ChevronUp size={12} />{t.collapse}</> : <><ChevronDown size={12} />{t.expand}</>}
        </button>
      </div>
      {expanded && <div className="p-4">{children}</div>}
    </Card>
  );
}

export default function DBMonitorPage() {
  const { t } = useLang();
  const [db, setDb] = useState<DBState>(generateState());
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    status: true, performance: true, resources: true,
    storage: false, concurrency: false, replication: false, logs: false, dbAlerts: false,
  });

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const refresh = useCallback(() => {
    setDb(prev => ({
      ...prev,
      activeConn: randInt(18, 45),
      latency: { value: rand(2, 8), history: [...prev.latency.history.slice(1), rand(2, 8)] },
      qps: { value: rand(120, 280), history: [...prev.qps.history.slice(1), rand(120, 280)] },
      slowQueries: randInt(0, 4),
      cpu: { value: rand(20, 55), history: [...prev.cpu.history.slice(1), rand(20, 55)] },
      memory: { value: rand(60, 80), history: [...prev.memory.history.slice(1), rand(60, 80)] },
      disk: { value: rand(35, 50), history: [...prev.disk.history.slice(1), rand(35, 50)] },
      io: { value: rand(200, 600), history: [...prev.io.history.slice(1), rand(200, 600)] },
      locks: randInt(0, 3), waiting: randInt(0, 2),
      replicaDelay: `${randInt(10, 80)} ms`,
    }));
    setTick(n => n + 1);
  }, []);

  useEffect(() => {
    const iv = setInterval(refresh, 2000);
    return () => clearInterval(iv);
  }, [refresh]);

  const StatusBadge = ({ online }: { online: boolean }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold"
      style={{ background: online ? "var(--success-l)" : "var(--danger-l)", color: online ? "#15803d" : "var(--danger)" }}>
      <span className="w-2 h-2 rounded-full" style={{ background: online ? "var(--success)" : "var(--danger)",
        animation: online ? "ping 1.2s cubic-bezier(0,0,0.2,1) infinite" : "none" }} />
      {online ? t.status_up : t.status_down}
    </div>
  );

  const connPct = Math.round((db.activeConn / db.maxConn) * 100);
  const connColor = connPct > 80 ? "var(--danger)" : connPct > 60 ? "var(--warning)" : "var(--success)";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.monitor_title}>
        <BtnOutline onClick={refresh}>
          <RefreshCw size={13} /> Atualizar
        </BtnOutline>
        <div className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg"
          style={{ background: "var(--success-l)", color: "#15803d", border: "1px solid #bbf7d0" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live · {tick > 0 ? "atualizado agora" : "conectando..."}
        </div>
      </Topbar>

      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: "var(--bg2)" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
            {t.monitor_title}
          </h1>
          <p className="text-[12px] font-medium" style={{ color: "var(--text-3)" }}>{t.monitor_sub}</p>
        </div>

        <div className="flex flex-col gap-3">

          {/* ── STATUS GERAL ── */}
          <ExpandableCard title="Status Geral do Banco" icon={Server} iconColor="var(--accent)"
            expanded={expanded.status} onToggle={() => toggle("status")}
            extra={<StatusBadge online={db.online} />}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: t.status_up, val: db.online ? "Ativo" : "Inativo", icon: db.online ? CheckCircle : XCircle, color: db.online ? "var(--success)" : "var(--danger)" },
                { label: t.uptime, val: db.uptime, icon: Clock, color: "var(--accent)" },
                { label: t.active_conn, val: `${db.activeConn} / ${db.maxConn}`, icon: Wifi, color: connColor },
                { label: "Taxa de conexão", val: `${connPct}%`, icon: BarChart2, color: connColor },
              ].map(({ label, val, icon: Icon, color }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid #e2e8f4" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} style={{ color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{label}</span>
                  </div>
                  <div className="text-[18px] font-extrabold" style={{ color: "var(--text)" }}>{val}</div>
                </div>
              ))}
            </div>
            {/* Connection bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                <span>Uso de conexões ({db.activeConn}/{db.maxConn})</span>
                <span style={{ color: connColor }}>{connPct}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${connPct}%`, background: connColor }} />
              </div>
            </div>
          </ExpandableCard>

          {/* ── PERFORMANCE ── */}
          <ExpandableCard title="Performance & Queries" icon={Zap} iconColor="var(--warning)"
            expanded={expanded.performance} onToggle={() => toggle("performance")}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: t.avg_latency, val: `${db.latency.value.toFixed(1)} ms`, history: db.latency.history, color: db.latency.value > 6 ? "var(--danger)" : "var(--success)", max: 10 },
                { label: t.qps,         val: `${Math.round(db.qps.value)}`,         history: db.qps.history, color: "var(--accent)", max: 300 },
                { label: t.slow_queries,val: `${db.slowQueries}`,                   history: db.qps.history.map(() => db.slowQueries), color: db.slowQueries > 2 ? "var(--danger)" : "var(--warning)", max: 10 },
              ].map(({ label, val, history, color }) => (
                <div key={label} className="rounded-xl p-4" style={{ background: "var(--bg2)", border: "1px solid #e2e8f4" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{label}</span>
                    <span className="text-[14px] font-extrabold" style={{ color: "var(--text)" }}>{val}</span>
                  </div>
                  <Sparkline history={history} color={color} />
                </div>
              ))}
            </div>
            {/* Top queries */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f4" }}>
              <div className="px-4 py-2.5" style={{ background: "var(--bg2)", borderBottom: "1px solid #e2e8f4" }}>
                <span className="text-[11px] font-bold" style={{ color: "var(--text)" }}>Queries mais pesadas</span>
              </div>
              {[
                { query: "SELECT * FROM audit_history WHERE user_id = $1 ORDER BY created_at DESC", time: "1.82s", calls: 234 },
                { query: "INSERT INTO code_findings (audit_id, rule_id, severity, ...) VALUES (...)", time: "0.94s", calls: 891 },
                { query: "UPDATE users SET updated_at = NOW() WHERE id = $1", time: "0.31s", calls: 1204 },
              ].map(({ query, time, calls }) => (
                <div key={query} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <code className="text-[10px] flex-1 truncate" style={{ color: "var(--accent)" }}>{query}</code>
                  <span className="text-[11px] font-extrabold flex-shrink-0" style={{ color: "var(--warning)" }}>{time}</span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-3)" }}>{calls}x</span>
                </div>
              ))}
            </div>
          </ExpandableCard>

          {/* ── RECURSOS ── */}
          <ExpandableCard title="Uso de Recursos (CPU · Memória · Disco · I/O)" icon={Cpu} iconColor="#7c3aed"
            expanded={expanded.resources} onToggle={() => toggle("resources")}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t.cpu_usage,    metric: db.cpu,    color: db.cpu.value > 80 ? "var(--danger)" : db.cpu.value > 60 ? "var(--warning)" : "var(--success)" },
                { label: t.memory_usage, metric: db.memory, color: db.memory.value > 85 ? "var(--danger)" : db.memory.value > 70 ? "var(--warning)" : "var(--accent)" },
                { label: t.disk_usage,   metric: db.disk,   color: db.disk.value > 85 ? "var(--danger)" : db.disk.value > 70 ? "var(--warning)" : "var(--success)" },
                { label: t.io_ops,       metric: db.io,     color: "#7c3aed", isRaw: true },
              ].map(({ label, metric, color, isRaw }) => (
                <div key={label} className="rounded-xl p-4 flex flex-col items-center" style={{ background: "var(--bg2)", border: "1px solid #e2e8f4" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-3)" }}>{label}</span>
                  {isRaw ? (
                    <>
                      <div className="text-[22px] font-extrabold mb-1" style={{ color }}>{Math.round(metric.value)}</div>
                      <div className="text-[10px]" style={{ color: "var(--text-3)" }}>ops/seg</div>
                    </>
                  ) : (
                    <Gauge value={metric.value} color={color} />
                  )}
                  <div className="w-full mt-2">
                    <Sparkline history={metric.history} color={color} />
                  </div>
                </div>
              ))}
            </div>
          </ExpandableCard>

          {/* ── ARMAZENAMENTO ── */}
          <ExpandableCard title="Armazenamento & Crescimento" icon={HardDrive} iconColor="var(--success)"
            expanded={expanded.storage} onToggle={() => toggle("storage")}>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: t.db_size, val: db.dbSize, sub: "PostgreSQL" },
                { label: "Crescimento", val: db.tableGrowth, sub: "Média diária" },
                { label: "Espaço livre", val: "47.6 GB", sub: "Volume total: 80 GB" },
              ].map(({ label, val, sub }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ background: "var(--bg2)", border: "1px solid #e2e8f4" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text-3)" }}>{label}</div>
                  <div className="text-[20px] font-extrabold" style={{ color: "var(--text)" }}>{val}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-3)" }}>{sub}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f4" }}>
              <div className="px-4 py-2.5" style={{ background: "var(--bg2)", borderBottom: "1px solid #e2e8f4" }}>
                <span className="text-[11px] font-bold" style={{ color: "var(--text)" }}>{t.table_size}</span>
              </div>
              <table className="privyon-table w-full">
                <thead><tr><th>{t.table}</th><th>{t.size}</th><th>{t.rows}</th></tr></thead>
                <tbody>
                  {db.tables.map(({ name, size, rows }) => (
                    <tr key={name}>
                      <td><code className="text-[11px]" style={{ color: "var(--accent)" }}>{name}</code></td>
                      <td className="font-semibold">{size}</td>
                      <td style={{ color: "var(--text-3)" }}>{rows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ExpandableCard>

          {/* ── CONCORRÊNCIA ── */}
          <ExpandableCard title="Concorrência & Locks" icon={Lock} iconColor="var(--warning)"
            expanded={expanded.concurrency} onToggle={() => toggle("concurrency")}
            extra={db.locks > 0 ? <Badge variant="amber">{db.locks} locks</Badge> : <Badge variant="green">OK</Badge>}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t.locks, val: db.locks, icon: "🔒", color: db.locks > 2 ? "var(--danger)" : db.locks > 0 ? "var(--warning)" : "var(--success)" },
                { label: t.deadlocks, val: db.deadlocks, icon: "💀", color: db.deadlocks > 0 ? "var(--danger)" : "var(--success)" },
                { label: t.waiting, val: db.waiting, icon: "⏳", color: db.waiting > 3 ? "var(--danger)" : db.waiting > 0 ? "var(--warning)" : "var(--success)" },
              ].map(({ label, val, icon, color }) => (
                <div key={label} className="rounded-xl p-5 text-center" style={{ background: "var(--bg2)", border: "1px solid #e2e8f4" }}>
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-[26px] font-extrabold mb-1" style={{ color }}>{val}</div>
                  <div className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{label}</div>
                </div>
              ))}
            </div>
          </ExpandableCard>

          {/* ── REPLICAÇÃO ── */}
          <ExpandableCard title="Replicação & Alta Disponibilidade" icon={Activity} iconColor="var(--accent)"
            expanded={expanded.replication} onToggle={() => toggle("replication")}
            extra={<Badge variant={db.replicaOnline ? "green" : "red"}>{db.replicaOnline ? "Réplica OK" : "Réplica Falhou"}</Badge>}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Primário", val: "ONLINE", color: "var(--success)", icon: "🟢" },
                { label: t.replica_status, val: db.replicaOnline ? "ONLINE" : "OFFLINE", color: db.replicaOnline ? "var(--success)" : "var(--danger)", icon: db.replicaOnline ? "🟢" : "🔴" },
                { label: t.replica_delay, val: db.replicaDelay, color: "var(--accent)", icon: "⏱" },
              ].map(({ label, val, color, icon }) => (
                <div key={label} className="rounded-xl p-5 text-center" style={{ background: "var(--bg2)", border: "1px solid #e2e8f4" }}>
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-[18px] font-extrabold mb-1" style={{ color }}>{val}</div>
                  <div className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{label}</div>
                </div>
              ))}
            </div>
          </ExpandableCard>

          {/* ── LOGS ── */}
          <ExpandableCard title="Logs Recentes" icon={FileText} iconColor="var(--text-2)"
            expanded={expanded.logs} onToggle={() => toggle("logs")}>
            <div className="flex flex-col gap-1.5">
              {db.logs.map(({ time, level, msg }) => (
                <div key={time + msg} className="flex items-start gap-3 px-4 py-2.5 rounded-lg"
                  style={{ background: level === "error" ? "var(--danger-l)" : level === "warn" ? "var(--warning-l)" : "var(--bg2)",
                    border: `1px solid ${level === "error" ? "var(--danger-m)" : level === "warn" ? "var(--warning-m)" : "var(--border)"}` }}>
                  <code className="text-[10px] flex-shrink-0 mt-0.5 font-mono" style={{ color: "var(--text-3)" }}>{time}</code>
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded flex-shrink-0`}
                    style={{ background: level === "error" ? "var(--danger-m)" : level === "warn" ? "var(--warning-m)" : "var(--accent-m)",
                      color: level === "error" ? "var(--danger)" : level === "warn" ? "#b45309" : "var(--accent-h)" }}>
                    {level}
                  </span>
                  <code className="text-[11px] flex-1" style={{ color: "var(--text-2)" }}>{msg}</code>
                </div>
              ))}
            </div>
          </ExpandableCard>

          {/* ── ALERTAS ── */}
          <ExpandableCard title="Alertas em Tempo Real" icon={AlertTriangle} iconColor="var(--danger)"
            expanded={expanded.dbAlerts} onToggle={() => toggle("dbAlerts")}
            extra={<Badge variant="red">{db.dbAlerts.length} ativos</Badge>}>
            <div className="flex flex-col gap-2">
              {db.dbAlerts.map(({ msg, severity }) => (
                <div key={msg} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: severity === "critical" ? "var(--danger-l)" : severity === "high" ? "var(--warning-l)" : "var(--success-l)",
                    border: `1px solid ${severity === "critical" ? "var(--danger-m)" : severity === "high" ? "var(--warning-m)" : "var(--success-m)"}` }}>
                  <AlertTriangle size={14} style={{ color: severity === "critical" ? "var(--danger)" : "var(--warning)", flexShrink: 0 }} />
                  <span className="flex-1 text-[12px] font-semibold" style={{ color: "var(--text)" }}>{msg}</span>
                  <Badge variant={severity === "critical" ? "red" : severity === "high" ? "amber" : "green"}>
                    {severity.toUpperCase()}
                  </Badge>
                </div>
              ))}
              {db.dbAlerts.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--success-l)", border: "1px solid #bbf7d0" }}>
                  <CheckCircle size={14} style={{ color: "var(--success)" }} />
                  <span className="text-[12px] font-semibold" style={{ color: "#15803d" }}>Nenhum alerta ativo — sistema estável</span>
                </div>
              )}
            </div>
          </ExpandableCard>

        </div>
      </main>
    </div>
  );
}
