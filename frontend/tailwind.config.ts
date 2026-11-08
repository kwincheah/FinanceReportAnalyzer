import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#070b12",
          surface: "#0c1322",
          card: "#0e1726",
          border: "#1e293b",
          accent: "#10b981", // Emerald
          accentHover: "#059669",
          warn: "#f59e0b",
          danger: "#ef4444",
          text: "#f1f5f9",
          muted: "#64748b",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
