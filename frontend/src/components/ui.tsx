"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Topbar({ breadcrumb, children }: { breadcrumb: string; children?: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <header className="h-[58px] flex items-center justify-between px-6 flex-shrink-0"
      style={{ background:"var(--topbar-bg)", borderBottom:"1px solid var(--border)" }}>
      <div className="flex items-center gap-2 text-sm">
        <span style={{ color:"var(--text-3)", fontWeight:500 }}>Privyon</span>
        <span style={{ color:"var(--border2)" }}>›</span>
        <span className="font-bold" style={{ color:"var(--text)" }}>{breadcrumb}</span>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Link href="/alerts" aria-label="Ver alertas" className="relative w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-colors"
          style={{ border:"1px solid var(--border)", background:"var(--card-bg)", color:"var(--text-2)" }}>
          <Bell size={15}/>
          <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full"
            style={{ background:"var(--danger)", border:"1.5px solid var(--topbar-bg)" }}/>
        </Link>
        <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
          style={{ border:"1px solid var(--border)", background:"var(--card-bg)" }}>
          <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-[11px] font-extrabold text-white"
            style={{ background:"var(--accent)" }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-[12px] font-bold" style={{ color:"var(--text)" }}>{user?.name?.split(" ")[0]}</span>
        </Link>
      </div>
    </header>
  );
}

export function Card({ children, className="", style={} }: { children:React.ReactNode; className?:string; style?:React.CSSProperties }) {
  return (
    <div className={`rounded-xl ${className}`}
      style={{
        background:"var(--card-bg)",
        border:"var(--card-border-w) solid var(--border)",
        boxShadow:"var(--card-shadow)",
        ...style,
      }}>
      {children}
    </div>
  );
}

export function Badge({ children, variant="blue" }: { children:React.ReactNode; variant?:"red"|"amber"|"blue"|"green"|"slate" }) {
  return <span className={`badge badge-${variant} font-data`}>{children}</span>;
}

export function BtnPrimary({ children, onClick, type="button", disabled=false, className="" }: {
  children:React.ReactNode; onClick?:()=>void; type?:"button"|"submit"; disabled?:boolean; className?:string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold text-white transition-all disabled:opacity-50 ${className}`}
      style={{ background:"var(--accent)" }}>
      {children}
    </button>
  );
}

export function BtnOutline({ children, onClick, className="" }: { children:React.ReactNode; onClick?:()=>void; className?:string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${className}`}
      style={{ background:"var(--card-bg)", color:"var(--text-2)", border:"1px solid var(--border)" }}>
      {children}
    </button>
  );
}
