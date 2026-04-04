"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogOut, LayoutDashboard, FileCode2, Database, FileText, Bell, Settings, User, ChevronRight, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import OnboardingTour from "@/components/OnboardingTour";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AppInner>{children}</AppInner>
    </LanguageProvider>
  );
}

function AppInner({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !localStorage.getItem("privyon_onboarded")) setShowTour(true);
  }, [user, loading, router]);

  const NAV = [
    { section: "Principal", items: [
      { icon: LayoutDashboard, label: t.dashboard,  href: "/dashboard"  },
      { icon: FileCode2,       label: t.analyze,    href: "/analyze"    },
      { icon: Database,        label: t.dbaudit,    href: "/db-audit"   },
      { icon: Activity,        label: t.dbmonitor,  href: "/db-monitor" },
    ]},
    { section: "Resultados", items: [
      { icon: FileText, label: t.reports, href: "/reports" },
      { icon: Bell,     label: t.alerts,  href: "/alerts",  badge: 3   },
    ]},
    { section: "Conta", items: [
      { icon: Settings, label: t.settings, href: "/settings" },
      { icon: User,     label: t.profile,  href: "/profile"  },
    ]},
  ];

  if (loading || !user) return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      <aside className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 225, background: "#0f1629" }}>
        <div className="h-[58px] px-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="skeleton w-8 h-8 rounded-lg" style={{ background: "#1e2d5a" }} />
          <div className="skeleton h-3 w-20" style={{ background: "#1e2d5a" }} />
        </div>
        <div className="flex-1 p-3 flex flex-col gap-2">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-9 rounded-lg" style={{ background: "#1e2d5a" }} />)}
        </div>
      </aside>
      <DashboardSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0"
        style={{ width: 225, background: "#0f1629", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="h-[58px] flex items-center gap-2.5 px-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
            style={{ background: "#3b82f6", boxShadow: "0 2px 8px rgba(59,130,246,0.4)" }}>
            <ShieldCheck size={16} color="white" />
          </div>
          <span className="text-[16px] font-extrabold text-white">Priv<span style={{ color: "#3b82f6" }}>yon</span></span>
          <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>v1.0</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2.5">
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[9px] font-black uppercase px-2.5 py-2 mt-1"
                style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em" }}>{section}</p>
              {items.map(({ icon: Icon, label, href, badge }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-[12px] font-semibold transition-all relative"
                    style={{ background: active ? "#1e2d5a" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.5)" }}>
                    {active && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm" style={{ background: "#3b82f6" }} />}
                    <Icon size={15} style={{ opacity: active ? 1 : 0.7 }} />
                    {label}
                    {badge && <span className="ml-auto text-[9px] font-black text-white min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center" style={{ background: "#ef4444" }}>{badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="flex-shrink-0 p-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/profile"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1.5 transition-colors"
            style={{ color: "inherit" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)" }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>{user.role}</p>
            </div>
            <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)", marginLeft: "auto" }} />
          </Link>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(255,255,255,0.35)" }}>
            <LogOut size={12} />{t.logout}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 page-enter">{children}</div>
      {showTour && <OnboardingTour onFinish={() => { localStorage.setItem("privyon_onboarded","1"); setShowTour(false); }} />}
    </div>
  );
}
