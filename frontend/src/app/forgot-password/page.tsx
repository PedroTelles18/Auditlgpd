"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/lib/auth";
import PrivyonLogo from "@/components/PrivyonLogo";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverErr, setErr] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setErr(null);
    try {
      await forgotPassword(data.email);
      setSent(true); // Sempre mostra sucesso, mesmo se o e-mail não existir (segurança)
    } catch {
      setErr("Não foi possível processar sua solicitação. Tente novamente em instantes.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--bg2)" }}>
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex justify-center">
          <PrivyonLogo height={30} />
        </div>

        <div className="rounded-2xl p-7" style={{ background: "var(--card-bg)", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(15,22,41,0.08)" }}>
          {!sent ? (
            <>
              <h1 className="text-[20px] font-extrabold mb-1" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
                Esqueceu sua senha?
              </h1>
              <p className="text-[13px] mb-6" style={{ color: "var(--text-3)" }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{ color: "var(--text-2)" }}>
                    E-mail
                  </label>
                  <input {...register("email")} type="email" placeholder="seu@email.com"
                    className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none"
                    style={{ border: "1.5px solid var(--border)", background: "var(--bg2)", color: "var(--text)" }} />
                  {errors.email && <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors.email.message}</p>}
                </div>

                {serverErr && (
                  <div className="mb-4 px-3.5 py-2.5 rounded-lg text-[12px]" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                    {serverErr}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3 rounded-lg text-[14px] font-bold text-white mb-4 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Mail size={15} /> Enviar link de redefinição</>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--success-l)" }}>
                <CheckCircle2 size={26} style={{ color: "var(--success)" }} />
              </div>
              <h1 className="text-[18px] font-extrabold mb-2" style={{ color: "var(--text)" }}>
                Verifique seu e-mail
              </h1>
              <p className="text-[13px]" style={{ color: "var(--text-3)" }}>
                Se o e-mail informado estiver cadastrado, você receberá um link para redefinir sua senha em instantes. O link expira em 30 minutos.
              </p>
            </div>
          )}

          <Link href="/login" className="flex items-center justify-center gap-1.5 text-[12px] font-semibold mt-5" style={{ color: "var(--text-2)" }}>
            <ArrowLeft size={13} /> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
