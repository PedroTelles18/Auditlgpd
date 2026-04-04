import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Privyon — Auditoria LGPD",
  description: "Privyon: auditoria automatizada de conformidade LGPD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var p = JSON.parse(localStorage.getItem('privyon_prefs') || '{}');
            if (p.darkMode) document.documentElement.classList.add('dark');
          } catch(e) {}
        `}} />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
