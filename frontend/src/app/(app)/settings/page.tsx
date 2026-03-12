"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Key, Shield, Moon, Globe, Save, CheckCircle2,
  Eye, EyeOff, ArrowLeft, ChevronRight, Monitor, FileText,
  Zap, Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
      style={{ background: value ? "#00e5ff" : "#1e2d3d", opacity: disabled ? 0.4 : 1 }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{ background: "white", left: value ? "calc(100% - 18px)" : "2px" }} />
    </button>
  );
}

const LANGS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es",    label: "Español" },
];

const INTERVALS = [
  { value: "realtime", label: "Tempo real" },
  { value: "hourly",   label: "A cada hora" },
  { value: "daily",    label: "Diário" },
  { value: "weekly",   label: "Semanal" },
];

const DEFAULT_PREFS = {
  // Notificações
  emailAlerts: true,
  criticalOnly: false,
  autoReport: false,
  alertInterval: "realtime",
  // Integrações
  groqKey: "",
  // Auditoria
  scanOnUpload: true,
  reportLogo: true,
  autoSaveHistory: true,
  maxHistoryItems: "50",
  // Aparência
  language: "pt-BR",
  darkMode: true,
  compactMode: false,
  showLineNumbers: true,
  // Privacidade
  anonymizeLogs: false,
  shareMetrics: false,
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [cleared, setCleared] = useState(false);

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    try {
      const stored = JSON.parse(localStorage.getItem("privyon_prefs") || "{}");
      setPrefs((p) => ({ ...p, ...stored }));
    } catch {}
  }, [user, loading, router]);

  function save() {
    localStorage.setItem("privyon_prefs", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function set<K extends keyof typeof DEFAULT_PREFS>(key: K, value: typeof DEFAULT_PREFS[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function clearHistory() {
    localStorage.removeItem("privyon_stats");
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
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
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{label}</p>
        {desc && <p className="text-[11px] font-mono text-text-dim mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 page-enter">
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

      <main className="flex-1 p-6 max-w-2xl pb-32">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <p className="text-xs font-mono text-text-dim mt-0.5">Personalize o Privyon para o seu fluxo de trabalho.</p>
        </div>

        {/* Perfil info */}
        <Section icon={Monitor} title="Perfil">
          <Row label="Nome" desc="Aparece nos relatórios gerados">
            <span className="text-sm font-mono text-accent">{user.name}</span>
          </Row>
          <Row label="Função" desc="Permissões de acesso">
            <span className="text-[10px] font-mono uppercase px-2 py-1 rounded"
              style={{ background: "#00e5ff15", color: "#00e5ff" }}>{user.role}</span>
          </Row>
          <Row label="Editar perfil" desc="Alterar nome, e-mail ou senha">
            <button onClick={() => router.push("/profile")}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-text-dim hover:text-white transition-all"
              style={{ background: "#060a0e" }}>
              Abrir perfil →
            </button>
          </Row>
        </Section>

        {/* Notificações */}
        <Section icon={Bell} title="Notificações">
          <Row label="Alertas por e-mail" desc="Receber alertas de violações críticas">
            <Toggle value={prefs.emailAlerts} onChange={(v) => set("emailAlerts", v)} />
          </Row>
          <Row label="Apenas críticos" desc="Notificar somente severidade crítica">
            <Toggle value={prefs.criticalOnly} onChange={(v) => set("criticalOnly", v)} disabled={!prefs.emailAlerts} />
          </Row>
          <Row label="Relatório automático" desc="Gerar PDF após cada auditoria">
            <Toggle value={prefs.autoReport} onChange={(v) => set("autoReport", v)} />
          </Row>
          <Row label="Frequência de alertas" desc="Com qual frequência receber notificações">
            <select value={prefs.alertInterval} onChange={(e) => set("alertInterval", e.target.value)}
              className="text-xs font-mono px-2 py-1.5 rounded-lg border border-border text-white focus:outline-none focus:border-accent"
              style={{ background: "#060a0e" }}>
              {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </Row>
        </Section>

        {/* Integrações */}
        <Section icon={Key} title="Integrações">
          <Row label="Groq API Key" desc="Para análise contextual com IA (Llama 3.3 70B)">
            <div className="flex items-center gap-2">
              <input
                type={showKey ? "text" : "password"}
                value={prefs.groqKey}
                onChange={(e) => set("groqKey", e.target.value)}
                placeholder="gsk_..."
                className="w-36 text-xs font-mono px-2 py-1.5 rounded-lg border border-border text-white focus:outline-none focus:border-accent"
                style={{ background: "#060a0e" }}
              />
              <button onClick={() => setShowKey(!showKey)} className="text-text-dim hover:text-white transition-colors">
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Row>
        </Section>

        {/* Auditoria */}
        <Section icon={Zap} title="Auditoria">
          <Row label="Escanear ao fazer upload" desc="Iniciar análise automaticamente ao enviar arquivos">
            <Toggle value={prefs.scanOnUpload} onChange={(v) => set("scanOnUpload", v)} />
          </Row>
          <Row label="Logo no relatório" desc="Incluir logo Privyon no PDF gerado">
            <Toggle value={prefs.reportLogo} onChange={(v) => set("reportLogo", v)} />
          </Row>
          <Row label="Salvar histórico automaticamente" desc="Registrar cada auditoria no banco de dados">
            <Toggle value={prefs.autoSaveHistory} onChange={(v) => set("autoSaveHistory", v)} />
          </Row>
          <Row label="Exibir números de linha" desc="Mostrar linha do código com a violação">
            <Toggle value={prefs.showLineNumbers} onChange={(v) => set("showLineNumbers", v)} />
          </Row>
          <Row label="Máximo de histórico" desc="Quantidade de auditorias salvas">
            <select value={prefs.maxHistoryItems} onChange={(e) => set("maxHistoryItems", e.target.value)}
              className="text-xs font-mono px-2 py-1.5 rounded-lg border border-border text-white focus:outline-none focus:border-accent"
              style={{ background: "#060a0e" }}>
              {["10","25","50","100","ilimitado"].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Row>
        </Section>

        {/* Aparência */}
        <Section icon={Moon} title="Aparência">
          <Row label="Idioma" desc="Idioma da interface">
            <select value={prefs.language} onChange={(e) => set("language", e.target.value)}
              className="text-xs font-mono px-2 py-1.5 rounded-lg border border-border text-white focus:outline-none focus:border-accent"
              style={{ background: "#060a0e" }}>
              {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Row>
          <Row label="Modo escuro" desc="Interface dark — recomendado">
            <Toggle value={prefs.darkMode} onChange={(v) => set("darkMode", v)} />
          </Row>
          <Row label="Modo compacto" desc="Reduzir espaçamento para mais conteúdo visível">
            <Toggle value={prefs.compactMode} onChange={(v) => set("compactMode", v)} />
          </Row>
        </Section>

        {/* Privacidade */}
        <Section icon={Shield} title="Privacidade">
          <Row label="Anonimizar logs" desc="Mascarar dados sensíveis nos logs de auditoria">
            <Toggle value={prefs.anonymizeLogs} onChange={(v) => set("anonymizeLogs", v)} />
          </Row>
          <Row label="Compartilhar métricas" desc="Ajudar a melhorar o Privyon (dados anônimos)">
            <Toggle value={prefs.shareMetrics} onChange={(v) => set("shareMetrics", v)} />
          </Row>
        </Section>

        {/* Dados */}
        <Section icon={Trash2} title="Dados">
          <Row label="Limpar histórico local" desc="Remove estatísticas salvas no navegador">
            <button onClick={clearHistory}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border transition-all"
              style={{
                background: cleared ? "#3ddc8415" : "#060a0e",
                borderColor: cleared ? "#3ddc84" : "#1e2d3d",
                color: cleared ? "#3ddc84" : "#8b9db0",
              }}>
              {cleared ? "✓ Limpo!" : "Limpar"}
            </button>
          </Row>
          <Row label="Exportar dados" desc="Baixar todas as suas auditorias em JSON">
            <button onClick={() => router.push("/reports")}
              className="text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-text-dim hover:text-white transition-all"
              style={{ background: "#060a0e" }}>
              <FileText size={12} className="inline mr-1" />Ver relatórios
            </button>
          </Row>
        </Section>
      </main>

      {/* Save button — fixed bottom */}
      <div className="fixed bottom-0 right-0 p-4 z-10"
        style={{ left: 220, background: "linear-gradient(to top, #080c10 60%, transparent)" }}>
        <button onClick={save}
          className="w-full max-w-2xl flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-black transition-all"
          style={{ background: saved ? "#3ddc84" : "#00e5ff" }}>
          {saved ? <><CheckCircle2 size={15} /> Configurações salvas!</> : <><Save size={15} /> Salvar configurações</>}
        </button>
      </div>
    </div>
  );
}
