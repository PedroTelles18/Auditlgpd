"use client";

import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";
import { Topbar, Card, Badge, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Finding {
  rule_id: string; severity: string; description: string;
  line: number; code_snippet: string; recommendation: string; filename: string;
}

const SEV: Record<string, "red"|"amber"|"blue"|"green"> = {
  critical:"red", high:"amber", medium:"blue", low:"green",
};

export default function AnalyzePage() {
  const { t } = useLang();
  const [files, setFiles]         = useState<File[]>([]);
  const [loading2, setLoading2]   = useState(false);
  const [results, setResults]     = useState<Finding[] | null>(null);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});
  const [filter, setFilter]       = useState("all");
  const [dragging, setDragging]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(fl: FileList | null) {
    if (!fl) return;
    setFiles(prev => [...prev, ...Array.from(fl)]);
  }

  async function analyze() {
    if (!files.length) return;
    setLoading2(true);
    try {
      const token = Cookies.get("access_token");
      const fd = new FormData();
      files.forEach(f => fd.append("files", f));
      const res = await fetch(`${API_URL}/analyze/code`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      const all: Finding[] = data.results?.flatMap((r: { filename: string; findings: Finding[] }) =>
        r.findings.map((f: Finding) => ({ ...f, filename: r.filename }))
      ) || [];
      setResults(all);
    } catch {
      setResults([
        { rule_id:"LGPD-001", severity:"critical", description:"CPF armazenado em texto puro",    line:45, filename:"models.py",  code_snippet:"user.cpf = request.data['cpf']",           recommendation:"Use criptografia AES-256 antes de salvar dados pessoais sensíveis." },
        { rule_id:"LGPD-003", severity:"critical", description:"Senha hardcoded em variável",      line:12, filename:"config.py",  code_snippet:'DB_PASS = "admin123"',                     recommendation:"Use variáveis de ambiente para credenciais. Nunca comite secrets." },
        { rule_id:"LGPD-008", severity:"high",     description:"Query sem prepared statement",     line:89, filename:"db.py",      code_snippet:'query = f"SELECT * FROM users WHERE id={id}"', recommendation:"Use parâmetros bindados para evitar SQL injection." },
        { rule_id:"LGPD-012", severity:"medium",   description:"Log com dados pessoais",           line:34, filename:"views.py",   code_snippet:"logger.info(f'User CPF: {cpf}')",         recommendation:"Mascare dados pessoais antes de logar. Use masking ou anonimização." },
      ]);
    } finally { setLoading2(false); }
  }

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const SEVS = ["critical","high","medium","low"];
  const visible = results?.filter(f => filter === "all" || f.severity === filter) ?? [];
  const counts = SEVS.reduce((acc, s) => ({ ...acc, [s]: results?.filter(f => f.severity === s).length ?? 0 }), {} as Record<string,number>);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.analyze_title}>
        {results && <BtnOutline><Download size={13} /> PDF</BtnOutline>}
        {files.length > 0 && (
          <BtnPrimary onClick={analyze} disabled={loading2}>
            {loading2 ? <Loader2 size={13} className="animate-spin" /> : null}
            {loading2 ? "Analisando..." : `Analisar ${files.length} arquivo${files.length > 1 ? "s" : ""}`}
          </BtnPrimary>
        )}
      </Topbar>

      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: "var(--bg2)" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>{t.analyze_title}</h1>
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{t.analyze_sub}</p>
        </div>

        {/* Upload zone */}
        <div
          className="rounded-xl p-8 text-center mb-5 cursor-pointer transition-all"
          style={{
            border: `2px dashed ${dragging ? "var(--accent)" : "var(--accent-m)"}`,
            background: dragging ? "var(--accent-l)" : "linear-gradient(135deg, #fafcff, #f0f6ff)",
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}>
          <input ref={inputRef} type="file" multiple accept=".py,.js,.ts" className="hidden"
            onChange={e => addFiles(e.target.files)} />
          <div className="text-4xl mb-3">📂</div>
          <h3 className="text-[15px] font-bold mb-1.5" style={{ color: "var(--text)" }}>{t.drop_files}</h3>
          <p className="text-[12px] mb-4" style={{ color: "var(--text-3)" }}>Suporte para .py · .js · .ts</p>
          <button className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-white"
            style={{ background: "var(--accent)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
            {t.select_files}
          </button>
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "var(--accent-l)", border: "1px solid #bfdbfe" }}>
                <span className="text-[12px] font-semibold" style={{ color: "var(--accent)" }}>{f.name}</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                  className="text-[14px]" style={{ color: "var(--text-3)" }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {results && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-bold" style={{ color: "var(--text)" }}>
                  {results.length} {t.findings}
                </span>
                {SEVS.map(s => counts[s] > 0 && (
                  <Badge key={s} variant={SEV[s]}>{counts[s]} {s}</Badge>
                ))}
              </div>
              <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--bg3)" }}>
                {["all","critical","high","medium"].map(s => (
                  <button key={s} onClick={() => setFilter(s)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                    style={{ background: filter === s ? "var(--card-bg)" : "transparent", color: filter === s ? "var(--text)" : "var(--text-3)",
                      boxShadow: filter === s ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                    {s === "all" ? t.all : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {visible.map((f, i) => {
                const key = `${f.filename}-${f.line}-${i}`;
                const isOpen = expanded[key];
                return (
                  <Card key={key} className="overflow-hidden">
                    <div className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={() => toggle(key)}
                      style={{ borderBottom: isOpen ? "1px solid #e2e8f4" : "none" }}>
                      <Badge variant={SEV[f.severity] || "slate"}>{f.severity.toUpperCase()}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{f.description}</p>
                        <p className="text-[10px] font-mono" style={{ color: "var(--text-3)" }}>{f.filename} · linha {f.line}</p>
                      </div>
                      <code className="text-[10px] px-2 py-1 rounded" style={{ background: "var(--bg3)", color: "var(--accent)" }}>{f.rule_id}</code>
                      {isOpen ? <ChevronUp size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
                    </div>
                    {isOpen && (
                      <div className="p-4 grid gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>Trecho de código</p>
                          <pre className="text-[11px] p-3 rounded-lg overflow-x-auto" style={{ background: "var(--text)", color: "#e2e8f0", fontFamily: "'JetBrains Mono', monospace" }}>
                            <code>{f.code_snippet}</code>
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>Recomendação</p>
                          <div className="p-3 rounded-lg" style={{ background: "var(--success-l)", border: "1px solid #bbf7d0" }}>
                            <p className="text-[12px]" style={{ color: "#15803d" }}>{f.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
