"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import Cookies from "js-cookie";
import { api, logout as doLogout, setDemoMode } from "@/lib/auth";
import type { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, isDemo: false, logout: doLogout, refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const refresh = useCallback(async () => {
    const token = Cookies.get("access_token");
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get<User>("/auth/me");
      const demo = res.data.email === "demo@privyon.com.br";
      setUser(res.data);
      setIsDemo(demo);
      setDemoMode(demo);
    } catch {
      doLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca o usuário UMA ÚNICA VEZ ao montar o app
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, logout: doLogout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
