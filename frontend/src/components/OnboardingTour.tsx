"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, FileCode2, Database, FileText, Bell, Zap, X, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  { icon: ShieldCheck, title: "Bem-vindo ao Privyon! 🎉",   desc: "Plataforma de auditoria automatizada de conformidade LGPD. Vamos te mostrar o que você pode fazer.",                                              color: "#2563eb" },
  { icon: FileCode2,   title: "Análise de Código",          desc: "Envie arquivos Python ou JavaScript. O motor AST + regex detecta violações LGPD como CPF em logs e queries sem sanitização.",                  color: "#2563eb" },
  { icon: Database,    title: "Auditoria de Banco de Dados",desc: "Conecte ao seu PostgreSQL, MySQL ou SQLite. Analisamos o schema em busca de dados pessoais sem criptografia e ausência de consentimento.",    color: "#22c55e" },
  { icon: FileText,    title: "Relatórios PDF",             desc: "Após cada auditoria, exporte um relatório PDF profissional com achados, recomendações e score de conformidade LGPD.",                           color: "#f59e0b" },
  { icon: Bell,        title: "Central de Alertas",         desc: "Visualize todos os alertas de violações detectadas, ordene por severidade e marque como resolvidos.",                                            color: "#ef4444" },
  { icon: Zap,         title: "Pronto para começar!",       desc: "Você conhece todos os módulos do Privyon. Comece pela análise de código ou conecte seu banco de dados agora mesmo.",                           color: "#2563eb" },
];

export default function OnboardingTour({ onFinish }: { onFinish: () => void }) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const current = STEPS[step];

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onFinish();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,22,41,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden transition-all duration-300 bg-white"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.95)",
          boxShadow: "0 24px 64px rgba(15,22,41,0.24)", border: "1px solid #e2e8f4" }}>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: "#f1f5f9" }}>
          <div className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: current.color }} />
        </div>

        {/* Close */}
        <button onClick={onFinish}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "#f1f5f9", color: "#94a3b8" }}>
          <X size={14} />
        </button>

        <div className="p-8">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: `${current.color}15`, border: `1px solid ${current.color}30` }}>
            <current.icon size={22} style={{ color: current.color }} />
          </div>

          {/* Counter */}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2" style={{ color: "#94a3b8" }}>
            Passo {step + 1} de {STEPS.length}
          </p>

          <h2 className="text-[19px] font-extrabold mb-3 leading-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            {current.title}
          </h2>
          <p className="text-[13px] leading-relaxed mb-7" style={{ color: "#64748b" }}>
            {current.desc}
          </p>

          {/* Dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className="rounded-full transition-all duration-300"
                style={{ width: i === step ? 20 : 6, height: 6, background: i === step ? current.color : "#e2e8f4" }} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-bold transition-colors"
                style={{ border: "1px solid #e2e8f4", background: "#fff", color: "#475569" }}>
                <ChevronLeft size={13} /> Anterior
              </button>
            )}
            <button onClick={next}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-bold text-white transition-all"
              style={{ background: current.color, boxShadow: `0 4px 12px ${current.color}40` }}>
              {step === STEPS.length - 1 ? "Começar agora 🚀" : <><span>Próximo</span><ChevronRight size={13} /></>}
            </button>
          </div>

          {step < STEPS.length - 1 && (
            <button onClick={onFinish} className="w-full mt-3 text-[11px] transition-colors"
              style={{ color: "#94a3b8" }}>
              Pular tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
