"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api, logout } from "@/lib/auth";
import type { User } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    const token = Cookies.get("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<User>("/auth/me");
      setUser(res.data);
    } catch {
      // Token inválido ou expirado
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  function requireAuth() {
    if (!loading && !user) {
      router.push("/login");
    }
  }

  return { user, loading, logout, requireAuth };
}
