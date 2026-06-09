interface PrivyonLogoProps {
  /** Altura total do logo em px (largura proporcional automática) */
  height?: number;
  /** Mostrar o tagline "PRIVACIDADE. CONFORMIDADE. CONFIANÇA." */
  showTagline?: boolean;
  className?: string;
}

/**
 * Logo oficial Privyon — escudo azul com check + wordmark.
 * Substitui o ShieldCheck + texto manual em todos os pontos do sistema.
 */
export default function PrivyonLogo({ height = 36, showTagline = false, className = "" }: PrivyonLogoProps) {
  const aspectRatio = showTagline ? 3.2 : 4.2;
  const width = height * aspectRatio;

  return (
    <svg
      viewBox={showTagline ? "0 0 320 100" : "0 0 280 70"}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Privyon"
    >
      <defs>
        {/* Gradiente azul do escudo */}
        <linearGradient id="pv-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>

        {/* Gradiente do "yon" no wordmark */}
        <linearGradient id="pv-text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Brilho interno do escudo */}
        <linearGradient id="pv-inner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* ── ESCUDO ── */}
      {/* Camada externa do escudo */}
      <path
        d="M35 8 L10 18 L10 38 C10 52 22 63 35 68 C48 63 60 52 60 38 L60 18 Z"
        fill="url(#pv-shield-grad)"
      />
      {/* Camada interna (bevel) */}
      <path
        d="M35 14 L16 22 L16 38 C16 49 25 58 35 62 C45 58 54 49 54 38 L54 22 Z"
        fill="url(#pv-inner-grad)"
      />
      {/* Borda interna escura para profundidade */}
      <path
        d="M35 16 L18 24 L18 38 C18 48 26 56 35 60 C44 56 52 48 52 38 L52 24 Z"
        fill="#1e3a8a"
        opacity="0.4"
      />

      {/* Pixels decorativos (canto superior direito do escudo) */}
      <rect x="57" y="6"  width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.9" />
      <rect x="62" y="6"  width="3" height="3" rx="0.5" fill="#60a5fa" opacity="0.6" />
      <rect x="57" y="11" width="3" height="3" rx="0.5" fill="#3b82f6" opacity="0.5" />
      <rect x="62" y="11" width="2" height="2" rx="0.5" fill="#3b82f6" opacity="0.3" />
      <rect x="67" y="6"  width="2" height="2" rx="0.5" fill="#60a5fa" opacity="0.3" />

      {/* ── CHECK MARK ── */}
      <polyline
        points="24,37 31,44 47,28"
        fill="none"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── WORDMARK: "Priv" (branco) + "yon" (azul) ── */}
      <text
        x="78"
        y={showTagline ? "46" : "48"}
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="36"
        fill="white"
        letterSpacing="-0.5"
      >
        Priv
      </text>
      <text
        x="162"
        y={showTagline ? "46" : "48"}
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="800"
        fontSize="36"
        fill="url(#pv-text-grad)"
        letterSpacing="-0.5"
      >
        yon
      </text>

      {/* ── TAGLINE (opcional) ── */}
      {showTagline && (
        <text
          x="78"
          y="64"
          fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="500"
          fontSize="9"
          fill="rgba(255,255,255,0.45)"
          letterSpacing="2.5"
        >
          PRIVACIDADE. CONFORMIDADE. CONFIANÇA.
        </text>
      )}
    </svg>
  );
}
