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
        bg:               "#0A0A0F",
        surface:          "#12121A",
        "surface-elevated": "#1C1C28",
        accent:           "#6C63FF",
        "accent-dim":     "#4A43CC",
        "accent-glow":    "rgba(108,99,255,0.25)",
        danger:           "#FF4560",
        success:          "#00E396",
        warning:          "#FEB019",
        "text-primary":   "#F0F0FF",
        "text-muted":     "#6B7280",
        border:           "#2A2A3A",
        "border-bright":  "#3A3A50",
      },
      fontFamily: {
        sans:  ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono:  ["Space Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "12px",
        "2xl": "12px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        accent: "0 0 24px rgba(108,99,255,0.3)",
        "accent-sm": "0 0 12px rgba(108,99,255,0.2)",
        danger: "0 0 20px rgba(255,69,96,0.3)",
        success: "0 0 20px rgba(0,227,150,0.3)",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #6C63FF 0%, #9B8FFF 100%)",
        "gradient-danger": "linear-gradient(135deg, #FF4560 0%, #FF7A8A 100%)",
        "gradient-success": "linear-gradient(135deg, #00E396 0%, #00B377 100%)",
        "gradient-surface": "linear-gradient(135deg, rgba(28,28,40,0.8) 0%, rgba(18,18,26,0.9) 100%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-accent": "pulseAccent 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "blink": "blink 1.2s step-end infinite",
        "wave": "wave 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseAccent: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(108,99,255,0.2)" },
          "50%": { boxShadow: "0 0 28px rgba(108,99,255,0.5)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
