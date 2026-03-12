"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [count, setCount] = useState(10);

  useEffect(() => {
    const iv = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(iv); router.push("/dashboard"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* Grid bg */}
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#00e5ff 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Scan line */}
      <div className="scanline" />

      {/* Glow */}
      <div className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "#00e5ff", top: "20%", left: "50%", transform: "translateX(-50%)" }} />

      {/* Logo */}
      <div className="flex items-center gap-2 mb-16 fade-in">
        <ShieldCheck size={18} className="text-accent" />
        <span className="font-bold text-white text-sm tracking-tight">
          Priv<span className="text-accent">yon</span>
        </span>
      </div>

      {/* 404 glitch */}
      <div className="relative mb-6 page-enter">
        <h1
          className="glitch text-[120px] sm:text-[180px] font-extrabold text-white leading-none select-none"
          data-text="404"
          style={{ textShadow: "0 0 60px #00e5ff22" }}>
          404
        </h1>
      </div>

      {/* Message */}
      <div className="text-center mb-10 stagger">
        <p className="text-accent text-xs uppercase tracking-[0.3em] mb-3">
          — acesso negado —
        </p>
        <p className="text-white text-lg font-bold mb-1">
          Página não encontrada
        </p>
        <p className="text-text-dim text-xs max-w-xs mx-auto leading-relaxed">
          O recurso que você tentou acessar não existe ou foi movido.
        </p>
      </div>

      {/* Terminal block */}
      <div className="rounded-xl border border-border px-6 py-4 mb-10 w-full max-w-sm page-enter"
        style={{ background: "#060a0e", animationDelay: "0.2s" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-danger opacity-80" />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffd166", opacity: 0.8 }} />
          <div className="w-2.5 h-2.5 rounded-full bg-success opacity-80" />
          <span className="text-text-dim text-[10px] ml-2">privyon.log</span>
        </div>
        <p className="text-[11px] text-text-dim">
          <span className="text-accent">$</span> GET /unknown-route
        </p>
        <p className="text-[11px] text-danger mt-1">
          ✗ 404 Not Found — rota inexistente
        </p>
        <p className="text-[11px] text-text-dim mt-1">
          <span className="text-success">→</span> redirecionando para /dashboard em{" "}
          <span className="text-white font-bold">{count}s</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 stagger" style={{ animationDelay: "0.3s" }}>
        <button onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold border border-border text-text-dim hover:text-white hover:border-[#2a3d52] transition-all"
          style={{ background: "#0b1117" }}>
          <ArrowLeft size={13} /> Voltar
        </button>
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-black transition-all hover:opacity-90"
          style={{ background: "#00e5ff" }}>
          <Home size={13} /> Dashboard
        </button>
      </div>
    </div>
  );
}
