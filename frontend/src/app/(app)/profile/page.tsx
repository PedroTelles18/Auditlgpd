"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Lock, Save, ArrowLeft, ChevronRight,
  Eye, EyeOff, Loader2, Shield,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProfilePage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [name, setName]   = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg, setMsg]     = useState<{type:"ok"|"err"; text:string} | null>(null);
  const [pwMsg, setPwMsg] = useState<{type:"ok"|"err"; text:string} | null>(null);

  async function saveProfile() {
    setSaving(true); setMsg(null);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API_URL}/profile/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Erro ao salvar"); }
      await refresh();
      setMsg({ type: "ok", text: "Perfil atualizado!" });
    } catch (e: unknown) { setMsg({ type: "err", text: (e as Error).message }); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    setPwSaving(true); setPwMsg(null);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API_URL}/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
      setCurrentPw(""); setNewPw("");
      setPwMsg({ type: "ok", text: "Senha alterada com sucesso!" });
    } catch (e: unknown) { setPwMsg({ type: "err", text: (e as Error).message }); }
    finally { setPwSaving(false); }
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0 page-enter">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-6 border-b border-border"
        style={{ height: 52, background: "#070b0fee", backdropFilter: "blur(12px)" }}>
        <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1 text-xs font-mono text-text-dim hover:text-accent transition-colors">
          <ArrowLeft size={12} /> Dashboard
        </button>
        <ChevronRight size={12} className="text-border" />
        <span className="text-xs font-mono text-white">Meu Perfil</span>
      </header>

      <main className="flex-1 p-6 max-w-xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
          <p className="text-xs font-mono text-text-dim mt-0.5">Gerencie suas informações e segurança.</p>
        </div>

        {/* Avatar card */}
        <div className="flex items-center gap-4 mb-6 p-5 rounded-xl border border-border" style={{ background: "#0b1117" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-black flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #00e5ff, #0099aa)" }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{user.name}</p>
            <p className="text-xs font-mono text-text-dim">{user.email}</p>
            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded mt-1 inline-block"
              style={{ background: "#00e5ff15", color: "#00e5ff" }}>{user.role}</span>
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-xl border border-border overflow-hidden mb-4" style={{ background: "#0b1117" }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <User size={13} className="text-accent" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Informações pessoais</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {[
              { label: "Nome",   val: name,  set: setName,  type: "text"  },
              { label: "E-mail", val: email, set: setEmail, type: "email" },
            ].map(({ label, val, set, type }) => (
              <div key={label}>
                <label className="text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 block">{label}</label>
                <input value={val} onChange={e => set(e.target.value)} type={type}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-white focus:outline-none focus:border-accent transition-colors"
                  style={{ background: "#060a0e" }} />
              </div>
            ))}
            {msg && <p className={`text-xs font-mono ${msg.type==="ok"?"text-success":"text-danger"}`}>{msg.type==="ok"?"✓":"✗"} {msg.text}</p>}
            <button onClick={saveProfile} disabled={saving}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-black transition-all disabled:opacity-60"
              style={{ background: "#00e5ff" }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Salvar alterações
            </button>
          </div>
        </div>

        {/* Password form */}
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: "#0b1117" }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <Lock size={13} className="text-accent" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Alterar senha</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {[
              { label:"Senha atual", val:currentPw, set:setCurrentPw, show:showCurrent, toggle:()=>setShowCurrent(!showCurrent) },
              { label:"Nova senha",  val:newPw,     set:setNewPw,     show:showNew,     toggle:()=>setShowNew(!showNew) },
            ].map(({ label, val, set, show, toggle }) => (
              <div key={label}>
                <label className="text-[10px] font-mono text-text-dim uppercase tracking-wider mb-1.5 block">{label}</label>
                <div className="relative">
                  <input value={val} onChange={e => set(e.target.value)} type={show?"text":"password"}
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border text-sm text-white focus:outline-none focus:border-accent transition-colors"
                    style={{ background: "#060a0e" }} />
                  <button onClick={toggle} type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-white">
                    {show ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
            ))}
            {pwMsg && <p className={`text-xs font-mono ${pwMsg.type==="ok"?"text-success":"text-danger"}`}>{pwMsg.type==="ok"?"✓":"✗"} {pwMsg.text}</p>}
            <button onClick={changePassword} disabled={pwSaving || !currentPw || !newPw}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold border border-border text-text-dim hover:text-white transition-all disabled:opacity-40"
              style={{ background: "#060a0e" }}>
              {pwSaving ? <Loader2 size={13} className="animate-spin"/> : <Shield size={13}/>} Alterar senha
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
