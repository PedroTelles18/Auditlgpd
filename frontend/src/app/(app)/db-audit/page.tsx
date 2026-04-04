"use client";
import { useState } from "react";
import { Database, ChevronDown, ChevronUp, Loader2, Download } from "lucide-react";
import { Topbar, Card, Badge, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import Cookies from "js-cookie";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const RULES_DEMO = [
  { id:"DB-001", name:"Criptografia de dados pessoais", status:"fail", table:"users",      col:"cpf, rg",      desc:"Dados pessoais armazenados sem criptografia. Risco crítico de vazamento." },
  { id:"DB-002", name:"Campo de consentimento",         status:"fail", table:"clients",    col:"—",            desc:"Ausência de campo consent_given obrigatório pela LGPD." },
  { id:"DB-003", name:"Log de acesso",                  status:"pass", table:"audit_log",  col:"user_id",      desc:"Logs de acesso implementados corretamente." },
  { id:"DB-004", name:"Retenção de dados",              status:"warn", table:"sessions",   col:"expires_at",   desc:"Política de retenção incompleta. Campo expires_at presente mas sem trigger." },
  { id:"DB-005", name:"CPF mascarado",                  status:"fail", table:"profiles",   col:"document",     desc:"CPF armazenado sem máscara ou hash." },
  { id:"DB-006", name:"RG exposto",                     status:"pass", table:"documents",  col:"rg",           desc:"RG armazenado com hash bcrypt adequado." },
  { id:"DB-007", name:"Email seguro",                   status:"warn", table:"users",      col:"email",        desc:"Email sem verificação de domínio permitido." },
  { id:"DB-008", name:"Backups configurados",           status:"pass", table:"—",          col:"—",            desc:"Política de backup automático detectada." },
  { id:"DB-009", name:"Auditoria de schema",            status:"pass", table:"—",          col:"—",            desc:"Schema versionado com migrações rastreáveis." },
  { id:"DB-010", name:"Anonimização disponível",        status:"fail", table:"users",      col:"—",            desc:"Sem procedure de anonimização para direito ao esquecimento." },
];
const ST:Record<string,{v:"red"|"amber"|"green";l:string}> = {
  fail:{v:"red",l:"FALHOU"}, warn:{v:"amber",l:"ATENÇÃO"}, pass:{v:"green",l:"PASSOU"}
};
export default function DBAuditPage() {
  const { t } = useLang();
  const [host,setHost]=useState("aws-0-us-west-2.pooler.supabase.com");
  const [db2,setDb2]=useState("postgres");
  const [type2,setType2]=useState("PostgreSQL");
  const [loading2,setLoading2]=useState(false);
  const [results,setResults]=useState<typeof RULES_DEMO|null>(null);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  async function audit(){
    setLoading2(true);
    await new Promise(r=>setTimeout(r,1500));
    setResults(RULES_DEMO);
    setLoading2(false);
  }
  const toggle=(id:string)=>setExpanded(p=>({...p,[id]:!p[id]}));
  const pass=results?.filter(r=>r.status==="pass").length??0;
  const fail=results?.filter(r=>r.status==="fail").length??0;
  const warn=results?.filter(r=>r.status==="warn").length??0;
  const score=results?Math.round((pass/(results.length))*100):0;
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.dbaudit}>
        {results&&<BtnOutline><Download size={13}/>PDF</BtnOutline>}
      </Topbar>
      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{background:"#f8fafc"}}>
        <div className="mb-5"><h1 className="text-[20px] font-extrabold mb-0.5" style={{color:"#0f172a",letterSpacing:"-0.02em"}}>{t.dbaudit}</h1><p className="text-[12px]" style={{color:"#94a3b8"}}>10 regras LGPD aplicadas ao schema do banco</p></div>
        <Card className="p-5 mb-5">
          <div className="grid grid-cols-4 gap-3 items-end">
            {[{label:"Host",val:host,set:setHost},{label:"Banco",val:db2,set:setDb2}].map(({label,val,set})=>(
              <div key={label}><label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{color:"#475569"}}>{label}</label>
                <input value={val} onChange={e=>set(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{border:"1.5px solid #e2e8f4",background:"#f8fafc",color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}/>
              </div>
            ))}
            <div><label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{color:"#475569"}}>Tipo</label>
              <select value={type2} onChange={e=>setType2(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{border:"1.5px solid #e2e8f4",background:"#f8fafc",color:"#0f172a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                <option>PostgreSQL</option><option>MySQL</option><option>SQLite</option>
              </select>
            </div>
            <BtnPrimary onClick={audit} disabled={loading2} className="h-[38px] justify-center">
              {loading2?<Loader2 size={13} className="animate-spin"/>:<Database size={13}/>}
              {loading2?"Auditando...":"Auditar →"}
            </BtnPrimary>
          </div>
        </Card>
        {results&&(
          <>
            <div className="grid grid-cols-4 gap-3 mb-5 stagger">
              {[{l:"Score",v:`${score}%`,c:score>=70?"#15803d":"#dc2626"},{l:"Passou",v:pass,c:"#15803d"},{l:"Atenção",v:warn,c:"#b45309"},{l:"Falhou",v:fail,c:"#dc2626"}].map(({l,v,c})=>(
                <Card key={l} className="p-4 card-hover"><div className="text-[24px] font-extrabold mb-0.5" style={{color:c,letterSpacing:"-0.03em"}}>{v}</div><div className="text-[11px] font-semibold" style={{color:"#94a3b8"}}>{l}</div></Card>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {results.map(({id,name,status,table,col,desc})=>{
                const isOpen=expanded[id];
                return(
                  <Card key={id} className="overflow-hidden">
                    <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={()=>toggle(id)} style={{borderBottom:isOpen?"1px solid #e2e8f4":"none"}}>
                      <Badge variant={ST[status].v}>{ST[status].l}</Badge>
                      <div className="flex-1"><p className="text-[13px] font-bold" style={{color:"#0f172a"}}>{name}</p><p className="text-[10px] font-mono" style={{color:"#94a3b8"}}>{id} · tabela: {table}</p></div>
                      {isOpen?<ChevronUp size={14} style={{color:"#94a3b8",flexShrink:0}}/>:<ChevronDown size={14} style={{color:"#94a3b8",flexShrink:0}}/>}
                    </div>
                    {isOpen&&<div className="p-4 grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] font-bold uppercase mb-1" style={{color:"#94a3b8"}}>Coluna afetada</p><code className="text-[12px]" style={{color:"#2563eb"}}>{col}</code></div>
                      <div><p className="text-[10px] font-bold uppercase mb-1" style={{color:"#94a3b8"}}>Diagnóstico</p><p className="text-[12px]" style={{color:"#475569"}}>{desc}</p></div>
                    </div>}
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
