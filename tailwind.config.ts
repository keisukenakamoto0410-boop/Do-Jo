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
        // M-JUGAAD Brand Colors
        primary: {
          DEFAULT: "#00A8CC",
          light: "#33BADB",
          dark: "#006B7D",
          50: "#E6F7FB",
          100: "#CCF0F7",
          200: "#99E0EF",
          300: "#66D1E7",
          400: "#33C1DF",
          500: "#00A8CC",
          600: "#0097B8",
          700: "#006B7D",
          800: "#005566",
          900: "#003D4A",
        },
        // Accent (Dojo warmth)
        accent: {
          DEFAULT: "#FF6B35",
          warm: "#FFA726",
          50: "#FFF3EE",
          100: "#FFE7DC",
          200: "#FFCFBA",
          300: "#FFB797",
          400: "#FF9F75",
          500: "#FF6B35",
          600: "#FF5722",
          700: "#E64A19",
          800: "#BF360C",
          900: "#8B2500",
        },
        // Neutral colors
        neutral: {
          50: "#F8FAFB",
          100: "#E4E7EB",
          200: "#CBD2D9",
          300: "#9AA5B1",
          400: "#7B8794",
          500: "#616E7C",
          600: "#52606D",
          700: "#3E4C59",
          800: "#323F4B",
          900: "#1A2332",
        },
        // Semantic colors
        success: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        jp: ["var(--font-noto-sans-jp)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
