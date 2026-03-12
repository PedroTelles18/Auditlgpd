"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, FileCode2, Database, FileText,
  Bell, Settings, X, ChevronRight, ChevronLeft, Zap,
} from "lucide-react";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Bem-vindo ao Privyon! 🎉",
    desc: "Plataforma de auditoria automatizada de conformidade LGPD para infraestrutura de T.I. Vamos te mostrar o que você pode fazer.",
    highlight: null,
    color: "#00e5ff",
  },
  {
    icon: FileCode2,
    title: "Análise de Código",
    desc: "Envie arquivos Python ou JavaScript. O motor AST + regex detecta violações LGPD como CPF em logs, queries sem sanitização e secrets expostos.",
    highlight: "/analyze",
    color: "#00e5ff",
  },
  {
    icon: Database,
    title: "Auditoria de Banco de Dados",
    desc: "Conecte ao seu PostgreSQL, MySQL ou SQLite. Analisamos o schema em busca de dados pessoais sem criptografia, ausência de consentimento e muito mais.",
    highlight: "/db-audit",
    color: "#3ddc84",
  },
  {
    icon: FileText,
    title: "Relatórios PDF",
    desc: "Após cada auditoria, exporte um relatório PDF profissional com os achados, recomendações e score de conformidade LGPD.",
    highlight: "/reports",
    color: "#ffd166",
  },
  {
    icon: Bell,
    title: "Central de Alertas",
    desc: "Visualize todos os alertas de violações detectadas ordenados por severidade. Filtre, marque como lidos e acompanhe em tempo real.",
    highlight: "/alerts",
    color: "#ff8c42",
  },
  {
    icon: Zap,
    title: "Pronto para começar!",
    desc: "Você conhece todos os módulos do Privyon. Comece pela análise de código ou conecte seu banco de dados agora mesmo.",
    highlight: null,
    color: "#00e5ff",
  },
];

export default function OnboardingTour({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const current = STEPS[step];

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }
  function finish() {
    localStorage.setItem("privyon_onboarded", "1");
    onFinish();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(4,8,12,0.85)", backdropFilter: "blur(8px)" }}>

      <div className="relative w-full max-w-md mx-4 rounded-2xl border border-border overflow-hidden transition-all duration-300"
        style={{
          background: "#0b1117",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(16px)",
        }}>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: "#1e2d3d" }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: current.color }} />
        </div>

        {/* Close */}
        <button onClick={finish}
          className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors z-10">
          <X size={16} />
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: current.color + "18", border: `1px solid ${current.color}33` }}>
            <current.icon size={24} style={{ color: current.color }} />
          </div>

          {/* Step counter */}
          <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest mb-2">
            Passo {step + 1} de {STEPS.length}
          </p>

          {/* Content */}
          <h2 className="text-xl font-bold text-white mb-3 leading-tight">{current.title}</h2>
          <p className="text-sm font-mono text-text-dim leading-relaxed mb-8">{current.desc}</p>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i === step ? current.color : "#1e2d3d",
                }} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold border border-border text-text-dim hover:text-white transition-all"
                style={{ background: "#060a0e" }}>
                <ChevronLeft size={13} /> Anterior
              </button>
            )}
            <button onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-black transition-all hover:opacity-90"
              style={{ background: current.color }}>
              {step === STEPS.length - 1 ? "Começar agora 🚀" : <><span>Próximo</span><ChevronRight size={13} /></>}
            </button>
          </div>

          {step < STEPS.length - 1 && (
            <button onClick={finish} className="w-full mt-3 text-[10px] font-mono text-text-dim hover:text-white transition-colors">
              Pular tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
