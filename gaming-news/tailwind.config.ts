import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050510",
        // Cores de cada plataforma
        pc: {
          DEFAULT: "#00D4FF",
          dark: "#0099CC",
          glow: "rgba(0, 212, 255, 0.4)",
        },
        xbox: {
          DEFAULT: "#107C10",
          dark: "#0a5a0a",
          glow: "rgba(16, 124, 16, 0.4)",
        },
        nintendo: {
          DEFAULT: "#E4000F",
          dark: "#a30009",
          glow: "rgba(228, 0, 15, 0.4)",
        },
        playstation: {
          DEFAULT: "#00439C",
          dark: "#002d6b",
          glow: "rgba(0, 67, 156, 0.4)",
        },
      },
      animation: {
        "grid-move": "gridMove 20s linear infinite",
        "ticker": "ticker 40s linear infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "scan-line": "scanLine 8s linear infinite",
      },
      keyframes: {
        gridMove: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "50px 50px" },
        },
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scanLine: {
          "0%": { top: "-10%" },
          "100%": { top: "110%" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      fontFamily: {
        mono: ["'Geist Mono'", "monospace"],
        sans: ["'Geist'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
