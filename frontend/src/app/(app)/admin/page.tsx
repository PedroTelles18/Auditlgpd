"use client";

/**
 * frontend/src/app/(app)/admin/page.tsx
 *
 * Painel Admin Privyon
 * - Listar usuários com filtros
 * - Criar / Editar usuário
 * - Reset de senha
 * - Ativar / Desativar conta
 * - Definir plano + módulos
 * - Ver histórico de auditorias
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Search, Filter, RefreshCw, ShieldCheck,
  Pencil, Lock, Power, History, X, Check, AlertTriangle,
  ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { api } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserAdmin {
  id: string;
  name: string;
  email: string;
  role: "admin" | "auditor" | "viewer";
  is_active: boolean;
  plan: string;
  allowed_modules: string[];
  created_at: string;
}

interface Meta {
  available_modules: string[];
  plans: Record<string, string[]>;
}

type ModalMode = "create" | "edit" | "reset" | "history" | null;

const ROLE_OPTIONS   = ["admin", "auditor", "viewer"] as const;
const MODULE_LABELS: Record<string, string> = {
  dashboard:  "Dashboard",
  analyze:    "Análise de Código",
  db_audit:   "Auditoria de BD",
  db_monitor: "Monitor de Banco",
  reports:    "Relatórios",
  alerts:     "Alertas",
};
const PLAN_LABELS: Record<string, string> = {
  starter:    "Starter",
  pro:        "Pro",
  enterprise: "Enterprise",
  custom:     "Personalizado",
};
const PLAN_COLORS: Record<string, string> = {
  starter:    "#6366f1",
  pro:        "#3b82f6",
  enterprise: "#10b981",
  custom:     "#f59e0b",
};

// ─── Componentes aux ──────────────────────────────────────────────────────────

function Badge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: active ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
      color: active ? "#10b981" : "#ef4444",
      border: `1px solid ${active ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] ?? "#6b7280";
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 99,
      fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
      background: `${color}20`, color, border: `1px solid ${color}40`,
    }}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = { admin: "#ef4444", auditor: "#3b82f6", viewer: "#6b7280" };
  const c = map[role] ?? "#6b7280";
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
      background: `${c}18`, color: c, border: `1px solid ${c}30`,
    }}>
      {role}
    </span>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "ok" | "err"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 18px", borderRadius: 10, maxWidth: 360,
      background: type === "ok" ? "#052e16" : "#1f0a0a",
      border: `1px solid ${type === "ok" ? "#16a34a" : "#dc2626"}`,
      color: type === "ok" ? "#4ade80" : "#f87171",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)", fontSize: 13, fontWeight: 600,
    }}>
      {type === "ok" ? <Check size={15} /> : <AlertTriangle size={15} />}
      {msg}
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#0f1629", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "4px 8px",
          }}><X size={15} /></button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Form campos ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

// ─── Page Principal ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [users,   setUsers]   = useState<UserAdmin[]>([]);
  const [meta,    setMeta]    = useState<Meta | null>(null);
  const [fetching, setFetching] = useState(true);

  // Filtros
  const [search,    setSearch]    = useState("");
  const [filterRole,   setFilterRole]   = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterPlan,   setFilterPlan]   = useState("");

  // Modal
  const [modal,      setModal]      = useState<ModalMode>(null);
  const [selected,   setSelected]   = useState<UserAdmin | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Form create/edit
  const [form, setForm] = useState<{
    name: string; email: string; password: string;
    role: "admin" | "auditor" | "viewer";
    plan: string; allowed_modules: string[];
  }>({
    name: "", email: "", password: "", role: "auditor",
    plan: "starter", allowed_modules: [],
  });
  const [showPwd, setShowPwd] = useState(false);

  // Reset password
  const [newPwd,     setNewPwd]     = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);

  // History
  const [history, setHistory] = useState<any[]>([]);

  // ── Guard ──
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/dashboard");
  }, [user, loading, router]);

  // ── Fetch ──
  const fetchMeta = useCallback(async () => {
    const res = await api.get<Meta>("/admin/meta");
    setMeta(res.data);
  }, []);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try {
      const params: Record<string, string> = {};
      if (search)       params.search    = search;
      if (filterRole)   params.role      = filterRole;
      if (filterActive) params.is_active = filterActive;
      if (filterPlan)   params.plan      = filterPlan;
      const res = await api.get<UserAdmin[]>("/admin/users", { params });
      setUsers(res.data);
    } finally {
      setFetching(false);
    }
  }, [search, filterRole, filterActive, filterPlan]);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);
  useEffect(() => { if (user?.role === "admin") fetchUsers(); }, [fetchUsers, user]);

  // ── Módulos resolvidos pelo plano ──
  const resolvedModules = (plan: string): string[] => {
    if (!meta || plan === "custom") return form.allowed_modules;
    return meta.plans[plan] ?? [];
  };

  // ── Abrir modais ──
  const openCreate = () => {
    setForm({ name: "", email: "", password: "", role: "auditor", plan: "starter", allowed_modules: [] });
    setShowPwd(false);
    setModal("create");
    setSelected(null);
  };

  const openEdit = (u: UserAdmin) => {
    setForm({ name: u.name, email: u.email, password: "", role: u.role, plan: u.plan, allowed_modules: u.allowed_modules });
    setSelected(u);
    setModal("edit");
  };

  const openReset = (u: UserAdmin) => { setSelected(u); setNewPwd(""); setShowNewPwd(false); setModal("reset"); };
  const openHistory = async (u: UserAdmin) => {
    setSelected(u);
    setModal("history");
    const res = await api.get(`/admin/users/${u.id}/history`);
    setHistory(res.data);
  };

  // ── Submits ──
  const notify = (msg: string, type: "ok" | "err" = "ok") => setToast({ msg, type });

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return notify("Preencha todos os campos obrigatórios.", "err");
    setSubmitting(true);
    try {
      const payload: any = { ...form };
      if (form.plan !== "custom") delete payload.allowed_modules;
      await api.post("/admin/users", payload);
      notify("Usuário criado com sucesso!");
      setModal(null);
      fetchUsers();
    } catch (e: any) {
      notify(e.response?.data?.detail ?? "Erro ao criar usuário.", "err");
    } finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role, plan: form.plan };
      if (form.plan === "custom") payload.allowed_modules = form.allowed_modules;
      await api.patch(`/admin/users/${selected.id}`, payload);
      notify("Usuário atualizado!");
      setModal(null);
      fetchUsers();
    } catch (e: any) {
      notify(e.response?.data?.detail ?? "Erro ao atualizar.", "err");
    } finally { setSubmitting(false); }
  };

  const handleReset = async () => {
    if (!selected || newPwd.length < 6) return notify("Senha deve ter pelo menos 6 caracteres.", "err");
    setSubmitting(true);
    try {
      await api.patch(`/admin/users/${selected.id}/reset-password`, { new_password: newPwd });
      notify("Senha redefinida!");
      setModal(null);
    } catch (e: any) {
      notify(e.response?.data?.detail ?? "Erro ao redefinir senha.", "err");
    } finally { setSubmitting(false); }
  };

  const handleToggle = async (u: UserAdmin) => {
    try {
      await api.patch(`/admin/users/${u.id}/toggle-active`);
      notify(`Conta ${u.is_active ? "desativada" : "ativada"}.`);
      fetchUsers();
    } catch (e: any) {
      notify(e.response?.data?.detail ?? "Erro.", "err");
    }
  };

  // ── UI helpers ──
  const toggleModule = (mod: string) => {
    setForm(f => ({
      ...f,
      allowed_modules: f.allowed_modules.includes(mod)
        ? f.allowed_modules.filter(m => m !== mod)
        : [...f.allowed_modules, mod],
    }));
  };

  if (loading || !user) return null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg,#ef4444,#b91c1c)", boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
        }}>
          <ShieldCheck size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>Painel Admin</h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Gestão de usuários e acessos</p>
        </div>
        <button onClick={openCreate} style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: 7,
          padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
          color: "#fff", fontSize: 13, fontWeight: 700,
          boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
        }}>
          <Plus size={15} /> Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20,
        padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email…"
            style={{ ...inputStyle, paddingLeft: 30 }} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...selectStyle, flex: "0 0 130px" }}>
          <option value="">Todos os roles</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{ ...selectStyle, flex: "0 0 130px" }}>
          <option value="">Status</option>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ ...selectStyle, flex: "0 0 140px" }}>
          <option value="">Todos os planos</option>
          {Object.keys(PLAN_LABELS).map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
        </select>
        <button onClick={fetchUsers} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12,
        }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {/* Tabela */}
      <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Usuário", "Role", "Plano", "Módulos", "Status", "Criado em", "Ações"].map(h => (
                <th key={h} style={{
                  padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}>
                      <div style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.05)", width: "70%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                Nenhum usuário encontrado.
              </td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "background .15s",
                opacity: u.is_active ? 1 : 0.55,
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: "#fff",
                    }}>{u.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}><RoleBadge role={u.role} /></td>
                <td style={{ padding: "14px 16px" }}><PlanBadge plan={u.plan} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {u.allowed_modules.slice(0, 3).map(m => (
                      <span key={m} style={{
                        fontSize: 9, padding: "2px 6px", borderRadius: 99,
                        background: "rgba(59,130,246,0.12)", color: "#93c5fd",
                        border: "1px solid rgba(59,130,246,0.2)", fontWeight: 700,
                      }}>{MODULE_LABELS[m] ?? m}</span>
                    ))}
                    {u.allowed_modules.length > 3 && (
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", alignSelf: "center" }}>
                        +{u.allowed_modules.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}><Badge active={u.is_active} /></td>
                <td style={{ padding: "14px 16px", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      { icon: Pencil,  title: "Editar",           action: () => openEdit(u),      color: "#3b82f6" },
                      { icon: Lock,    title: "Reset Senha",      action: () => openReset(u),     color: "#f59e0b" },
                      { icon: Power,   title: u.is_active ? "Desativar" : "Ativar", action: () => handleToggle(u), color: u.is_active ? "#ef4444" : "#10b981" },
                      { icon: History, title: "Histórico",        action: () => openHistory(u),   color: "#8b5cf6" },
                    ].map(({ icon: Icon, title, action, color }) => (
                      <button key={title} title={title} onClick={action} style={{
                        width: 30, height: 30, borderRadius: 7, border: `1px solid ${color}30`,
                        background: `${color}12`, color, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .15s",
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}28`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}12`; }}
                      >
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{
          padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)",
          fontSize: 11, color: "rgba(255,255,255,0.3)",
        }}>
          {users.length} usuário{users.length !== 1 ? "s" : ""} encontrado{users.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Modais ─────────────────────────────────────────────── */}

      {/* Criar */}
      {modal === "create" && (
        <Modal title="Novo Usuário" onClose={() => setModal(null)}>
          <Field label="Nome completo">
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: João Silva" />
          </Field>
          <Field label="E-mail">
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@empresa.com" />
          </Field>
          <Field label="Senha">
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: 36 }} type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
              <button onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Role">
            <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Plano">
            <select style={selectStyle} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value, allowed_modules: [] }))}>
              {Object.keys(PLAN_LABELS).map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
            </select>
          </Field>
          {form.plan !== "custom" && meta && (
            <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Módulos incluídos: <b style={{ color: "#93c5fd" }}>{(meta.plans[form.plan] ?? []).map(m => MODULE_LABELS[m]).join(", ") || "—"}</b>
            </div>
          )}
          {form.plan === "custom" && meta && (
            <Field label="Módulos liberados">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {meta.available_modules.map(m => {
                  const on = form.allowed_modules.includes(m);
                  return (
                    <button key={m} onClick={() => toggleModule(m)} style={{
                      padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: on ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${on ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                      color: on ? "#93c5fd" : "rgba(255,255,255,0.5)",
                      transition: "all .15s",
                    }}>
                      {on && <Check size={10} style={{ display: "inline", marginRight: 5 }} />}
                      {MODULE_LABELS[m]}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          <button onClick={handleCreate} disabled={submitting} style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: submitting ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", fontSize: 14, fontWeight: 700,
            opacity: submitting ? 0.7 : 1,
          }}>
            {submitting ? "Criando…" : "Criar Usuário"}
          </button>
        </Modal>
      )}

      {/* Editar */}
      {modal === "edit" && selected && (
        <Modal title={`Editar — ${selected.name}`} onClose={() => setModal(null)}>
          <Field label="Nome">
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="E-mail">
            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Role">
            <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Plano">
            <select style={selectStyle} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value, allowed_modules: [] }))}>
              {Object.keys(PLAN_LABELS).map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
            </select>
          </Field>
          {form.plan !== "custom" && meta && (
            <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Módulos: <b style={{ color: "#93c5fd" }}>{(meta.plans[form.plan] ?? []).map(m => MODULE_LABELS[m]).join(", ") || "—"}</b>
            </div>
          )}
          {form.plan === "custom" && meta && (
            <Field label="Módulos liberados">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {meta.available_modules.map(m => {
                  const on = form.allowed_modules.includes(m);
                  return (
                    <button key={m} onClick={() => toggleModule(m)} style={{
                      padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: on ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${on ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                      color: on ? "#93c5fd" : "rgba(255,255,255,0.5)",
                    }}>
                      {on && <Check size={10} style={{ display: "inline", marginRight: 5 }} />}
                      {MODULE_LABELS[m]}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
          <button onClick={handleEdit} disabled={submitting} style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: submitting ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#10b981,#047857)", color: "#fff", fontSize: 14, fontWeight: 700,
            opacity: submitting ? 0.7 : 1,
          }}>
            {submitting ? "Salvando…" : "Salvar Alterações"}
          </button>
        </Modal>
      )}

      {/* Reset senha */}
      {modal === "reset" && selected && (
        <Modal title={`Reset de Senha — ${selected.name}`} onClose={() => setModal(null)}>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Digite a nova senha para <b style={{ color: "#fff" }}>{selected.email}</b>.
          </p>
          <Field label="Nova senha">
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: 36 }} type={showNewPwd ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mínimo 6 caracteres" />
              <button onClick={() => setShowNewPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <button onClick={handleReset} disabled={submitting || newPwd.length < 6} style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none",
            cursor: submitting || newPwd.length < 6 ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff", fontSize: 14, fontWeight: 700,
            opacity: submitting || newPwd.length < 6 ? 0.6 : 1,
          }}>
            {submitting ? "Redefinindo…" : "Redefinir Senha"}
          </button>
        </Modal>
      )}

      {/* Histórico */}
      {modal === "history" && selected && (
        <Modal title={`Histórico — ${selected.name}`} onClose={() => setModal(null)}>
          {history.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              Nenhuma auditoria registrada.
            </p>
          ) : history.map((h: any, i) => (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: 8, marginBottom: 8,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#93c5fd" }}>{h.audit_type ?? h.type ?? "Auditoria"}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{new Date(h.created_at).toLocaleString("pt-BR")}</span>
              </div>
              {h.summary && <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{h.summary}</p>}
            </div>
          ))}
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
