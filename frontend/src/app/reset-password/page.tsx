"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { resetPassword } from "@/lib/auth";
import PrivyonLogo from "@/components/PrivyonLogo";

const schema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [serverErr, setErr] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setErr(null);
    if (!token) { setErr("Link inválido — token não encontrado."); return; }
    try {
      await resetPassword(token, data.password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setErr("Link inválido ou expirado. Solicite um novo link de redefinição.");
    }
  }

  if (!token) {
    return (
      <div className="text-center py-2">
        <p className="text-[14px] font-bold mb-2" style={{ color: "var(--text)" }}>Link inválido</p>
        <p className="text-[13px] mb-4" style={{ color: "var(--text-3)" }}>Este link de redefinição está incompleto ou expirado.</p>
        <Link href="/forgot-password" className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>
          Solicitar novo link →
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--success-l)" }}>
          <CheckCircle2 size={26} style={{ color: "var(--success)" }} />
        </div>
        <h1 className="text-[18px] font-extrabold mb-2" style={{ color: "var(--text)" }}>Senha redefinida!</h1>
        <p className="text-[13px]" style={{ color: "var(--text-3)" }}>Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
        Criar nova senha
      </h1>
      <p className="text-[13px] mb-6" style={{ color: "var(--text-3)" }}>
        Escolha uma nova senha para sua conta Privyon.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3.5">
          <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{ color: "var(--text-2)" }}>
            Nova senha
          </label>
          <div className="relative">
            <input {...register("password")} type={showPw ? "text" : "password"} placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[13px] outline-none"
              style={{ border: "1.5px solid var(--border)", background: "var(--bg2)", color: "var(--text)" }} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.password.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{ color: "var(--text-2)" }}>
            Confirmar nova senha
          </label>
          <input {...register("confirmPassword")} type={showPw ? "text" : "password"} placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none"
            style={{ border: "1.5px solid var(--border)", background: "var(--bg2)", color: "var(--text)" }} />
          {errors.confirmPassword && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.confirmPassword.message}</p>}
        </div>

        {serverErr && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg text-[12px]" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
            {serverErr}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}
          className="w-full py-3 rounded-lg text-[14px] font-bold text-white mb-4 transition-all disabled:opacity-60 flex items-center justify-center"
          style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Redefinir senha"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--bg2)" }}>
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex justify-center">
          <PrivyonLogo height={30} />
        </div>
        <div className="rounded-2xl p-7" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(15,22,41,0.08)" }}>
          <Suspense fallback={<div className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></div>}>
            <ResetPasswordForm />
          </Suspense>
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-[12px] font-semibold mt-5" style={{ color: "var(--text-2)" }}>
            <ArrowLeft size={13} /> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
