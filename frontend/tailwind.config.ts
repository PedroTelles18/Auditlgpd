import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080c10",
        surface: "#0d1117",
        border: "#1e2d3d",
        accent: "#00e5ff",
        "accent-dim": "#00e5ff22",
        "accent-soft": "#00e5ff99",
        "text-dim": "#5c7080",
        success: "#3ddc84",
        danger: "#ff4d6d",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Syne", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
