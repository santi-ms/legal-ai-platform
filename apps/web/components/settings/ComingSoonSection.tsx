"use client";

import { Construction, Check } from "lucide-react";

interface ComingSoonSectionProps {
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoonSection({ title, description, features }: ComingSoonSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
      <div className="px-6 sm:px-10 py-10 sm:py-14 text-center">
        <div className="flex justify-center mb-6">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 text-white flex items-center justify-center shadow-soft">
            <Construction className="w-8 h-8" />
          </div>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400 mb-2">
          Próximamente
        </p>
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-ink dark:text-white">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>

        {features && features.length > 0 && (
          <div className="mt-8 max-w-xl mx-auto bg-parchment/60 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl p-6 text-left">
            <h4 className="text-sm font-bold text-ink dark:text-white mb-4">
              Funcionalidades próximas
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
