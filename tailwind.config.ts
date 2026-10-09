import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Map the app's semantic color names onto the Susbase design tokens so
      // existing utility classes (text-ink / text-muted / border-line /
      // bg-accent …) pick up the new look without touching component structure.
      colors: {
        ink: "var(--text)",
        muted: "var(--text-muted)",
        subtle: "var(--text-subtle)",
        line: "var(--border)",
        accent: "var(--accent)",
        surface: "var(--surface)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      // Radii and shadows must resolve to the tokens too — without this,
      // rounded-* / shadow-* silently fall back to Tailwind's defaults.
      borderRadius: {
        none: "0",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-xl)",
        full: "var(--radius-pill)",
      },
      boxShadow: {
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        none: "none",
      },
    },
  },
  plugins: [],
};

export default config;
