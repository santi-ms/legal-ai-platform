"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isAppRoute } from "@/app/lib/theme-routes";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
  /** true cuando la ruta actual fuerza dark (landing, auth, etc.) y el toggle no aplica */
  themeLocked: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "dark",
  themeLocked: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  // El toggle del usuario sólo aplica en rutas del dashboard interno.
  const themeLocked = !isAppRoute(pathname);

  // Read stored preference on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && ["light", "dark", "system"].includes(stored)) {
      setThemeState(stored);
    }
  }, []);

  // Apply dark class to <html> whenever theme or route changes
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    let isDark: boolean;
    if (themeLocked) {
      // Fuera del dashboard interno: siempre dark.
      isDark = true;
    } else if (theme === "dark") {
      isDark = true;
    } else if (theme === "light") {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    root.classList.toggle("dark", isDark);
    setResolvedTheme(isDark ? "dark" : "light");
  }, [theme, mounted, themeLocked]);

  // Follow system preference changes when theme === "system" (sólo en rutas del dashboard)
  useEffect(() => {
    if (!mounted || themeLocked) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", mq.matches);
        setResolvedTheme(mq.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [theme, mounted, themeLocked]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, themeLocked }}>
      {children}
    </ThemeContext.Provider>
  );
}
