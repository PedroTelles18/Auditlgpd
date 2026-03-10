"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, LogOut, Bell, ArrowLeft, ChevronRight,
  FileCode2, Database, FileText, Settings, LayoutDashboard,
  AlertTriangle, Clock, CheckCircle2, X, Filter,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Alert {
  id: number;
  type: "critical" | "high" | "medium" | "low";
  category: "code" | "db" | "system";
  msg: string;
  detail: string;
  time: string;
  read: boolean;
}

const SEV_COLOR: Record<string, string> = {
  critical: "#ff4d6d", high: "#ff8c42", medium: "#ffd166", low: "#00e5ff",
};

const INITIAL_ALERTS: Alert[] = [
  { id: 1, type: "critical", category: "db",     msg: "Senha em texto plano detectada",         detail: "Tabela 'users', coluna 'password' armazena senhas sem hash.", time: "2m atrás",  read: false },
  { id: 2, type: "critical", category: "code",   msg: "CPF exposto em log de sistema",           detail: "Arquivo models.py linha 42 — logger.info contém CPF do usuário.", time: "15m atrás", read: false },
  { id: 3, type: "high",     category: "db",     msg: "Coluna 'cpf' sem criptografia",           detail: "Dado pessoal sensível armazenado em texto plano.", time: "1h atrás",  read: false },
  { id: 4, type: "high",     category: "code",   msg: "Chave de API hardcoded no código",        detail: "Arquivo config.py contém API_KEY em texto plano.", time: "2h atrás",  read: true  },
  { id: 5, type: "medium",   category: "db",     msg: "Tabela sem campo de consentimento",       detail: "Tabela 'clientes' não possui registro de consentimento LGPD.", time: "3h atrás",  read: true  },
  { id: 6, type: "medium",   category: "db",     msg: "Ausência de soft delete",                 detail: "Dados pessoais podem ser deletados permanentemente.", time: "5h atrás",  read: true  },
  { id: 7, type: "low",      category: "system", msg: "Índice exposto em coluna 'email'",        detail: "Risco de enumeração de usuários via índice.", time: "1d atrás",  read: true  },
  { id: 8, type: "low",      category: "code",   msg: "Export sem anonimização detectado",       detail: "df.to_csv() sem mascarar campos pessoais.", time: "2d atrás",  read: true  },
];


export default function AlertsPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  function markRead(id: number) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  }
  function dismiss(id: number) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }
  function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }

  const filtered = alerts.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (unreadOnly && a.read) return false;
    return true;
  });
  const unreadCount = alerts.filter((a) => !a.read).length;

  if (loading || !user) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 border-b border-border"
          style={{ height: 52, background: "#070b0fee", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1 text-xs font-mono text-text-dim hover:text-accent transition-colors">
              <ArrowLeft size={12} /> Dashboard
            </button>
            <ChevronRight size={12} className="text-border" />
            <span className="text-xs font-mono text-white">Alertas</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-black" style={{ background: "#ff4d6d" }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-mono text-text-dim hover:text-accent transition-colors">Marcar todos como lidos</button>
          )}
        </header>
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Central de Alertas</h1>
            <p className="text-xs font-mono text-text-dim mt-0.5">Violações LGPD detectadas nas auditorias.</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {(["critical","high","medium","low"] as const).map((sev) => {
              const count = alerts.filter((a) => a.type === sev).length;
              return (
                <button key={sev} onClick={() => setFilter(filter === sev ? "all" : sev)}
                  className={`rounded-xl border p-3 text-left transition-all ${filter === sev ? "border-opacity-60" : "border-border hover:border-[#2a3d52]"}`}
                  style={{ background: filter === sev ? SEV_COLOR[sev] + "15" : "#0b1117", borderColor: filter === sev ? SEV_COLOR[sev] + "60" : undefined }}>
                  <div className="text-lg font-bold font-mono" style={{ color: SEV_COLOR[sev] }}>{count}</div>
                  <div className="text-[9px] font-mono text-text-dim uppercase tracking-wider capitalize">{sev}</div>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Filter size={13} className="text-text-dim" />
            <button onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all ${unreadOnly ? "text-black" : "text-text-dim border border-border hover:border-[#2a3d52]"}`}
              style={unreadOnly ? { background: "#00e5ff" } : { background: "#0b1117" }}>
              Não lidos ({unreadCount})
            </button>
          </div>

          {/* Alerts list */}
          <div className="flex flex-col gap-2">
            {filtered.length === 0 && (
              <div className="rounded-xl border border-border p-10 text-center" style={{ background: "#0b1117" }}>
                <CheckCircle2 size={28} className="text-success mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Nenhum alerta</p>
                <p className="text-xs font-mono text-text-dim mt-1">Tudo limpo com os filtros selecionados.</p>
              </div>
            )}
            {filtered.map((a) => (
              <div key={a.id} onClick={() => markRead(a.id)}
                className={`rounded-xl border p-4 cursor-pointer transition-all hover:border-[#2a3d52] ${!a.read ? "border-l-2" : "border-border"}`}
                style={{ background: "#0b1117", borderLeftColor: !a.read ? SEV_COLOR[a.type] : undefined }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: SEV_COLOR[a.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-white">{a.msg}</span>
                        {!a.read && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] font-mono text-text-dim mb-2">{a.detail}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded tracking-wider"
                          style={{ background: SEV_COLOR[a.type] + "20", color: SEV_COLOR[a.type] }}>{a.type}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded tracking-wider"
                          style={{ background: "#ffffff08", color: "#5c7080" }}>{a.category}</span>
                        <span className="text-[9px] font-mono text-text-dim flex items-center gap-1"><Clock size={8} />{a.time}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(a.id); }}
                    className="text-text-dim hover:text-danger transition-colors flex-shrink-0 mt-0.5">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
