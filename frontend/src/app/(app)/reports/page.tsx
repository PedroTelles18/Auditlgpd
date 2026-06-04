"use client";

import { useEffect, useState } from "react";
import { Download, Filter, Trash2, FileText } from "lucide-react";
import { Topbar, Card, BtnPrimary, BtnOutline } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Report {
  id: string;
  audit_type: "code" | "db";
  title: string;
  created_at: string;
  total_findings: number;
  critical: number;
  high: number;
  score: number;
}

export default function ReportsPage() {
  const { t } = useLang();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingR, setLoadingR] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const token = () => Cookies.get("access_token");

  const fetchReports = () => {
    setLoadingR(true);
    fetch(`${API_URL}/history/`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoadingR(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const downloadPdf = async (id: string, title: string) => {
    setDownloading(id);
    try {
      const res = await fetch(`${API_URL}/history/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `privyon-${title.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao baixar o PDF. Tente novamente.");
    } finally {
      setDownloading(null);
    }
  };

  const deleteAudit = async (id: string) => {
    if (!confirm("Remover esta auditoria do histórico?")) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const sc = (s: number) => s >= 80 ? "#15803d" : s >= 60 ? "#b45309" : "var(--danger)";
  const sb = (s: number) => s >= 80 ? "var(--success-l)" : s >= 60 ? "var(--warning-l)" : "var(--danger-l)";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.reports_title}>
        <BtnOutline><Filter size={13} />{t.filter}</BtnOutline>
      </Topbar>
      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: "var(--bg2)" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
            {t.reports_title}
          </h1>
          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{t.reports_sub}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5 stagger">
          {[
            { label: t.total_audits, val: reports.length, color: "var(--text)" },
            { label: t.above_70, val: reports.filter((r) => r.score >= 70).length, color: "#15803d" },
            { label: t.need_attention, val: reports.filter((r) => r.score < 70).length, color: "var(--danger)" },
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
            : reports.length === 0
            ? (
              <div className="text-center py-16" style={{ color: "var(--text-3)" }}>
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-[14px] font-semibold">Nenhuma auditoria realizada ainda</p>
                <p className="text-[12px] mt-1">As auditorias aparecem aqui automaticamente após serem realizadas.</p>
              </div>
            )
            : reports.map(({ id, audit_type, title, created_at, total_findings, critical, score }) => (
              <div
                key={id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl card-hover"
                style={{ border: "1px solid #e2e8f4", boxShadow: "0 1px 3px rgba(15,22,41,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: sb(score) }}
                >
                  {audit_type === "code" ? "🔍" : "🗄️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate" style={{ color: "var(--text)" }}>{title}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {new Date(created_at).toLocaleDateString("pt-BR")} · {total_findings} achado{total_findings !== 1 ? "s" : ""}
                    {critical > 0 && <span style={{ color: "var(--danger)", marginLeft: 6 }}>· {critical} crítico{critical !== 1 ? "s" : ""}</span>}
                  </p>
                </div>
                <div
                  className="text-[15px] font-extrabold px-3 py-1.5 rounded-lg flex-shrink-0"
                  style={{ background: sb(score), color: sc(score) }}
                >
                  {Math.round(score)}%
                </div>
                <button
                  onClick={() => downloadPdf(id, title)}
                  disabled={downloading === id}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex-shrink-0 flex items-center gap-1"
                  style={{ border: "1px solid #e2e8f4", background: "var(--card-bg)", color: "var(--text-2)", opacity: downloading === id ? 0.6 : 1 }}
                >
                  <Download size={12} />
                  {downloading === id ? "..." : "PDF"}
                </button>
                <button
                  onClick={() => deleteAudit(id)}
                  disabled={deleting === id}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: "var(--text-3)", opacity: deleting === id ? 0.4 : 1 }}
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
