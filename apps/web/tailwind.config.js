/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2b3bee",
        "background-light": "#f6f6f8",
        "background-dark": "#101222",
        // ── Tokens editoriales nuevos ─────────────────────────────
        ink: "#0B1220",        // Fondo dark alternativo — azul muy oscuro
        parchment: "#FAF7F2",  // Fondo light alternativo — cálido editorial
        gold: {
          DEFAULT: "#C9A961",
          50: "#FBF7EE",
          100: "#F5ECD4",
          200: "#EBD9A9",
          300: "#DCC075",
          400: "#CDAB4A",
          500: "#C9A961",
          600: "#A38640",
          700: "#7A6530",
          800: "#534520",
          900: "#2F2712",
        },
      },
      fontFamily: {
        // Sans para todo — Inter (tipografía unificada)
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        // Alias — apunta a la misma Inter para que las clases `font-display`
        // heredadas en la landing no rompan layout. Los headings usan bold/
        // extrabold + tracking-tight en vez de serif light.
        display: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        brand: "1.25rem",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(15, 23, 42, 0.08)",
        hover: "0 20px 60px -15px rgba(15, 23, 42, 0.18)",
        glow: "0 0 60px -10px rgba(43, 59, 238, 0.35)",
        "glow-gold": "0 0 60px -10px rgba(201, 169, 97, 0.35)",
      },
      backgroundImage: {
        "mesh-primary":
          "radial-gradient(at 20% 20%, rgba(43, 59, 238, 0.18) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(201, 169, 97, 0.12) 0px, transparent 50%)",
        "mesh-dark":
          "radial-gradient(at 20% 20%, rgba(43, 59, 238, 0.25) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(201, 169, 97, 0.15) 0px, transparent 50%)",
        "dotted-grid":
          "radial-gradient(circle, rgba(148, 163, 184, 0.25) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-24": "24px 24px",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "border-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "border-spin": "border-spin 6s linear infinite",
        "float-slow": "float-slow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
