"use client";

import { useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import { Topbar, Card, Badge, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";

interface Alert { id: string; sev: "critical"|"high"|"medium"|"low"; title: string; loc: string; time: string; read: boolean; }

const INITIAL: Alert[] = [
  { id:"1", sev:"critical", title:"CPF armazenado sem criptografia",  loc:"models.py:45",  time:"Há 2h",    read:false },
  { id:"2", sev:"critical", title:"Senha hardcoded em variável",       loc:"config.py:12",  time:"Há 2h",    read:false },
  { id:"3", sev:"high",     title:"Query sem prepared statement",      loc:"db.py:89",      time:"Há 3h",    read:false },
  { id:"4", sev:"medium",   title:"Log com dados pessoais",           loc:"views.py:34",   time:"Há 5h",    read:true  },
  { id:"5", sev:"medium",   title:"Sem validação de entrada",          loc:"forms.py:67",   time:"Há 1 dia", read:true  },
  { id:"6", sev:"low",      title:"Campo sem índice (email)",          loc:"schema.sql:23", time:"Há 2 dias",read:true  },
];

const SEV_MAP: Record<Alert["sev"], { variant: "red"|"amber"|"blue"|"green"; label: string }> = {
  critical: { variant:"red",   label:"CRÍTICO" },
  high:     { variant:"amber", label:"ALTO"    },
  medium:   { variant:"blue",  label:"MÉDIO"   },
  low:      { variant:"green", label:"BAIXO"   },
};

const LINE_COLOR: Record<Alert["sev"], string> = {
  critical:"var(--danger)", high:"var(--warning)", medium:"var(--accent)", low:"var(--success)",
};

export default function AlertsPage() {
  const { t } = useLang();
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL);
  const [filter, setFilter] = useState<"all"|Alert["sev"]>("all");

  const markRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  const markAll  = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  const unread   = alerts.filter(a => !a.read).length;

  const FILTERS: { key: "all"|Alert["sev"]; label: string }[] = [
    { key:"all",      label:t.all      },
    { key:"critical", label:t.critical },
    { key:"high",     label:t.high     },
    { key:"medium",   label:t.medium   },
  ];

  const visible = filter === "all" ? alerts : alerts.filter(a => a.sev === filter);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.alerts_title}>
        <BtnOutline onClick={markAll}><CheckCheck size={13} />{t.mark_read}</BtnOutline>
      </Topbar>
      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: "var(--bg2)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>{t.alerts_title}</h1>
            <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{unread} {t.unread}</p>
          </div>
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "var(--bg3)" }}>
            {FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                style={{
                  background: filter === key ? "var(--card-bg)" : "transparent",
                  color: filter === key ? "var(--text)" : "var(--text-3)",
                  boxShadow: filter === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden">
          <table className="privyon-table">
            <thead>
              <tr>
                <th>{t.severity}</th>
                <th>{t.description}</th>
                <th>{t.origin}</th>
                <th>{t.detected}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ id, sev, title, loc, time, read }) => (
                <tr key={id} style={{ opacity: read ? 0.65 : 1 }}>
                  <td><Badge variant={SEV_MAP[sev].variant}>{SEV_MAP[sev].label}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-[3px] h-8 rounded-full flex-shrink-0"
                        style={{ background: LINE_COLOR[sev] }} />
                      <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>{title}</span>
                    </div>
                  </td>
                  <td><code className="text-[10px]" style={{ color: "var(--accent)" }}>{loc}</code></td>
                  <td style={{ color: "var(--text-3)" }}>{time}</td>
                  <td><Badge variant={read ? "green" : "amber"}>{read ? t.resolved : t.open}</Badge></td>
                  <td>
                    {!read && (
                      <button onClick={() => markRead(id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: "var(--bg3)", color: "var(--text-2)" }}
                        title="Marcar como lido">
                        <Check size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
