"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, User, ChevronLeft } from "lucide-react";
import { api } from "@/lib/auth";

const registerSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);
    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "auditor",
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Erro ao criar conta. Tente novamente.";
      setServerError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-bg overflow-hidden relative flex items-center justify-center">

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#1e2d3d 1px, transparent 1px), linear-gradient(90deg, #1e2d3d 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px", height: "700px",
          background: "radial-gradient(circle, #00e5ff0d 0%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 border-b border-border font-mono text-xs text-text-dim z-50"
        style={{ height: "44px", background: "#080c10cc", backdropFilter: "blur(10px)" }}
      >
        <div className="flex items-center gap-4">
          <span className="w-1.5 h-1.5 rounded-full bg-success" style={{ boxShadow: "0 0 6px #3ddc84" }} />
          <span>Sistema ativo — v2.0.0</span>
        </div>
        <div className="flex gap-5">
          <span>LGPD Art. 46</span>
          <span>ISO 27001</span>
        </div>
      </div>

      {/* Card */}
      <div
        className="relative w-96 rounded-xl p-9 mt-10"
        style={{
          background: "#0d1117",
          border: "1px solid #1e2d3d",
          boxShadow: "0 0 0 1px #ffffff05, 0 24px 64px #00000066",
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 rounded-t-xl pointer-events-none"
          style={{
            left: "20%", right: "20%", height: "1px",
            background: "linear-gradient(to right, transparent, #00e5ff, transparent)",
            opacity: 0.6,
          }}
        />

        {/* Back button */}
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1 text-xs font-mono text-text-dim hover:text-accent transition-colors mb-6"
        >
          <ChevronLeft size={13} />
          Voltar ao login
        </button>

        <div className="mb-7">
          <h2 className="text-lg font-bold text-white mb-1">Criar conta</h2>
          <p className="text-xs text-text-dim font-mono">// novo usuário auditor</p>
        </div>

        {/* Success state */}
        {success ? (
          <div
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <ShieldCheck size={36} className="text-success" />
            <p className="text-sm font-bold text-white">Conta criada com sucesso!</p>
            <p className="text-xs font-mono text-text-dim">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nome */}
            <div>
              <label className="block text-xs font-mono text-text-dim uppercase tracking-widest mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                <input
                  {...register("name")}
                  type="text"
                  placeholder="Pedro Telles"
                  className="w-full pl-9 pr-3 py-3 rounded-md font-mono text-sm text-[#cdd9e5] placeholder-[#3a4a58] outline-none transition-all"
                  style={{ background: "#0a0f14", border: `1px solid ${errors.name ? "#ff4d6d" : "#1e2d3d"}` }}
                  onFocus={(e) => { e.target.style.borderColor = "#00e5ff99"; e.target.style.boxShadow = "0 0 0 3px #00e5ff22"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.name ? "#ff4d6d" : "#1e2d3d"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              {errors.name && <p className="mt-1.5 text-xs font-mono text-danger">{errors.name.message}</p>}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-mono text-text-dim uppercase tracking-widest mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="voce@empresa.com.br"
                  className="w-full pl-9 pr-3 py-3 rounded-md font-mono text-sm text-[#cdd9e5] placeholder-[#3a4a58] outline-none transition-all"
                  style={{ background: "#0a0f14", border: `1px solid ${errors.email ? "#ff4d6d" : "#1e2d3d"}` }}
                  onFocus={(e) => { e.target.style.borderColor = "#00e5ff99"; e.target.style.boxShadow = "0 0 0 3px #00e5ff22"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.email ? "#ff4d6d" : "#1e2d3d"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs font-mono text-danger">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-mono text-text-dim uppercase tracking-widest mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="mínimo 6 caracteres"
                  className="w-full pl-9 pr-10 py-3 rounded-md font-mono text-sm text-[#cdd9e5] placeholder-[#3a4a58] outline-none transition-all"
                  style={{ background: "#0a0f14", border: `1px solid ${errors.password ? "#ff4d6d" : "#1e2d3d"}` }}
                  onFocus={(e) => { e.target.style.borderColor = "#00e5ff99"; e.target.style.boxShadow = "0 0 0 3px #00e5ff22"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.password ? "#ff4d6d" : "#1e2d3d"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent transition-colors">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-mono text-danger">{errors.password.message}</p>}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="block text-xs font-mono text-text-dim uppercase tracking-widest mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="repita a senha"
                  className="w-full pl-9 pr-10 py-3 rounded-md font-mono text-sm text-[#cdd9e5] placeholder-[#3a4a58] outline-none transition-all"
                  style={{ background: "#0a0f14", border: `1px solid ${errors.confirmPassword ? "#ff4d6d" : "#1e2d3d"}` }}
                  onFocus={(e) => { e.target.style.borderColor = "#00e5ff99"; e.target.style.boxShadow = "0 0 0 3px #00e5ff22"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.confirmPassword ? "#ff4d6d" : "#1e2d3d"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent transition-colors">
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs font-mono text-danger">{errors.confirmPassword.message}</p>}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="p-3 rounded-md text-xs font-mono text-danger bg-[#1a0a0d] border border-[#ff4d6d33]">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 rounded-md text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "#00e5ff" }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.boxShadow = "0 0 24px #00e5ff44"; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.boxShadow = "none"; }}
            >
              {isSubmitting ? (
                <><Loader2 size={15} className="animate-spin" /> Criando conta...</>
              ) : "CRIAR CONTA"}
            </button>
          </form>
        )}

        {/* Footer */}
        {!success && (
          <p className="mt-5 text-center text-xs font-mono text-text-dim">
            Já tem conta?{" "}
            <button onClick={() => router.push("/login")} className="text-accent-soft hover:text-accent transition-colors">
              Fazer login
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
