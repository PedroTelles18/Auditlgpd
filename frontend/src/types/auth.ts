export interface LoginFormData {
  email: string;
  password: string;
}

// ← ADD: formato salvo/retornado pelo backend em theme_preferences
export interface ThemePreferences {
  accent?: "blue" | "cyan" | "violet" | "emerald" | "amber" | "rose";
  mode?: "light" | "dark";
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "auditor" | "viewer";
    theme_preferences?: ThemePreferences; // ← ADD
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "auditor" | "viewer";
  theme_preferences?: ThemePreferences; // ← ADD
}
