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

// Bloqueia escrita para conta demo — dados simulados não vão ao banco
const WRITE_METHODS = ["post", "put", "patch", "delete"];
api.interceptors.request.use((config) => {
  const isDemo = localStorage.getItem("privyon_is_demo") === "1";
  const method = config.method?.toLowerCase() ?? "";
  const isLoginRoute = config.url?.includes("/auth/login");
  if (isDemo && WRITE_METHODS.includes(method) && !isLoginRoute) {
    return Promise.reject({
      isDemo: true,
      message: "Conta demonstração — alterações não são salvas.",
    });
  }
  return config;
});

export function setDemoMode(val: boolean) {
  localStorage.setItem("privyon_is_demo", val ? "1" : "0");
}

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

// ← ADD: recebe o token do Turnstile como segundo parâmetro
export async function login(data: LoginFormData, captchaToken?: string): Promise<AuthResponse> {
  // FastAPI espera form-data para /token, não JSON
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  // ← ADD: envia o token do captcha junto (o backend valida antes de checar a senha)
  if (captchaToken) {
    formData.append("captcha_token", captchaToken);
  }

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
  localStorage.removeItem("privyon_is_demo");
  window.location.href = "/login";
}

export function getToken(): string | undefined {
  return Cookies.get("access_token");
}
