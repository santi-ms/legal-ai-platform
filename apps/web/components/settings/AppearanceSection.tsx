"use client";

import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { useTheme, Theme } from "@/components/ui/ThemeProvider";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/app/lib/utils";

const options: {
  value: Theme;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    value: "light",
    label: "Claro",
    icon: Sun,
    description: "Siempre usar el tema claro.",
  },
  {
    value: "dark",
    label: "Oscuro",
    icon: Moon,
    description: "Siempre usar el tema oscuro.",
  },
  {
    value: "system",
    label: "Sistema",
    icon: Monitor,
    description: "Seguir la preferencia del dispositivo.",
  },
];

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <SectionCard
      icon={Palette}
      iconGradient="violet"
      eyebrow="Interfaz"
      title="Apariencia"
      description="Elegí cómo querés ver la interfaz."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "group flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-violet-400 dark:border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 shadow-soft"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-soft"
              )}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-soft"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700",
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={cn(
                    "font-bold text-sm transition-colors",
                    isSelected
                      ? "text-violet-700 dark:text-violet-300"
                      : "text-slate-800 dark:text-slate-200",
                  )}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
