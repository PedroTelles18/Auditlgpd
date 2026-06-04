"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/lib/auth";
import type { LoginFormData } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email:    z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const FEATURES = [
  { dot: "#60a5fa", text: "Análise de código", sub: "Python e JavaScript" },
  { dot: "#34d399", text: "Auditoria de banco",sub: "10 regras LGPD no schema" },
  { dot: "#fbbf24", text: "Relatórios PDF",    sub: "Score de conformidade" },
  { dot: "#a78bfa", text: "IA integrada",      sub: "Llama 3.3 70B via Groq" },
];

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [showPw, setShowPw]     = useState(false);
  const [serverErr, setErr]     = useState<string | null>(null);
  const [demoLoad, setDemoLoad] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setErr(null);
    try {
      localStorage.removeItem("privyon_is_demo");
      const response = await login(data);
      await refresh();
      // Admin vai para /admin, demais usuários vão para /dashboard
      if (response.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setErr("Credenciais inválidas. Verifique seu e-mail e senha.");
    }
  }

  async function loginDemo() {
    setErr(null);
    setDemoLoad(true);
    try {
      await login({ email: "demo@privyon.com.br", password: "demo1234" });
      await refresh();
      localStorage.removeItem("privyon_onboarded");
      router.push("/dashboard");
    } catch {
      setErr("Conta demo temporariamente indisponível.");
    } finally { setDemoLoad(false); }
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden flex-shrink-0"
        style={{ width: 400, background: "#0f1629" }}>
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        {/* Glow */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle at 30% 30%, #3b82f6, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle at 70% 70%, #3b82f6, transparent 70%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#3b82f6", boxShadow: "0 4px 12px rgba(59,130,246,0.5)" }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <span className="text-[22px] font-extrabold text-white tracking-tight">
            Priv<span style={{ color: "#3b82f6" }}>yon</span>
          </span>
        </div>

        {/* Mid */}
        <div className="z-10">
          <h2 className="text-[26px] font-extrabold text-white leading-tight mb-3"
            style={{ letterSpacing: "-0.02em" }}>
            Auditoria LGPD inteligente e automatizada
          </h2>
          <p className="text-[13px] leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            Identifique vulnerabilidades de privacidade em código e banco de dados. Gere relatórios completos com score de conformidade.
          </p>
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ dot, text, sub }) => (
              <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
                <div>
                  <span className="text-[12px] font-bold text-white">{text} </span>
                  <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>— {sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="z-10 flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <ShieldCheck size={14} color="#86efac" />
          <div>
            <p className="text-[12px] font-bold" style={{ color: "#86efac" }}>Segurança OWASP certificada</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>JWT · Argon2id · Rate Limiting · Security Headers</p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "var(--bg2)" }}>
        <div className="w-full max-w-[360px]">
          <div className="mb-7">
            <h1 className="text-[24px] font-extrabold mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
              Bem-vindo de volta 👋
            </h1>
            <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="mb-3.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5"
                style={{ color: "var(--text-2)" }}>E-mail</label>
              <input {...register("email")} type="email" placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                style={{ border: "1.5px solid #e2e8f4", background: "#fff", color: "var(--text)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#2563eb"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
              />
              {errors.email && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5"
                style={{ color: "var(--text-2)" }}>Senha</label>
              <div className="relative">
                <input {...register("password")} type={showPw ? "text" : "password"} placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[13px] outline-none transition-all"
                  style={{ border: "1.5px solid #e2e8f4", background: "#fff", color: "var(--text)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#2563eb"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
                  onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; (e.target as HTMLInputElement).style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-3)" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.password.message}</p>}
            </div>

            <div className="flex justify-end mb-5">
              <button type="button" className="text-[12px] font-semibold transition-colors"
                style={{ color: "#2563eb" }}>
                Esqueci minha senha
              </button>
            </div>

            {serverErr && (
              <div className="mb-4 px-3.5 py-2.5 rounded-lg text-[12px]"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                {serverErr}
              </div>
            )}

            <button type="submit" disabled={isSubmitting}
              className="w-full py-3 rounded-lg text-[14px] font-bold text-white mb-2.5 transition-all disabled:opacity-60"
              style={{ background: "#2563eb", boxShadow: "0 4px 14px rgba(37,99,235,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Entrar no Privyon →"}
            </button>

            <button type="button" onClick={loginDemo} disabled={demoLoad}
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold mb-5 transition-colors disabled:opacity-60"
              style={{ background: "#fff", color: "var(--text-2)", border: "1.5px solid #e2e8f4", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {demoLoad ? <Loader2 size={14} className="animate-spin mx-auto" /> : "▶  Acessar conta demonstração"}
            </button>
          </form>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>quer ter acesso?</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <a
            href="https://wa.me/5519991621375?text=Ol%C3%A1!%20Tenho%20interesse%20em%20contratar%20o%20Privyon."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-bold mb-5 transition-all"
            style={{ background: "#25D366", color: "#fff", boxShadow: "0 4px 14px rgba(37,211,102,0.35)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contratar via WhatsApp
          </a>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[12px] font-medium"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>
            <ShieldCheck size={13} />
            Conexão segura · Dados protegidos com AES-256 e JWT
          </div>
        </div>
      </div>
    </div>
  );
}
