"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

const SCRIPT_ID = "cf-turnstile-script";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Se não tiver a site key configurada, não tenta renderizar (evita quebrar em dev local)
    if (!SITE_KEY) {
      console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY não configurada — captcha desativado.");
      return;
    }

    function renderWidget() {
      if (containerRef.current && window.turnstile && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: onVerify,
          "error-callback": () => onExpire?.(),
          "expired-callback": () => onExpire?.(),
          theme: "light",
        });
      }
    }

    // Se o script já foi carregado antes (navegação entre páginas), só renderiza
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Injeta o script do Turnstile uma única vez
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.body.appendChild(script);
    }
  }, [onVerify, onExpire]);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="mb-4" />;
}
