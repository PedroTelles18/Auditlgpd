"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle2, Eye, EyeOff, Bell, Key, Zap, Moon, Shield, Trash2, FileText, Globe } from "lucide-react";
import { Topbar, Card, BtnPrimary } from "@/components/ui";
import { useLang, Lang } from "@/context/LanguageContext";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en-US", label: "English (US)",        flag: "🇺🇸" },
  { code: "es",    label: "Español",             flag: "🇪🇸" },
];

const INTERVALS = ["realtime","hourly","daily","weekly"] as const;
const MAX_HISTORY = ["10","25","50","100","ilimitado"] as const;

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
      style={{ background: on ? "#2563eb" : "#d1d9e6" }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: on ? "calc(100% - 18px)" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const [saved, setSaved]     = useState(false);
  const [cleared, setCleared] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [prefs, setPrefs] = useState({
    emailAlerts: true, criticalOnly: false, autoReport: false, alertInterval: "realtime",
    groqKey: "", scanOnUpload: true, reportLogo: true, autoSaveHistory: true,
    showLineNumbers: true, maxHistoryItems: "50", compactMode: false,
    anonymizeLogs: false, shareMetrics: false,
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("privyon_prefs") || "{}");
      setPrefs(p => ({ ...p, ...stored }));
    } catch {}
  }, []);

  function set<K extends keyof typeof prefs>(key: K, val: typeof prefs[K]) {
    setPrefs(p => ({ ...p, [key]: val }));
  }

  function save() {
    localStorage.setItem("privyon_prefs", JSON.stringify({ ...prefs, language: lang }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function clearHistory() {
    localStorage.removeItem("privyon_stats");
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  }

  const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 py-4 gap-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: "#0f172a" }}>{label}</p>
        {desc && <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  const Section = ({ icon: Icon, iconColor, title, children }: {
    icon: React.ElementType; iconColor: string; title: string; children: React.ReactNode;
  }) => (
    <Card className="overflow-hidden mb-3">
      <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: "1px solid #e2e8f4", background: "#fafbfe" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}18` }}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <h2 className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: "#0f172a" }}>{title}</h2>
      </div>
      <div>{children}</div>
    </Card>
  );

  const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg outline-none transition-all"
      style={{ border: "1.5px solid #e2e8f4", background: "#f8fafc", color: "#0f172a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {options.map(({ value: v, label }) => <option key={v} value={v}>{label}</option>)}
    </select>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.settings_title}>
        <BtnPrimary onClick={save}>
          {saved ? <><CheckCircle2 size={13} />{t.cleared}</> : <><Save size={13} />{t.save}</>}
        </BtnPrimary>
      </Topbar>

      <main className="flex-1 overflow-y-auto p-6 page-enter pb-10" style={{ background: "#f8fafc" }}>
        <div className="mb-5 max-w-2xl">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>{t.settings_title}</h1>
          <p className="text-[12px]" style={{ color: "#94a3b8" }}>{t.settings_sub}</p>
        </div>

        <div className="max-w-2xl">

          {/* ── IDIOMA ── */}
          <Card className="overflow-hidden mb-3">
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: "1px solid #e2e8f4", background: "#fafbfe" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                <Globe size={13} style={{ color: "#2563eb" }} />
              </div>
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: "#0f172a" }}>{t.language}</h2>
            </div>
            <div className="p-5">
              <p className="text-[12px] mb-3" style={{ color: "#475569" }}>
                Selecione o idioma da interface. A mudança é aplicada imediatamente em todo o sistema.
              </p>
              <div className="flex gap-2 flex-wrap">
                {LANGS.map(({ code, label, flag }) => (
                  <button key={code} onClick={() => setLang(code)}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all"
                    style={{
                      border: lang === code ? "2px solid #2563eb" : "1.5px solid #e2e8f4",
                      background: lang === code ? "#eff6ff" : "#fff",
                      color: lang === code ? "#2563eb" : "#475569",
                      boxShadow: lang === code ? "0 0 0 3px rgba(37,99,235,0.1)" : "none",
                    }}>
                    <span className="text-xl">{flag}</span>
                    <span>{label}</span>
                    {lang === code && <CheckCircle2 size={14} />}
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-3" style={{ color: "#94a3b8" }}>
                Idioma atual: <strong style={{ color: "#0f172a" }}>{LANGS.find(l => l.code === lang)?.label}</strong>
              </p>
            </div>
          </Card>

          {/* ── NOTIFICAÇÕES ── */}
          <Section icon={Bell} iconColor="#2563eb" title={t.notifications}>
            <Row label={t.email_alerts} desc="Receber alertas de violações detectadas">
              <Toggle on={prefs.emailAlerts} onChange={v => set("emailAlerts", v)} />
            </Row>
            <Row label={t.critical_only} desc="Notificar somente severidade crítica">
              <Toggle on={prefs.criticalOnly} onChange={v => set("criticalOnly", v)} />
            </Row>
            <Row label={t.auto_report} desc="Gerar PDF após cada auditoria">
              <Toggle on={prefs.autoReport} onChange={v => set("autoReport", v)} />
            </Row>
            <Row label={t.alert_freq} desc="Com qual frequência receber notificações">
              <Select value={prefs.alertInterval} onChange={v => set("alertInterval", v)}
                options={INTERVALS.map(v => ({ value: v, label: t[v as keyof typeof t] as string }))} />
            </Row>
          </Section>

          {/* ── INTEGRAÇÕES ── */}
          <Section icon={Key} iconColor="#7c3aed" title={t.integrations}>
            <Row label={t.groq_key} desc="Para análise contextual com IA (Llama 3.3 70B)">
              <div className="flex items-center gap-2">
                <input type={showKey ? "text" : "password"} value={prefs.groqKey}
                  onChange={e => set("groqKey", e.target.value)}
                  placeholder="gsk_..."
                  className="w-32 text-[12px] px-2.5 py-1.5 rounded-lg outline-none"
                  style={{ border: "1.5px solid #e2e8f4", background: "#f8fafc", color: "#0f172a", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <button onClick={() => setShowKey(!showKey)} style={{ color: "#94a3b8" }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Row>
          </Section>

          {/* ── AUDITORIA ── */}
          <Section icon={Zap} iconColor="#f59e0b" title={t.audit_prefs}>
            <Row label={t.scan_upload} desc="Iniciar análise ao enviar arquivos">
              <Toggle on={prefs.scanOnUpload} onChange={v => set("scanOnUpload", v)} />
            </Row>
            <Row label={t.report_logo} desc="Incluir logo Privyon no PDF gerado">
              <Toggle on={prefs.reportLogo} onChange={v => set("reportLogo", v)} />
            </Row>
            <Row label={t.save_history} desc="Registrar auditorias no Supabase">
              <Toggle on={prefs.autoSaveHistory} onChange={v => set("autoSaveHistory", v)} />
            </Row>
            <Row label={t.show_lines} desc="Mostrar linha do código com a violação">
              <Toggle on={prefs.showLineNumbers} onChange={v => set("showLineNumbers", v)} />
            </Row>
            <Row label={t.max_history} desc="Quantidade de auditorias salvas">
              <Select value={prefs.maxHistoryItems} onChange={v => set("maxHistoryItems", v)}
                options={MAX_HISTORY.map(v => ({ value: v, label: v }))} />
            </Row>
          </Section>

          {/* ── APARÊNCIA ── */}
          <Section icon={Moon} iconColor="#64748b" title={t.appearance}>
            <Row label={t.compact_mode} desc="Reduzir espaçamento para mais conteúdo visível">
              <Toggle on={prefs.compactMode} onChange={v => set("compactMode", v)} />
            </Row>
          </Section>

          {/* ── PRIVACIDADE ── */}
          <Section icon={Shield} iconColor="#22c55e" title={t.privacy}>
            <Row label={t.anonymize} desc="Mascarar dados sensíveis nos logs de auditoria">
              <Toggle on={prefs.anonymizeLogs} onChange={v => set("anonymizeLogs", v)} />
            </Row>
            <Row label={t.share_metrics} desc="Ajudar a melhorar o Privyon (dados anônimos)">
              <Toggle on={prefs.shareMetrics} onChange={v => set("shareMetrics", v)} />
            </Row>
          </Section>

          {/* ── DADOS ── */}
          <Section icon={Trash2} iconColor="#ef4444" title={t.data}>
            <Row label={t.clear_history} desc="Remove estatísticas salvas no navegador">
              <button onClick={clearHistory}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                style={{
                  background: cleared ? "#f0fdf4" : "#fff",
                  border: `1.5px solid ${cleared ? "#bbf7d0" : "#e2e8f4"}`,
                  color: cleared ? "#15803d" : "#475569",
                }}>
                {cleared ? t.cleared : t.clear}
              </button>
            </Row>
            <Row label={t.export_data} desc="Baixar todas as suas auditorias em JSON">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors"
                style={{ border: "1.5px solid #e2e8f4", background: "#fff", color: "#475569" }}>
                <FileText size={12} />{t.reports}
              </button>
            </Row>
          </Section>

        </div>
      </main>
    </div>
  );
}
