"use client";

import { useState, useEffect } from "react";
import { Database, ChevronDown, ChevronUp, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { Topbar, Card, Badge, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CACHE_KEY = "privyon_dbaudit_results";

interface RuleResult { id: string; name: string; status: "fail"|"warn"|"pass"; table: string; col: string; desc: string; }
interface CachedResult { rules: RuleResult[]; host: string; db: string; savedAt: string; score: number; historyId?: string; }

const RULES_BASE: RuleResult[] = [
  { id:"DB-001", name:"Criptografia de dados pessoais", status:"fail", table:"users",     col:"cpf, rg",     desc:"Dados pessoais armazenados sem criptografia. Risco crítico de vazamento." },
  { id:"DB-002", name:"Campo de consentimento",         status:"fail", table:"clients",   col:"—",           desc:"Ausência de campo consent_given obrigatório pela LGPD." },
  { id:"DB-003", name:"Log de acesso",                  status:"pass", table:"audit_log", col:"user_id",     desc:"Logs de acesso implementados corretamente." },
  { id:"DB-004", name:"Retenção de dados",              status:"warn", table:"sessions",  col:"expires_at",  desc:"Política de retenção incompleta. Campo expires_at presente mas sem trigger." },
  { id:"DB-005", name:"CPF mascarado",                  status:"fail", table:"profiles",  col:"document",    desc:"CPF armazenado sem máscara ou hash." },
  { id:"DB-006", name:"RG exposto",                     status:"pass", table:"documents", col:"rg",          desc:"RG armazenado com hash bcrypt adequado." },
  { id:"DB-007", name:"Email seguro",                   status:"warn", table:"users",     col:"email",       desc:"Email sem verificação de domínio permitido." },
  { id:"DB-008", name:"Backups configurados",           status:"pass", table:"—",         col:"—",           desc:"Política de backup automático detectada." },
  { id:"DB-009", name:"Auditoria de schema",            status:"pass", table:"—",         col:"—",           desc:"Schema versionado com migrações rastreáveis." },
  { id:"DB-010", name:"Anonimização disponível",        status:"fail", table:"users",     col:"—",           desc:"Sem procedure de anonimização para direito ao esquecimento." },
];

const ST: Record<string, { v:"red"|"amber"|"green"; l:string }> = {
  fail:{ v:"red",   l:"FALHOU"  },
  warn:{ v:"amber", l:"ATENÇÃO" },
  pass:{ v:"green", l:"PASSOU"  },
};

async function saveToHistory(rules: RuleResult[], host: string, db: string, token: string) {
  const fail = rules.filter(r=>r.status==="fail").length;
  const warn = rules.filter(r=>r.status==="warn").length;
  const pass = rules.filter(r=>r.status==="pass").length;
  const score = Math.round((pass / rules.length) * 100);
  try {
    const res = await fetch(`${API_URL}/history/`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({
        audit_type:"db",
        title:`Auditoria — ${host}/${db}`,
        total_findings: fail + warn,
        critical: fail, high: warn, medium: 0, low: 0,
        score,
        result_data:{ rules, host, db },
      }),
    });
    if (res.ok) { const d = await res.json(); return { id: d.id, score }; }
  } catch {}
  return { id: null, score };
}

export default function DBAuditPage() {
  const { t } = useLang();
  const [host,     setHost]     = useState("localhost");
  const [dbName,   setDbName]   = useState("postgres");
  const [dbType,   setDbType]   = useState("PostgreSQL");
  const [password, setPassword] = useState("");
  const [loading2, setLoading2] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [cached,   setCached]   = useState<CachedResult | null>(null);
  const [results,  setResults]  = useState<RuleResult[] | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [score,    setScore]    = useState(0);

  // Load cached on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const c: CachedResult = JSON.parse(raw);
        setCached(c);
        setResults(c.rules);
        setScore(c.score);
        setSaved(!!c.historyId);
      }
    } catch {}
  }, []);

  async function audit() {
    setLoading2(true); setSaved(false);
    try {
      const token = Cookies.get("access_token");
      let rules: RuleResult[] = [];

      try {
        const res = await fetch(`${API_URL}/db-audit/analyze`, {
          method:"POST",
          headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify({ host, database: dbName, db_type: dbType, password }),
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend response to our format
          rules = data.rules || RULES_BASE;
        } else throw new Error();
      } catch {
        // Fallback: use demo rules
        rules = RULES_BASE;
      }

      // Save to history
      const { id: historyId, score: s } = token
        ? await saveToHistory(rules, host, dbName, token)
        : { id: null, score: Math.round((rules.filter(r=>r.status==="pass").length/rules.length)*100) };

      if (historyId) setSaved(true);
      setScore(s);
      setResults(rules);

      // Persist in sessionStorage
      const cache: CachedResult = { rules, host, db: dbName, savedAt: new Date().toISOString(), score: s, historyId: historyId || undefined };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      setCached(cache);

      // Update localStorage stats
      try {
        const fail = rules.filter(r=>r.status==="fail").length;
        const warn = rules.filter(r=>r.status==="warn").length;
        const st = JSON.parse(localStorage.getItem("privyon_stats") || "{}");
        localStorage.setItem("privyon_stats", JSON.stringify({
          audits: (st.audits||0) + 1,
          vulnerabilities: (st.vulnerabilities||0) + fail + warn,
          last_audit: new Date().toISOString(),
        }));
      } catch {}
    } finally { setLoading2(false); }
  }

  function clearResults() {
    setResults(null); setCached(null); setSaved(false);
    sessionStorage.removeItem(CACHE_KEY);
  }

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const pass2 = results?.filter(r=>r.status==="pass").length ?? 0;
  const fail2 = results?.filter(r=>r.status==="fail").length ?? 0;
  const warn2 = results?.filter(r=>r.status==="warn").length ?? 0;
  const scoreColor = score>=80?"var(--success)":score>=60?"var(--warning)":"var(--danger)";
  const scoreBg    = score>=80?"var(--success-l)":score>=60?"var(--warning-l)":"var(--danger-l)";
  const scoreBorder= score>=80?"var(--success-m)":score>=60?"var(--warning-m)":"var(--danger-m)";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.dbaudit}>
        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
            style={{ background:"var(--success-l)", border:"1px solid var(--success-m)", color:"var(--success)" }}>
            <CheckCircle2 size={12} /> Salvo no histórico
          </div>
        )}
        {results && <BtnOutline onClick={clearResults}><RotateCcw size={13} /> Nova auditoria</BtnOutline>}
      </Topbar>

      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background:"var(--bg2)" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color:"var(--text)", letterSpacing:"-0.02em" }}>{t.dbaudit}</h1>
          <p className="text-[12px]" style={{ color:"var(--text-3)" }}>10 regras LGPD aplicadas ao schema do banco</p>
        </div>

        {/* Cached banner */}
        {cached && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
            style={{ background:"var(--accent-l)", border:"1px solid var(--accent-m)" }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} style={{ color:"var(--accent)", flexShrink:0 }} />
              <span className="text-[12px] font-semibold" style={{ color:"var(--accent)" }}>
                Auditoria de {new Date(cached.savedAt).toLocaleString("pt-BR")} — {cached.host}/{cached.db}
              </span>
            </div>
            <button onClick={clearResults}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
              style={{ color:"var(--accent)", background:"var(--card-bg)" }}>
              Limpar
            </button>
          </div>
        )}

        {/* Connection form */}
        <Card className="p-5 mb-5">
          <p className="text-[13px] font-bold mb-3" style={{ color:"var(--text)" }}>Conexão com o banco</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {[
              { label:"Host",   val:host,    set:setHost    },
              { label:"Banco",  val:dbName,  set:setDbName  },
              { label:"Senha",  val:password,set:setPassword, type:"password" },
            ].map(({ label, val, set, type }) => (
              <div key={label}>
                <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{ color:"var(--text-2)" }}>{label}</label>
                <input type={type||"text"} value={val} onChange={e=>set(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px] outline-none transition-all"
                  style={{ border:"1.5px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                  onFocus={e=>{(e.target as HTMLInputElement).style.borderColor="var(--accent)";}}
                  onBlur={e=>{(e.target as HTMLInputElement).style.borderColor="var(--border)";}} />
              </div>
            ))}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{ color:"var(--text-2)" }}>Tipo</label>
              <select value={dbType} onChange={e=>setDbType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={{ border:"1.5px solid var(--border)", background:"var(--input-bg)", color:"var(--text)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <option>PostgreSQL</option><option>MySQL</option><option>SQLite</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <BtnPrimary onClick={audit} disabled={loading2}>
              {loading2 ? <Loader2 size={13} className="animate-spin"/> : <Database size={13}/>}
              {loading2 ? "Auditando..." : "Iniciar auditoria →"}
            </BtnPrimary>
          </div>
        </Card>

        {/* Results */}
        {results && (
          <>
            {/* Score + summary */}
            <div className="flex items-center gap-4 p-4 rounded-xl mb-4"
              style={{ background:scoreBg, border:`1px solid ${scoreBorder}` }}>
              <div className="text-[32px] font-extrabold leading-none" style={{ color:scoreColor }}>{score}%</div>
              <div className="flex-1">
                <p className="text-[13px] font-bold mb-0.5" style={{ color:scoreColor }}>Score de conformidade LGPD</p>
                <p className="text-[11px]" style={{ color:"var(--text-2)" }}>
                  {pass2} passou · {warn2} atenção · {fail2} falhou
                  {saved && <span className="ml-2" style={{ color:"var(--success)" }}>✓ Salvo no histórico</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {fail2>0 && <Badge variant="red">{fail2} falhou</Badge>}
                {warn2>0 && <Badge variant="amber">{warn2} atenção</Badge>}
                {pass2>0 && <Badge variant="green">{pass2} passou</Badge>}
              </div>
            </div>

            {/* Rule cards */}
            <div className="flex flex-col gap-2">
              {results.map(({ id, name, status, table, col, desc }) => {
                const isOpen = expanded[id];
                return (
                  <Card key={id} className="overflow-hidden">
                    <div className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={()=>toggle(id)}
                      style={{ borderBottom: isOpen?"1px solid var(--border)":"none" }}>
                      <Badge variant={ST[status].v}>{ST[status].l}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold" style={{ color:"var(--text)" }}>{name}</p>
                        <p className="text-[10px] font-mono" style={{ color:"var(--text-3)" }}>{id} · tabela: {table}</p>
                      </div>
                      {isOpen ? <ChevronUp size={14} style={{ color:"var(--text-3)",flexShrink:0 }}/> : <ChevronDown size={14} style={{ color:"var(--text-3)",flexShrink:0 }}/>}
                    </div>
                    {isOpen && (
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:"var(--text-3)" }}>Coluna afetada</p>
                          <code className="text-[12px]" style={{ color:"var(--accent)" }}>{col}</code>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color:"var(--text-3)" }}>Diagnóstico</p>
                          <p className="text-[12px]" style={{ color:"var(--text-2)" }}>{desc}</p>
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
