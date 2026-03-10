"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { login } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import type { LoginFormData } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    try {
      await login(data);
      await refresh();
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Credenciais inválidas. Tente novamente.";
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
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, #00e5ff0d 0%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 border-b border-border font-mono text-xs text-text-dim z-50"
        style={{
          height: "44px",
          background: "#080c10cc",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="w-1.5 h-1.5 rounded-full bg-success"
            style={{ boxShadow: "0 0 6px #3ddc84" }}
          />
          <span>Sistema ativo — v2.0.0</span>
          <span className="text-border">|</span>
          <span>Processamento 100% local</span>
        </div>
        <div className="flex gap-5">
          <span>LGPD Art. 46</span>
          <span>ISO 27001</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-20 px-8">
        
        {/* Branding */}
        <div className="max-w-xs hidden lg:block">
          <div
            className="inline-flex items-center gap-1.5 mb-6 px-2.5 py-1 rounded font-mono text-xs tracking-widest uppercase"
            style={{
              background: "#00e5ff22",
              border: "1px solid #00e5ff33",
              color: "#00e5ff99",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-accent"
              style={{ boxShadow: "0 0 8px #00e5ff" }}
            />
            Privyon
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white mb-3">
            Priv
            <span
              className="text-accent"
              style={{ textShadow: "0 0 30px #00e5ff" }}
            >
              yon
            </span>
          </h1>

          <p className="text-sm text-text-dim font-mono leading-relaxed mb-9">
            Sistema automatizado de auditoria
            <br />
            de conformidade para infraestrutura de TI.
          </p>

          <div className="flex gap-6">
            {[
              { value: "100%", label: "On-premise" },
              { value: "0ms", label: "Latência ext." },
              { value: "2", label: "Módulos" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xl font-bold text-white font-mono">
                  {value}
                </span>
                <span className="text-xs text-text-dim font-mono uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="hidden lg:block w-px h-72"
          style={{
            background:
              "linear-gradient(to bottom, transparent, #1e2d3d, transparent)",
          }}
        />

        {/* Card */}
        <div
          className="w-96 rounded-xl p-9 relative"
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
              left: "20%",
              right: "20%",
              height: "1px",
              background:
                "linear-gradient(to right, transparent, #00e5ff, transparent)",
              opacity: 0.6,
            }}
          />

          <div className="mb-7">
            <h2 className="text-lg font-bold text-white mb-1">
              Acesso ao sistema
            </h2>
            <p className="text-xs text-text-dim font-mono">
              // credenciais corporativas
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* E-mail */}
            <div>
              <label className="block text-xs font-mono text-text-dim uppercase tracking-widest mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
                />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="voce@empresa.com.br"
                  className="w-full pl-9 pr-3 py-3 rounded-md font-mono text-sm text-[#cdd9e5] placeholder-[#3a4a58] outline-none transition-all"
                  style={{
                    background: "#0a0f14",
                    border: `1px solid ${errors.email ? "#ff4d6d" : "#1e2d3d"}`,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#00e5ff99";
                    e.target.style.boxShadow = "0 0 0 3px #00e5ff22";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email
                      ? "#ff4d6d"
                      : "#1e2d3d";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-mono text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-mono text-text-dim uppercase tracking-widest mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
                />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-3 rounded-md font-mono text-sm text-[#cdd9e5] placeholder-[#3a4a58] outline-none transition-all"
                  style={{
                    background: "#0a0f14",
                    border: `1px solid ${errors.password ? "#ff4d6d" : "#1e2d3d"}`,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#00e5ff99";
                    e.target.style.boxShadow = "0 0 0 3px #00e5ff22";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password
                      ? "#ff4d6d"
                      : "#1e2d3d";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-accent transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-mono text-danger">
                  {errors.password.message}
                </p>
              )}
              <a
                href="#"
                className="block text-right text-xs font-mono mt-1.5 text-accent-soft hover:text-accent transition-colors"
              >
                Esqueceu a senha?
              </a>
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
              style={{
                background: "#00e5ff",
                boxShadow: isSubmitting ? "none" : "0 0 0 0 #00e5ff44",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.boxShadow =
                  "0 0 24px #00e5ff44";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Autenticando...
                </>
              ) : (
                "ENTRAR NO SISTEMA"
              )}
            </button>
          </form>

          {/* Security note */}
          <div
            className="flex items-center justify-center gap-2 mt-5 p-2.5 rounded-md text-xs font-mono"
            style={{
              background: "#0a1f12",
              border: "1px solid #1e3a2a",
              color: "#3ddc84aa",
            }}
          >
            <ShieldCheck size={12} />
            Conexão cifrada — dados nunca saem do seu ambiente
          </div>
          {/* Register link */}
          <p className="mt-4 text-center text-xs font-mono text-text-dim">
            Não tem conta?{" "}
            <a href="/register" className="text-accent-soft hover:text-accent transition-colors">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
