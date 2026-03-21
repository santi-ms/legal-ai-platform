"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, Theme } from "@/components/ui/ThemeProvider";
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
    <div className="px-4 py-8 border-t border-slate-200 dark:border-slate-800 mt-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <Moon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Apariencia</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Elegí cómo querés ver la interfaz.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-slate-900"
              )}
              aria-pressed={isSelected}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-colors",
                  isSelected ? "text-primary" : "text-slate-400 dark:text-slate-500"
                )}
              />
              <div>
                <p
                  className={cn(
                    "font-bold text-sm transition-colors",
                    isSelected
                      ? "text-primary"
                      : "text-slate-800 dark:text-slate-200"
                  )}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
