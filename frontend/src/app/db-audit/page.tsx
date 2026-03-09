"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database, Shield, AlertTriangle, AlertCircle,
  Info, CheckCircle, ChevronDown, ChevronRight,
  Loader2, ArrowLeft, Lock, Server, Download
} from "lucide-react";
import Cookies from "js-cookie";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Finding {
  rule_id: string;
  rule_name: string;
  severity: string;
  description: string;
  article: string;
  table: string;
  column: string | null;
  detail: string;
  recommendation: string | null;
}

interface TableAudit {
  table_name: string;
  total_columns: number;
  personal_data_columns: string[];
  findings: Finding[];
}

interface AuditResult {
  db_type: string;
  db_name: string;
  total_tables: number;
  tables_with_personal_data: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  score: number;
  total_findings: number;
  findings: Finding[];
  table_audits: TableAudit[];
}

const DB_TYPES = [
  { value: "postgresql", label: "PostgreSQL", port: 5432 },
  { value: "mysql", label: "MySQL / MariaDB", port: 3306 },
  { value: "sqlite", label: "SQLite", port: null },
  { value: "sqlserver", label: "SQL Server", port: 1433 },
];

const SEVERITY_CONFIG = {
  critical: { color: "#ff4d6d", bg: "#1a0a0d", icon: AlertCircle, label: "Crítico" },
  high: { color: "#ff8c00", bg: "#1a1000", icon: AlertTriangle, label: "Alto" },
  medium: { color: "#ffd60a", bg: "#1a1600", icon: AlertTriangle, label: "Médio" },
  low: { color: "#00e5ff", bg: "#001a1f", icon: Info, label: "Baixo" },
};

export default function DBauditPage() {
  
  const router = useRouter();
  const token = Cookies.get("access_token");

  const [dbType, setDbType] = useState("postgresql");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connectionString, setConnectionString] = useState("");
  const [useConnString, setUseConnString] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [exportingPdf, setExportingPdf] = useState(false);

  function handleDbTypeChange(type: string) {
    setDbType(type);
    const found = DB_TYPES.find((d) => d.value === type);
    if (found?.port) setPort(String(found.port));
    else setPort("");
  }

  function toggleTable(name: string) {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handleAnalyze() {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const body = useConnString
        ? { db_type: dbType, database, connection_string: connectionString }
        : { db_type: dbType, host, port: port ? parseInt(port) : undefined, database, username, password };

      const res = await fetch(`${API_URL}/db-audit/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Erro ao conectar ao banco");
      }

      const data: AuditResult = await res.json();
      setResult(data);
      try { const s = JSON.parse(localStorage.getItem("privyon_stats") || "{}"); localStorage.setItem("privyon_stats", JSON.stringify({ audits: (s.audits||0)+1, vulnerabilities: (s.vulnerabilities||0)+(data.total_findings||0), last_audit: new Date().toISOString() })); } catch {}
      setExpandedTables(new Set(data.table_audits.map((t) => t.table_name)));
    } catch (err: unknown) {
      setError((err as Error).message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function exportPdf() {
    if (!result) return;
    setExportingPdf(true);
    try {
      const res = await fetch(`${API_URL}/reports/db-audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ audit_data: result, auditor_name: "Privyon" }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `privyon-banco-${new Date().toISOString().slice(0,10)}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert("Erro ao gerar PDF."); } finally { setExportingPdf(false); }
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "#3ddc84";
    if (score >= 60) return "#ffd60a";
    if (score >= 40) return "#ff8c00";
    return "#ff4d6d";
  }

  const isSqlite = dbType === "sqlite";

  return (
    <div className="min-h-screen bg-bg text-white font-mono">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 border-b border-border text-xs text-text-dim"
        style={{ height: 44, background: "#080c10cc", backdropFilter: "blur(10px)" }}>
        <div className="flex items-center gap-4">
          <span className="w-1.5 h-1.5 rounded-full bg-success" style={{ boxShadow: "0 0 6px #3ddc84" }} />
          <span>Privyon — DB Auditor</span>
        </div>
        <div className="flex gap-5">
          <span>LGPD Art. 46</span>
          <span>ISO 27001</span>
        </div>
      </div>

      <div className="pt-14 px-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mt-8 mb-8">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-xs text-text-dim hover:text-accent transition-colors">
            <ArrowLeft size={14} /> Dashboard
          </button>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Database size={16} className="text-accent" />
            <span className="text-sm font-bold text-white">DB Auditor</span>
            <span className="text-xs text-text-dim">// Auditoria de Banco de Dados LGPD</span>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl p-7 mb-6" style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-white">Configuração de Conexão</h2>
            <button onClick={() => setUseConnString(!useConnString)}
              className="text-xs text-accent-soft hover:text-accent transition-colors">
              {useConnString ? "Usar campos manuais" : "Usar connection string"}
            </button>
          </div>

          {/* DB Type */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {DB_TYPES.map((db) => (
              <button key={db.value} onClick={() => handleDbTypeChange(db.value)}
                className="py-2 px-3 rounded-md text-xs transition-all"
                style={{
                  background: dbType === db.value ? "#00e5ff22" : "#0a0f14",
                  border: `1px solid ${dbType === db.value ? "#00e5ff66" : "#1e2d3d"}`,
                  color: dbType === db.value ? "#00e5ff" : "#8b9ab0",
                }}>
                {db.label}
              </button>
            ))}
          </div>

          {useConnString ? (
            <div className="mb-4">
              <label className="block text-xs text-text-dim uppercase tracking-widest mb-2">Connection String</label>
              <input value={connectionString} onChange={(e) => setConnectionString(e.target.value)}
                placeholder="postgresql://user:pass@host:5432/db"
                className="w-full px-3 py-3 rounded-md text-sm text-white placeholder-[#3a4a58] outline-none"
                style={{ background: "#0a0f14", border: "1px solid #1e2d3d" }} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {!isSqlite && (
                <>
                  <div>
                    <label className="block text-xs text-text-dim uppercase tracking-widest mb-2">Host</label>
                    <input value={host} onChange={(e) => setHost(e.target.value)}
                      placeholder="localhost"
                      className="w-full px-3 py-3 rounded-md text-sm text-white placeholder-[#3a4a58] outline-none"
                      style={{ background: "#0a0f14", border: "1px solid #1e2d3d" }} />
                  </div>
                  <div>
                    <label className="block text-xs text-text-dim uppercase tracking-widest mb-2">Porta</label>
                    <input value={port} onChange={(e) => setPort(e.target.value)}
                      placeholder="5432"
                      className="w-full px-3 py-3 rounded-md text-sm text-white placeholder-[#3a4a58] outline-none"
                      style={{ background: "#0a0f14", border: "1px solid #1e2d3d" }} />
                  </div>
                </>
              )}
              <div className={isSqlite ? "col-span-2" : ""}>
                <label className="block text-xs text-text-dim uppercase tracking-widest mb-2">
                  {isSqlite ? "Caminho do arquivo (.db)" : "Banco de Dados"}
                </label>
                <input value={database} onChange={(e) => setDatabase(e.target.value)}
                  placeholder={isSqlite ? "/path/to/database.db" : "nome_do_banco"}
                  className="w-full px-3 py-3 rounded-md text-sm text-white placeholder-[#3a4a58] outline-none"
                  style={{ background: "#0a0f14", border: "1px solid #1e2d3d" }} />
              </div>
              {!isSqlite && (
                <>
                  <div>
                    <label className="block text-xs text-text-dim uppercase tracking-widest mb-2">Usuário</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)}
                      placeholder="postgres"
                      className="w-full px-3 py-3 rounded-md text-sm text-white placeholder-[#3a4a58] outline-none"
                      style={{ background: "#0a0f14", border: "1px solid #1e2d3d" }} />
                  </div>
                  <div className="relative">
                    <label className="block text-xs text-text-dim uppercase tracking-widest mb-2">Senha</label>
                    <div className="relative">
                      <input value={password} onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full px-3 pr-9 py-3 rounded-md text-sm text-white placeholder-[#3a4a58] outline-none"
                        style={{ background: "#0a0f14", border: "1px solid #1e2d3d" }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent">
                        <Lock size={13} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-md text-xs text-danger" style={{ background: "#1a0a0d", border: "1px solid #ff4d6d33" }}>
              {error}
            </div>
          )}

          <button onClick={handleAnalyze} disabled={loading || !database}
            className="mt-5 w-full py-3.5 rounded-md text-black font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: "#00e5ff" }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Conectando e analisando...</> : <><Server size={15} /> INICIAR AUDITORIA</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div>
            {/* Score */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              <div className="col-span-1 rounded-xl p-5 flex flex-col items-center justify-center"
                style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
                <div className="text-4xl font-extrabold mb-1" style={{ color: getScoreColor(result.score) }}>
                  {result.score}
                </div>
                <div className="text-xs text-text-dim uppercase tracking-widest">Score LGPD</div>
              </div>
              {[
                { label: "Crítico", value: result.critical, color: "#ff4d6d" },
                { label: "Alto", value: result.high, color: "#ff8c00" },
                { label: "Médio", value: result.medium, color: "#ffd60a" },
                { label: "Baixo", value: result.low, color: "#00e5ff" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-5 flex flex-col items-center justify-center"
                  style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
                  <div className="text-3xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-text-dim uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Summary info */}
            <div className="rounded-xl p-4 mb-6 flex items-center gap-6 text-xs text-text-dim"
              style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
              <span><span className="text-white font-bold">{result.db_type.toUpperCase()}</span> — {result.db_name}</span>
              <span className="text-border">|</span>
              <span><span className="text-white">{result.total_tables}</span> tabelas analisadas</span>
              <span className="text-border">|</span>
              <span><span className="text-white">{result.tables_with_personal_data}</span> com dados pessoais</span>
              <span className="text-border">|</span>
              <span><span className="text-white">{result.total_findings}</span> violações encontradas</span>
            </div>

            {/* Table audits */}
            {result.table_audits.map((table) => (
              <div key={table.table_name} className="rounded-xl mb-3 overflow-hidden"
                style={{ background: "#0d1117", border: "1px solid #1e2d3d" }}>
                <button onClick={() => toggleTable(table.table_name)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <Database size={14} className="text-accent" />
                    <span className="text-sm font-bold text-white">{table.table_name}</span>
                    <span className="text-xs text-text-dim">{table.total_columns} colunas</span>
                    {table.personal_data_columns.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {table.personal_data_columns.slice(0, 4).map((col) => (
                          <span key={col} className="px-2 py-0.5 rounded text-xs"
                            style={{ background: "#00e5ff11", color: "#00e5ff88", border: "1px solid #00e5ff22" }}>
                            {col}
                          </span>
                        ))}
                        {table.personal_data_columns.length > 4 && (
                          <span className="text-xs text-text-dim">+{table.personal_data_columns.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-danger font-bold">{table.findings.length} violações</span>
                    {expandedTables.has(table.table_name) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>

                {expandedTables.has(table.table_name) && table.findings.length > 0 && (
                  <div className="px-5 pb-4 space-y-3 border-t border-border pt-4">
                    {table.findings.map((f, i) => {
                      const cfg = SEVERITY_CONFIG[f.severity as keyof typeof SEVERITY_CONFIG];
                      const Icon = cfg.icon;
                      return (
                        <div key={i} className="rounded-lg p-4"
                          style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
                          <div className="flex items-start gap-3">
                            <Icon size={14} style={{ color: cfg.color, marginTop: 2, flexShrink: 0 }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-bold" style={{ color: cfg.color }}>{f.rule_id}</span>
                                <span className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                                  style={{ background: `${cfg.color}22`, color: cfg.color }}>
                                  {cfg.label}
                                </span>
                                <span className="text-xs text-text-dim">{f.rule_name}</span>
                                {f.column && (
                                  <span className="text-xs px-2 py-0.5 rounded"
                                    style={{ background: "#ffffff11", color: "#8b9ab0" }}>
                                    coluna: {f.column}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white mb-1">{f.detail}</p>
                              <p className="text-xs text-text-dim mb-2">{f.article}</p>
                              {f.recommendation && (
                                <div className="flex items-start gap-2 p-2 rounded text-xs"
                                  style={{ background: "#ffffff08" }}>
                                  <Shield size={11} className="text-accent mt-0.5 flex-shrink-0" />
                                  <span className="text-text-dim">{f.recommendation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Export PDF Button */}
        {result && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setResult(null); }}
              className="flex-1 py-3 rounded-lg text-sm font-bold border border-border text-text-dim hover:text-white transition-all"
              style={{ background: "#0d1117" }}>
              Nova auditoria
            </button>
            <button
              onClick={exportPdf}
              disabled={exportingPdf}
              className="flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "#00e5ff", color: "#000" }}>
              {exportingPdf
                ? <><Loader2 size={14} className="animate-spin" /> Gerando PDF...</>
                : <><Download size={14} /> Exportar PDF</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
