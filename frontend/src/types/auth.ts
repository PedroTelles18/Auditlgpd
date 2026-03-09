export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "auditor" | "viewer";
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "auditor" | "viewer";
}
