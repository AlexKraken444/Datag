import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./game/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0a0d12",
        panel: "#11161e",
        line: "#1f2733",
        ink: "#e6ecf3",
        muted: "#7a8699",
        red: { DEFAULT: "#ff4757", glow: "#ff6b7a" },
        blue: { DEFAULT: "#3aa6ff", glow: "#6cbcff" },
        accent: "#19f4d6",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(25,244,214,.25)",
        red: "0 0 24px rgba(255,71,87,.35)",
        blue: "0 0 24px rgba(58,166,255,.35)",
      },
    },
  },
  plugins: [],
};

export default config;
