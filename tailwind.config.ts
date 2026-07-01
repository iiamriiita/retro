import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, collaborative palette — Linear/Notion feel, no loud gradients.
        ink: "#1a1a1a",
        muted: "#6b7280",
        line: "#e5e7eb",
        accent: "#4f46e5",
      },
    },
  },
  plugins: [],
};

export default config;
