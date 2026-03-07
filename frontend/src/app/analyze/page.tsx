"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, LogOut, FileCode2, Upload, X, FileText,
  AlertTriangle, CheckCircle2, Loader2, ArrowLeft, File,
  ChevronRight, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/auth";

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "done" | "error";

interface Finding {
  rule_id: string;
  line: number;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  code_snippet: string;
  recommendation: string;
  analyzer: string;
}

interface AnalysisResult {
  filename: string;
  language: string;
  total_lines: number;
  total_findings: number;
  findings: Finding[];
  analyzed_at: string;
  error?: string;
}

interface AnalysisSummary {
  total_files: number;
  total_findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  results: AnalysisResult[];
}

const SEVERITY_COLOR = {
  critical: { text: "#ff4d6d", bg: "#1a0a0d", border: "#ff4d6d33" },
  high:     { text: "#ff8c42", bg: "#1a110a", border: "#ff8c4233" },
  medium:   { text: "#ffd166", bg: "#1a160a", border: "#ffd16633" },
  low:      { text: "#00e5ff", bg: "#0a1a1f", border: "#00e5ff33" },
};

const ACCEPTED = [".py", ".js", ".ts", ".jsx", ".tsx", ".zip"];

export default function AnalyzePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [results, setResults] = useState<AnalysisSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // ── Drag & Drop ───────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      ACCEPTED.some((ext) => f.name.endsWith(ext))
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).filter((f) =>
      ACCEPTED.some((ext) => f.name.endsWith(ext))
    );
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Simulated analysis (sem backend ainda) ────────────────
  async function runAnalysis() {
    if (!files.length) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg(null);

    // Simula progresso de upload
    for (let i = 0; i <= 40; i += 10) {
      await new Promise((r) => setTimeout(r, 120));
      setProgress(i);
    }

    setStatus("analyzing");

    // Tenta chamar o backend real, senão usa mock
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await api.post<AnalysisSummary>("/analyze/code", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / (e.total || 1)) * 60);
          setProgress(40 + pct);
        },
      });
      setProgress(100);
      setResults(res.data);
      setStatus("done");
    } catch {
      // Backend ainda não implementado — usa resultado mock para demo
      await simulateMock();
    }
  }

  async function simulateMock() {
    for (let i = 40; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }

    const mockResults: AnalysisSummary = {
      total_files: files.length,
      total_findings: 4,
      critical: 1,
      high: 2,
      medium: 1,
      low: 0,
      results: files.map((f) => ({
        filename: f.name,
        language: f.name.endsWith(".py") ? "python" : "javascript",
        total_lines: 120,
        total_findings: 4,
        analyzed_at: new Date().toISOString(),
        findings: [
          {
            rule_id: "LGPD-001",
            line: 12,
            type: "LOG_DADOS_PESSOAIS",
            severity: "critical",
            description: "Log contendo possível CPF/e-mail de usuário sem anonimização.",
            code_snippet: `logger.info(f"Usuário {"{user.cpf}"} realizou login")`,
            recommendation: "Anonimize ou remova dados pessoais de logs.",
            analyzer: "regex",
          },
          {
            rule_id: "LGPD-002",
            line: 34,
            type: "SQL_INJECTION_DADOS_PESSOAIS",
            severity: "critical",
            description: "Query SQL construída com concatenação de string.",
            code_snippet: `query = "SELECT * FROM users WHERE email='" + email + "'"`,
            recommendation: "Use queries parametrizadas (prepared statements).",
            analyzer: "regex",
          },
          {
            rule_id: "LGPD-003",
            line: 58,
            type: "SECRET_HARDCODED",
            severity: "high",
            description: "Chave de API encontrada diretamente no código-fonte.",
            code_snippet: `API_KEY = "sk-prod-abc123xyz789"`,
            recommendation: "Mova segredos para variáveis de ambiente (.env).",
            analyzer: "regex",
          },
          {
            rule_id: "LGPD-004",
            line: 91,
            type: "EXPORT_SEM_ANONIMIZACAO",
            severity: "medium",
            description: "Exportação de dados sem anonimização dos campos pessoais.",
            code_snippet: `df.to_csv("relatorio_usuarios.csv")`,
            recommendation: "Aplique anonimização antes de exportar dados pessoais.",
            analyzer: "regex",
          },
        ],
      })),
    };

    setResults(mockResults);
    setStatus("done");
  }

  function reset() {
    setFiles([]);
    setResults(null);
    setStatus("idle");
    setProgress(0);
    setErrorMsg(null);
  }

  const totalFindings = results?.total_findings ?? 0;
  const criticalCount = results?.critical ?? 0;

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-bg text-[#cdd9e5] font-sans">
      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#1e2d3d 1px, transparent 1px), linear-gradient(90deg, #1e2d3d 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 border-b border-border"
        style={{ height: "52px", background: "#080c10ee", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-accent" />
          <span className="font-bold text-white tracking-tight">
            Audit<span className="text-accent">LGPD</span>
          </span>
          <span className="text-border">|</span>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-xs font-mono text-text-dim hover:text-accent transition-colors"
          >
            <ArrowLeft size={12} />
            Dashboard
          </button>
          <ChevronRight size={12} className="text-border" />
          <span className="text-xs font-mono text-white">Análise de Código</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs font-mono text-accent-soft">{user.name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-text-dim hover:text-danger transition-colors border border-transparent hover:border-[#ff4d6d33]"
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>
      </nav>

      <main className="relative max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <FileCode2 size={16} className="text-accent" />
            <p className="text-xs font-mono text-text-dim uppercase tracking-widest">
              Sprint 2 — Módulo 1
            </p>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Análise de Código-Fonte
          </h1>
          <p className="text-sm font-mono text-text-dim mt-1">
            Detecta violações LGPD via AST + regex em arquivos Python e JavaScript.
          </p>
        </div>

        {/* ── IDLE / UPLOAD STATE ── */}
        {status === "idle" && (
          <>
            {/* Drop zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 py-16 mb-6"
              style={{
                borderColor: dragging ? "#00e5ff" : "#1e2d3d",
                background: dragging ? "#00e5ff08" : "#0d1117",
                boxShadow: dragging ? "0 0 40px #00e5ff0a" : "none",
              }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: dragging ? "#00e5ff22" : "#00e5ff11",
                  border: "1px solid #00e5ff33",
                }}
              >
                <Upload size={24} className="text-accent" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">
                  {dragging ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
                </p>
                <p className="text-xs font-mono text-text-dim">
                  .py · .js · .ts · .jsx · .tsx · .zip (máx. 10MB)
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".py,.js,.ts,.jsx,.tsx,.zip"
                className="hidden"
                onChange={onFileSelect}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden mb-6" style={{ background: "#0d1117" }}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-mono text-text-dim uppercase tracking-wider">
                    {files.length} arquivo{files.length > 1 ? "s" : ""} selecionado{files.length > 1 ? "s" : ""}
                  </span>
                  <button onClick={() => setFiles([])} className="text-xs font-mono text-text-dim hover:text-danger transition-colors">
                    Limpar tudo
                  </button>
                </div>
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <File size={14} className="text-accent flex-shrink-0" />
                      <span className="text-sm text-white font-mono">{f.name}</span>
                      <span className="text-xs text-text-dim">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-text-dim hover:text-danger transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={runAnalysis}
              disabled={!files.length}
              className="w-full py-3.5 rounded-lg font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: files.length ? "#00e5ff" : "#1e2d3d", color: files.length ? "#000" : "#5c7080" }}
              onMouseEnter={(e) => { if (files.length) (e.currentTarget).style.boxShadow = "0 0 24px #00e5ff44"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.boxShadow = "none"; }}
            >
              <ShieldCheck size={15} />
              INICIAR ANÁLISE LGPD
            </button>
          </>
        )}

        {/* ── LOADING STATE ── */}
        {(status === "uploading" || status === "analyzing") && (
          <div
            className="rounded-xl border border-border p-10 flex flex-col items-center gap-6"
            style={{ background: "#0d1117" }}
          >
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin"
                style={{ boxShadow: "0 0 16px #00e5ff44" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {status === "uploading" ? (
                  <Upload size={18} className="text-accent" />
                ) : (
                  <ShieldCheck size={18} className="text-accent" />
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-white mb-1">
                {status === "uploading" ? "Enviando arquivos..." : "Analisando código..."}
              </p>
              <p className="text-xs font-mono text-text-dim">
                {status === "analyzing" ? "Executando regras AST + regex LGPD" : "Aguarde..."}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs font-mono text-text-dim mb-2">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: "#1e2d3d" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #00e5ff, #00e5ff88)",
                    boxShadow: "0 0 8px #00e5ff66",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS STATE ── */}
        {status === "done" && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Arquivos analisados", value: results?.total_files ?? 0, icon: FileText },
                { label: "Total de achados", value: totalFindings, icon: AlertTriangle },
                { label: "Críticos", value: criticalCount, icon: ShieldCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg p-4 border border-border" style={{ background: "#0d1117" }}>
                  <Icon size={14} className="text-text-dim mb-3" />
                  <div className="text-2xl font-bold text-white font-mono mb-1">{value}</div>
                  <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>

            {/* Findings per file */}
            {results?.results.map((result) => (
              <div
                key={result.filename}
                className="rounded-xl border border-border overflow-hidden mb-4"
                style={{ background: "#0d1117" }}
              >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 size={14} className="text-accent" />
                    <span className="text-sm font-bold text-white font-mono">{result.filename}</span>
                  </div>
                  <span className="text-xs font-mono text-text-dim">
                    {result.total_findings} achado{result.total_findings !== 1 ? "s" : ""}
                  </span>
                </div>

                {result.findings.map((f, i) => {
                  const colors = SEVERITY_COLOR[f.severity];
                  return (
                    <div key={i} className="px-5 py-4 border-b border-border last:border-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                          >
                            {f.severity}
                          </span>
                          <span className="text-xs font-mono text-text-dim">{f.type}</span>
                          <span className="text-[10px] font-mono text-text-dim flex items-center gap-1">
                            <Clock size={9} /> linha {f.line}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-[#cdd9e5] mb-2">{f.description}</p>
                      {f.recommendation && (
                        <p className="text-xs font-mono mb-2" style={{ color: "#3ddc84aa" }}>
                          💡 {f.recommendation}
                        </p>
                      )}
                      {f.code_snippet && (
                        <div
                          className="rounded-md px-4 py-2.5 font-mono text-xs overflow-x-auto"
                          style={{ background: "#060a0e", border: "1px solid #1e2d3d", color: "#ff8c42" }}
                        >
                          {f.code_snippet}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-lg text-sm font-bold tracking-wide border border-border text-text-dim hover:text-white hover:border-[#2a3d52] transition-all"
                style={{ background: "#0d1117" }}
              >
                Nova análise
              </button>
              <button
                className="flex-1 py-3 rounded-lg text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all opacity-50 cursor-not-allowed"
                style={{ background: "#1e2d3d", color: "#5c7080" }}
                title="Disponível na Sprint 4"
              >
                <FileText size={14} />
                Exportar PDF
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {status === "error" && (
          <div className="rounded-xl border border-[#ff4d6d33] p-8 text-center" style={{ background: "#0d1117" }}>
            <AlertTriangle size={32} className="text-danger mx-auto mb-3" />
            <p className="text-sm font-bold text-white mb-1">Erro na análise</p>
            <p className="text-xs font-mono text-text-dim mb-5">{errorMsg}</p>
            <button onClick={reset} className="px-6 py-2.5 rounded-lg text-sm font-bold text-black" style={{ background: "#00e5ff" }}>
              Tentar novamente
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
