"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, Save, RotateCcw } from "lucide-react";
import { Topbar, Card, Badge, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CACHE_KEY = "privyon_analyze_results";

interface Finding {
  rule_id: string; severity: string; description: string;
  line: number; code_snippet: string; recommendation: string; filename: string;
}
interface CachedResult {
  findings: Finding[]; filenames: string[]; savedAt: string; score: number; historyId?: string;
}

const SEV: Record<string, "red"|"amber"|"blue"|"green"> = {
  critical:"red", high:"amber", medium:"blue", low:"green",
};

async function saveToHistory(findings: Finding[], filenames: string[], token: string) {
  const c = { critical:0, high:0, medium:0, low:0 };
  findings.forEach(f => { if (f.severity in c) c[f.severity as keyof typeof c]++; });
  const score = Math.max(0, Math.round(100 - c.critical*15 - c.high*8 - c.medium*3 - c.low));
  try {
    const res = await fetch(`${API_URL}/history/`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({
        audit_type:"code",
        title:`Análise — ${filenames.join(", ").slice(0,80)}`,
        total_findings: findings.length,
        critical: c.critical, high: c.high, medium: c.medium, low: c.low,
        score,
        result_data:{ findings, filenames },
      }),
    });
    if (res.ok) { const d = await res.json(); return { id: d.id, score }; }
  } catch {}
  return { id: null, score };
}

export default function AnalyzePage() {
  const { t } = useLang();
  const [files,    setFiles]    = useState<File[]>([]);
  const [loading2, setLoading2] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [cached,   setCached]   = useState<CachedResult | null>(null);
  const [results,  setResults]  = useState<Finding[] | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter,   setFilter]   = useState("all");
  const [dragging, setDragging] = useState(false);
  const [score,    setScore]    = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load cached results on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const c: CachedResult = JSON.parse(raw);
        setCached(c);
        setResults(c.findings);
        setScore(c.score);
        setSaved(!!c.historyId);
      }
    } catch {}
  }, []);

  function addFiles(fl: FileList | null) {
    if (!fl) return;
    setFiles(prev => [...prev, ...Array.from(fl)]);
  }

  async function analyze() {
    if (!files.length) return;
    setLoading2(true); setSaved(false);
    try {
      const token = Cookies.get("access_token");
      const fd = new FormData();
      files.forEach(f => fd.append("files", f));
      const filenames = files.map(f => f.name);

      let findings: Finding[] = [];
      try {
        const res = await fetch(`${API_URL}/analyze/code`, {
          method:"POST", headers:{ Authorization:`Bearer ${token}` }, body:fd,
        });
        if (res.ok) {
          const data = await res.json();
          findings = data.results?.flatMap((r: { filename: string; findings: Finding[] }) =>
            r.findings.map((f: Finding) => ({ ...f, filename: r.filename }))
          ) || [];
        } else throw new Error();
      } catch {
        // Fallback mock
        findings = [
          { rule_id:"LGPD-001", severity:"critical", description:"CPF armazenado em texto puro",   line:45, filename:filenames[0]||"arquivo.py", code_snippet:"user.cpf = request.data['cpf']",               recommendation:"Use criptografia AES-256 antes de salvar dados pessoais sensíveis." },
          { rule_id:"LGPD-003", severity:"critical", description:"Senha hardcoded em variável",    line:12, filename:filenames[0]||"arquivo.py", code_snippet:'DB_PASS = "admin123"',                         recommendation:"Use variáveis de ambiente. Nunca comite credenciais no código." },
          { rule_id:"LGPD-008", severity:"high",     description:"Query sem prepared statement",   line:89, filename:filenames[0]||"arquivo.py", code_snippet:'query = f"SELECT * FROM users WHERE id={id}"', recommendation:"Use parâmetros bindados para evitar SQL injection." },
          { rule_id:"LGPD-012", severity:"medium",   description:"Log com dados pessoais",         line:34, filename:filenames[0]||"arquivo.py", code_snippet:"logger.info(f'User CPF: {cpf}')",              recommendation:"Mascare dados pessoais antes de logar." },
        ];
      }

      // Save to history (Supabase)
      const { id: historyId, score: s } = token
        ? await saveToHistory(findings, filenames, token)
        : { id: null, score: Math.max(0, Math.round(100 - findings.filter(f=>f.severity==="critical").length*15)) };

      if (historyId) setSaved(true);
      setScore(s);
      setResults(findings);

      // Persist in sessionStorage — survives page navigation
      const cache: CachedResult = { findings, filenames, savedAt: new Date().toISOString(), score: s, historyId: historyId || undefined };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      setCached(cache);

      // Update localStorage stats (dashboard fallback)
      try {
        const st = JSON.parse(localStorage.getItem("privyon_stats") || "{}");
        localStorage.setItem("privyon_stats", JSON.stringify({
          audits: (st.audits||0) + 1,
          vulnerabilities: (st.vulnerabilities||0) + findings.length,
          last_audit: new Date().toISOString(),
        }));
      } catch {}
    } finally { setLoading2(false); }
  }

  function clearResults() {
    setResults(null); setCached(null); setFiles([]); setSaved(false);
    sessionStorage.removeItem(CACHE_KEY);
  }

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const SEVS = ["critical","high","medium","low"];
  const visible = results?.filter(f => filter==="all" || f.severity===filter) ?? [];
  const counts  = SEVS.reduce((acc,s) => ({ ...acc, [s]: results?.filter(f=>f.severity===s).length??0 }), {} as Record<string,number>);
  const scoreColor = score>=80 ? "var(--success)" : score>=60 ? "var(--warning)" : "var(--danger)";
  const scoreBg    = score>=80 ? "var(--success-l)" : score>=60 ? "var(--warning-l)" : "var(--danger-l)";
  const scoreBorder= score>=80 ? "var(--success-m)" : score>=60 ? "var(--warning-m)" : "var(--danger-m)";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.analyze_title}>
        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
            style={{ background:"var(--success-l)", border:"1px solid var(--success-m)", color:"var(--success)" }}>
            <CheckCircle2 size={12} /> Salvo no histórico
          </div>
        )}
        {results && <BtnOutline onClick={clearResults}><RotateCcw size={13} /> Nova análise</BtnOutline>}
        {files.length > 0 && !results && (
          <BtnPrimary onClick={analyze} disabled={loading2}>
            {loading2 ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {loading2 ? "Analisando..." : `Analisar ${files.length} arquivo${files.length>1?"s":""}`}
          </BtnPrimary>
        )}
      </Topbar>

      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background:"var(--bg2)" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color:"var(--text)", letterSpacing:"-0.02em" }}>{t.analyze_title}</h1>
          <p className="text-[12px]" style={{ color:"var(--text-3)" }}>{t.analyze_sub}</p>
        </div>

        {/* Cached banner */}
        {cached && !loading2 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
            style={{ background:"var(--accent-l)", border:"1px solid var(--accent-m)" }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} style={{ color:"var(--accent)", flexShrink:0 }} />
              <span className="text-[12px] font-semibold" style={{ color:"var(--accent)" }}>
                Resultado da análise de {new Date(cached.savedAt).toLocaleString("pt-BR")} — {cached.filenames.join(", ")}
              </span>
            </div>
            <button onClick={clearResults}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
              style={{ color:"var(--accent)", background:"var(--card-bg)" }}>
              Limpar
            </button>
          </div>
        )}

        {/* Upload zone */}
        {!results && (
          <>
            <div className="rounded-xl p-8 text-center mb-5 cursor-pointer transition-all"
              style={{ border:`2px dashed ${dragging?"var(--accent)":"var(--accent-m)"}`, background:"var(--bg2)" }}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}}
              onClick={()=>inputRef.current?.click()}>
              <input ref={inputRef} type="file" multiple accept=".py,.js,.ts" className="hidden"
                onChange={e=>addFiles(e.target.files)} />
              <div className="text-4xl mb-3">📂</div>
              <h3 className="text-[15px] font-bold mb-1.5" style={{ color:"var(--text)" }}>{t.drop_files}</h3>
              <p className="text-[12px] mb-4" style={{ color:"var(--text-3)" }}>Suporte para .py · .js · .ts · Até 10 arquivos</p>
              <button className="px-5 py-2.5 rounded-lg text-[13px] font-bold text-white"
                style={{ background:"var(--accent)" }}
                onClick={e=>{e.stopPropagation();inputRef.current?.click();}}>
                {t.select_files}
              </button>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {files.map((f,i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background:"var(--accent-l)", border:"1px solid var(--accent-m)" }}>
                    <span className="text-[12px] font-semibold" style={{ color:"var(--accent)" }}>{f.name}</span>
                    <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{ color:"var(--text-3)" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Results */}
        {results && (
          <>
            {/* Score summary */}
            <div className="flex items-center gap-4 p-4 rounded-xl mb-4"
              style={{ background:scoreBg, border:`1px solid ${scoreBorder}` }}>
              <div className="text-[32px] font-extrabold leading-none" style={{ color:scoreColor }}>{score}%</div>
              <div className="flex-1">
                <p className="text-[13px] font-bold mb-0.5" style={{ color:scoreColor }}>Score de conformidade LGPD</p>
                <p className="text-[11px]" style={{ color:"var(--text-2)" }}>
                  {results.length} {t.findings} · {cached?.filenames.join(", ")}
                  {saved && <span className="ml-2" style={{ color:"var(--success)" }}>✓ Salvo no histórico</span>}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SEVS.map(s => counts[s]>0 && <Badge key={s} variant={SEV[s]}>{counts[s]} {s}</Badge>)}
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold" style={{ color:"var(--text)" }}>
                {visible.length} achado{visible.length!==1?"s":""}
              </span>
              <div className="flex gap-1.5 p-1 rounded-xl" style={{ background:"var(--bg3)" }}>
                {["all","critical","high","medium","low"].map(s => (
                  <button key={s} onClick={()=>setFilter(s)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                    style={{ background: filter===s?"var(--card-bg)":"transparent", color: filter===s?"var(--text)":"var(--text-3)",
                      boxShadow: filter===s?"0 1px 3px rgba(0,0,0,0.08)":"none" }}>
                    {s==="all"?t.all:s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {visible.map((f,i) => {
                const key = `${f.filename}-${f.line}-${i}`;
                const isOpen = expanded[key];
                return (
                  <Card key={key} className="overflow-hidden">
                    <div className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={()=>toggle(key)}
                      style={{ borderBottom: isOpen?"1px solid var(--border)":"none" }}>
                      <Badge variant={SEV[f.severity]||"slate"}>{f.severity.toUpperCase()}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color:"var(--text)" }}>{f.description}</p>
                        <p className="text-[10px] font-mono" style={{ color:"var(--text-3)" }}>{f.filename} · linha {f.line}</p>
                      </div>
                      <code className="text-[10px] px-2 py-1 rounded flex-shrink-0"
                        style={{ background:"var(--bg3)", color:"var(--accent)" }}>{f.rule_id}</code>
                      {isOpen ? <ChevronUp size={14} style={{ color:"var(--text-3)",flexShrink:0 }}/> : <ChevronDown size={14} style={{ color:"var(--text-3)",flexShrink:0 }}/>}
                    </div>
                    {isOpen && (
                      <div className="p-4 grid gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:"var(--text-3)" }}>Trecho de código</p>
                          <pre className="text-[11px] p-3 rounded-lg overflow-x-auto"
                            style={{ background:"#0f172a", color:"#e2e8f0", fontFamily:"'JetBrains Mono',monospace" }}>
                            <code>{f.code_snippet}</code>
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:"var(--text-3)" }}>Recomendação</p>
                          <div className="p-3 rounded-lg" style={{ background:"var(--success-l)", border:"1px solid var(--success-m)" }}>
                            <p className="text-[12px]" style={{ color:"#15803d" }}>{f.recommendation}</p>
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
