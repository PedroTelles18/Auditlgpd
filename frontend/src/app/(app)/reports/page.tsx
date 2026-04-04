"use client";

import { useEffect, useState } from "react";
import { Download, Filter } from "lucide-react";
import { Topbar, Card, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Report { id: string; type: "code" | "db"; title: string; date: string; findings: number; score: number; }

export default function ReportsPage() {
  const { t } = useLang();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingR, setLoadingR] = useState(true);

  useEffect(() => {
    const token = Cookies.get("access_token");
    fetch(`${API_URL}/history/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Record<string, unknown>[]) => setReports(data.map(r => ({
        id: r.id as string, type: r.audit_type as "code"|"db", title: r.title as string,
        date: r.created_at as string, findings: r.total_findings as number, score: Math.round(r.score as number),
      }))))
      .catch(() => setReports([
        { id: "1", type: "code", title: "Análise — app.py, models.py",  date: "2026-03-10", findings: 4, score: 72 },
        { id: "2", type: "db",   title: "Auditoria — PostgreSQL prod",  date: "2026-03-09", findings: 7, score: 48 },
        { id: "3", type: "code", title: "Análise — routes.ts, auth.ts", date: "2026-03-08", findings: 1, score: 91 },
        { id: "4", type: "db",   title: "Auditoria — MySQL staging",    date: "2026-03-07", findings: 3, score: 81 },
      ]))
      .finally(() => setLoadingR(false));
  }, []);

  const sc = (s: number) => s >= 80 ? "#15803d" : s >= 60 ? "#b45309" : "var(--danger)";
  const sb = (s: number) => s >= 80 ? "var(--success-l)" : s >= 60 ? "var(--warning-l)" : "var(--danger-l)";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.reports_title}>
        <BtnOutline><Filter size={13} />{t.filter}</BtnOutline>
        <BtnPrimary><Download size={13} />{t.export_all}</BtnPrimary>
      </Topbar>
      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: "var(--bg2)" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>{t.reports_title}</h1>
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{t.reports_sub}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5 stagger">
          {[
            { label: t.total_audits,   val: reports.length,                             color: "var(--text)" },
            { label: t.above_70,       val: reports.filter(r => r.score >= 70).length,  color: "#15803d" },
            { label: t.need_attention, val: reports.filter(r => r.score <  70).length,  color: "var(--danger)" },
          ].map(({ label, val, color }) => (
            <Card key={label} className="p-5 card-hover">
              <div className="text-[28px] font-extrabold mb-1" style={{ color, letterSpacing: "-0.03em" }}>{val}</div>
              <div className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{label}</div>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {loadingR
            ? [...Array(4)].map((_, i) => <div key={i} className="skeleton h-[62px] rounded-xl" />)
            : reports.map(({ id, type, title, date, findings, score }) => (
              <div key={id} className="flex items-center gap-4 p-4 bg-white rounded-xl card-hover"
                style={{ border: "1px solid #e2e8f4", boxShadow: "0 1px 3px rgba(15,22,41,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: sb(score) }}>
                  {type === "code" ? "🔍" : "🗄️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{title}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {new Date(date).toLocaleDateString("pt-BR")} · {findings} achado{findings !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-[15px] font-extrabold px-3 py-1.5 rounded-lg flex-shrink-0"
                  style={{ background: sb(score), color: sc(score) }}>{score}%</div>
                <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex-shrink-0"
                  style={{ border: "1px solid #e2e8f4", background: "var(--card-bg)", color: "var(--text-2)" }}>📄 PDF</button>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
