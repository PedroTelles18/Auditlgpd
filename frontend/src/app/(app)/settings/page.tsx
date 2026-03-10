"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, LogOut, Settings, ArrowLeft, ChevronRight,
  FileCode2, Database, FileText, Bell, LayoutDashboard,
  User, Key, Shield, Moon, Globe, Save, CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";


function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
      style={{ background: value ? "#00e5ff" : "#1e2d3d" }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{ background: "white", left: value ? "calc(100% - 18px)" : "2px" }} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    criticalOnly: false,
    autoReport: false,
    darkMode: true,
    language: "pt-BR",
    groqKey: "",
    reportLogo: true,
    scanOnUpload: true,
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    try {
      const saved = JSON.parse(localStorage.getItem("privyon_prefs") || "{}");
      setPrefs((p) => ({ ...p, ...saved }));
    } catch {}
  }, [user, loading, router]);

  function save() {
    localStorage.setItem("privyon_prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function set(key: keyof typeof prefs, value: boolean | string) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  if (loading || !user) return null;

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-border overflow-hidden mb-4" style={{ background: "#0b1117" }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Icon size={14} className="text-accent" />
        <h2 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h2>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );

  const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <div>
        <p className="text-sm text-white">{label}</p>
        {desc && <p className="text-[11px] font-mono text-text-dim mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );

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
            <span className="text-xs font-mono text-white">Configurações</span>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Configurações</h1>
            <p className="text-xs font-mono text-text-dim mt-0.5">Personalize o Privyon para o seu fluxo de trabalho.</p>
          </div>

          <Section icon={User} title="Perfil">
            <Row label="Nome" desc="Aparece nos relatórios gerados">
              <span className="text-sm font-mono text-accent">{user.name}</span>
            </Row>
            <Row label="Função" desc="Permissões de acesso">
              <span className="text-[10px] font-mono uppercase px-2 py-1 rounded" style={{ background: "#00e5ff15", color: "#00e5ff" }}>{user.role}</span>
            </Row>
          </Section>

          <Section icon={Bell} title="Notificações">
            <Row label="Alertas por e-mail" desc="Receber alertas de violações críticas">
              <Toggle value={prefs.emailAlerts} onChange={(v) => set("emailAlerts", v)} />
            </Row>
            <Row label="Apenas críticos" desc="Notificar somente severidade crítica">
              <Toggle value={prefs.criticalOnly} onChange={(v) => set("criticalOnly", v)} />
            </Row>
            <Row label="Relatório automático" desc="Gerar PDF após cada auditoria">
              <Toggle value={prefs.autoReport} onChange={(v) => set("autoReport", v)} />
            </Row>
          </Section>

          <Section icon={Key} title="Integrações">
            <Row label="Groq API Key" desc="Para análise contextual com IA (Llama 3.3 70B)">
              <div className="flex items-center gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  placeholder="gsk_..."
                  value={prefs.groqKey}
                  onChange={(e) => set("groqKey", e.target.value)}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border bg-transparent text-white focus:outline-none focus:border-accent transition-colors w-48"
                />
                <button onClick={() => setShowKey(!showKey)} className="text-text-dim hover:text-white transition-colors">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Row>
          </Section>

          <Section icon={Shield} title="Auditoria">
            <Row label="Escanear ao fazer upload" desc="Iniciar análise automaticamente ao enviar arquivos">
              <Toggle value={prefs.scanOnUpload} onChange={(v) => set("scanOnUpload", v)} />
            </Row>
            <Row label="Logo no relatório" desc="Incluir logo Privyon no PDF gerado">
              <Toggle value={prefs.reportLogo} onChange={(v) => set("reportLogo", v)} />
            </Row>
          </Section>

          <Section icon={Globe} title="Aparência">
            <Row label="Idioma">
              <select value={prefs.language} onChange={(e) => set("language", e.target.value)}
                className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-white focus:outline-none focus:border-accent transition-colors"
                style={{ background: "#0b1117" }}>
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English (US)</option>
              </select>
            </Row>
            <Row label="Modo escuro" desc="Interface dark — recomendado">
              <Toggle value={prefs.darkMode} onChange={(v) => set("darkMode", v)} />
            </Row>
          </Section>

          <button onClick={save}
            className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: saved ? "#3ddc84" : "#00e5ff", color: "#000" }}>
            {saved ? <><CheckCircle2 size={15} /> Salvo!</> : <><Save size={15} /> Salvar configurações</>}
          </button>
        </main>
      </div>
    </div>
  );
}
