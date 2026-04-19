"use client";

/**
 * OnboardingChecklist — Guía de configuración inicial para nuevos usuarios.
 *
 * Se muestra cuando el usuario no tiene datos suficientes (detectado desde stats).
 * Cuatro pasos: cliente → expediente → documento → referencia IA.
 * Cada paso muestra su estado (completo/pendiente) con CTA.
 * Colapsable y dismissible (localStorage, clave por usuario). No vuelve a aparecer una vez completado.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

const dismissedKey = (userId?: string) =>
  userId ? `lt_onboarding_dismissed_${userId}` : "lt_onboarding_dismissed";

interface Step {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  hasDocs:         boolean;
  hasClients:      boolean;
  hasExpedientes:  boolean;
  hasReferences?:  boolean;
  userId?:         string;
}

export function OnboardingChecklist({
  hasDocs,
  hasClients,
  hasExpedientes,
  hasReferences = false,
  userId,
}: OnboardingChecklistProps) {
  const [dismissed,  setDismissed]  = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setDismissed(!!localStorage.getItem(dismissedKey(userId)));
    }
  }, [userId]);

  const steps: Step[] = [
    {
      id:          "client",
      title:       "Agregá tu primer cliente",
      description: "Los clientes son la base de tu estudio. Cargá datos de contacto, DNI/CUIT y notas internas.",
      cta:         "Crear cliente",
      href:        "/clients",
      done:        hasClients,
    },
    {
      id:          "expediente",
      title:       "Creá tu primer expediente",
      description: "Organizá cada causa con tribunal, juez, parte contraria y fecha de vencimiento.",
      cta:         "Crear expediente",
      href:        "/expedientes",
      done:        hasExpedientes,
    },
    {
      id:          "document",
      title:       "Generá tu primer documento",
      description: "Seleccioná un tipo de documento, completá los datos y la IA lo redacta en segundos.",
      cta:         "Generar documento",
      href:        "/documents/new",
      done:        hasDocs,
    },
    {
      id:          "reference",
      title:       "Subí un documento de referencia",
      description: "Cargá tus propios PDFs para que la IA imite tu formato y estilo al generar documentos.",
      cta:         "Subir referencia",
      href:        "/documents/references",
      done:        hasReferences,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone        = completedCount === steps.length;
  const progress       = Math.round((completedCount / steps.length) * 100);

  // Auto-dismiss once everything is done
  useEffect(() => {
    if (allDone && mounted) {
      const t = setTimeout(() => {
        localStorage.setItem(dismissedKey(userId), "1");
        setDismissed(true);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [allDone, mounted, userId]);

  const handleDismiss = () => {
    localStorage.setItem(dismissedKey(userId), "1");
    setDismissed(true);
  };

  if (!mounted || dismissed) return null;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-300",
      allDone
        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
        : "border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5 dark:from-primary/10 dark:to-violet-500/10"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className={cn(
          "size-9 rounded-xl flex items-center justify-center flex-shrink-0",
          allDone ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-primary/10"
        )}>
          <Sparkles className={cn("w-4 h-4", allDone ? "text-emerald-600 dark:text-emerald-400" : "text-primary")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {allDone ? "¡Configuración completa!" : "Configuración inicial"}
            </h3>
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              allDone
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                : "bg-primary/10 text-primary"
            )}>
              {completedCount}/{steps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 w-full max-w-[200px] bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                allDone ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
            aria-label={collapsed ? "Expandir" : "Colapsar"}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                "relative rounded-xl p-4 border transition-all",
                step.done
                  ? "bg-white/60 dark:bg-slate-900/40 border-emerald-200 dark:border-emerald-800/50"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm"
              )}
            >
              {/* Step number + check */}
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "size-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  step.done
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  {step.done
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <span>{i + 1}</span>
                  }
                </div>
                {!step.done && (
                  <Circle className="w-4 h-4 text-slate-200 dark:text-slate-700" />
                )}
              </div>

              <h4 className={cn(
                "text-sm font-semibold mb-1",
                step.done ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-900 dark:text-white"
              )}>
                {step.title}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-3">
                {step.description}
              </p>

              {!step.done && (
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {step.cta}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
