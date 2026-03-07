import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Privyon — Auditoria LGPD",
  description: "Privyon: auditoria automatizada de conformidade LGPD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
