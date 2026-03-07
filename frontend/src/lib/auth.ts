import axios from "axios";
import Cookies from "js-cookie";
import type { AuthResponse, LoginFormData } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Injeta o token JWT em todas as requisições automaticamente
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redireciona para login se 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export async function login(data: LoginFormData): Promise<AuthResponse> {
  // FastAPI espera form-data para /token, não JSON
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  const res = await api.post<AuthResponse>("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // Salva o token num cookie httpOnly-like (7 dias)
  Cookies.set("access_token", res.data.access_token, {
    expires: 7,
    sameSite: "strict",
  });

  return res.data;
}

export function logout() {
  Cookies.remove("access_token");
  window.location.href = "/login";
}

export function getToken(): string | undefined {
  return Cookies.get("access_token");
}
