"use client";

import { useState } from "react";
import { Save, Shield, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Topbar, Card, BtnPrimary, BtnOutline, Badge } from "@/components/ui";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProfilePage() {
  const { t } = useLang();
  const { user, refresh } = useAuth();
  const [name,  setName]  = useState(user?.name  || "");
  const [email, setEmail] = useState(user?.email || "");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw,setConfPw]= useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [msg,  setMsg]  = useState<{ type:"ok"|"err"; text:string }|null>(null);
  const [pwMsg, setPwMsg] = useState<{ type:"ok"|"err"; text:string }|null>(null);

  async function saveProfile() {
    setSaving(true); setMsg(null);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API_URL}/profile/`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      await refresh();
      setMsg({ type:"ok", text:"Perfil atualizado com sucesso!" });
    } catch (e: unknown) { setMsg({ type:"err", text: (e as Error).message }); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (newPw !== confPw) { setPwMsg({ type:"err", text:"Senhas não coincidem." }); return; }
    setPwSaving(true); setPwMsg(null);
    try {
      const token = Cookies.get("access_token");
      const res = await fetch(`${API_URL}/profile/password`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: curPw, new_password: newPw }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      setCurPw(""); setNewPw(""); setConfPw("");
      setPwMsg({ type:"ok", text:"Senha alterada com sucesso!" });
    } catch (e: unknown) { setPwMsg({ type:"err", text: (e as Error).message }); }
    finally { setPwSaving(false); }
  }

  const Field = ({ label, value, onChange, type="text", placeholder="" }: {
    label: string; value: string; onChange: (v:string) => void;
    type?: string; placeholder?: string;
  }) => (
    <div className="mb-3.5">
      <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{ color: "#475569" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg text-[13px] outline-none transition-all"
        style={{ border: "1.5px solid #e2e8f4", background: "#f8fafc", color: "#0f172a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#2563eb"; (e.target as HTMLInputElement).style.background = "#fff"; (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; }}
        onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f4"; (e.target as HTMLInputElement).style.background = "#f8fafc"; (e.target as HTMLInputElement).style.boxShadow = "none"; }} />
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar breadcrumb={t.profile_title} />
      <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: "#f8fafc" }}>
        <div className="mb-5">
          <h1 className="text-[20px] font-extrabold mb-0.5" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>{t.profile_title}</h1>
          <p className="text-[12px]" style={{ color: "#94a3b8" }}>Gerencie suas informações e segurança de acesso</p>
        </div>

        {/* Avatar card */}
        <Card className="p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[22px] font-extrabold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[16px] font-extrabold" style={{ color: "#0f172a" }}>{user.name}</p>
            <p className="text-[12px] mb-1.5" style={{ color: "#94a3b8" }}>{user.email}</p>
            <Badge variant="blue">{user.role.toUpperCase()}</Badge>
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Profile form */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: "1px solid #e2e8f4", background: "#fafbfe" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#eff6ff" }}>
                <Save size={13} style={{ color: "#2563eb" }} />
              </div>
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: "#0f172a" }}>{t.personal_info}</h2>
            </div>
            <div className="p-5">
              <Field label={t.full_name} value={name}  onChange={setName}  />
              <Field label={t.email}     value={email} onChange={setEmail} type="email" />
              {msg && (
                <div className="mb-3 px-3.5 py-2.5 rounded-lg text-[12px]"
                  style={{ background: msg.type==="ok" ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${msg.type==="ok" ? "#bbf7d0" : "#fecaca"}`,
                    color: msg.type==="ok" ? "#15803d" : "#dc2626" }}>
                  {msg.type==="ok" && <CheckCircle2 size={12} className="inline mr-1.5" />}
                  {msg.text}
                </div>
              )}
              <BtnPrimary onClick={saveProfile} disabled={saving} className="w-full justify-center">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {t.save}
              </BtnPrimary>
            </div>
          </Card>

          {/* Password form */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5" style={{ borderBottom: "1px solid #e2e8f4", background: "#fafbfe" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#fef2f2" }}>
                <Shield size={13} style={{ color: "#ef4444" }} />
              </div>
              <h2 className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: "#0f172a" }}>{t.change_password}</h2>
            </div>
            <div className="p-5">
              {[
                { label: t.current_password, val: curPw, set: setCurPw, show: showCur, toggle: () => setShowCur(!showCur) },
                { label: t.new_password,     val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(!showNew) },
                { label: t.confirm_password, val: confPw,set: setConfPw,show: showNew, toggle: () => setShowNew(!showNew) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label} className="mb-3.5">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.05em] mb-1.5" style={{ color: "#475569" }}>{label}</label>
                  <div className="relative">
                    <input type={show ? "text" : "password"} value={val} onChange={e => set(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-[13px] outline-none transition-all"
                      style={{ border: "1.5px solid #e2e8f4", background: "#f8fafc", color: "#0f172a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "#2563eb"; (e.target as HTMLInputElement).style.background = "#fff"; }}
                      onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f4"; (e.target as HTMLInputElement).style.background = "#f8fafc"; }} />
                    <button type="button" onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
                      {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
              {pwMsg && (
                <div className="mb-3 px-3.5 py-2.5 rounded-lg text-[12px]"
                  style={{ background: pwMsg.type==="ok" ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${pwMsg.type==="ok" ? "#bbf7d0" : "#fecaca"}`,
                    color: pwMsg.type==="ok" ? "#15803d" : "#dc2626" }}>
                  {pwMsg.text}
                </div>
              )}
              <BtnOutline onClick={changePassword} className="w-full justify-center">
                {pwSaving ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
                {t.change_password}
              </BtnOutline>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
