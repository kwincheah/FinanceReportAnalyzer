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
          bg: "#090A0C",
          surface: "#121417",
          zebra: "#16191D",
          border: "#1F2328",
          text: "#F0F3F6",
          muted: "#8B949E",
          accent: "#38BDF8",
          profit: "#10B981",
          loss: "#F85149",
          warn: "#D29922",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Consolas",
          "Monaco",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};

export default config;
