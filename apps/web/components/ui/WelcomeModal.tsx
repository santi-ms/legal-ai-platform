"use client";

/**
 * WelcomeModal — Se muestra una sola vez al primer login.
 * Usa localStorage con clave por userId para que sea por usuario.
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  X, FileText, Briefcase, ScanSearch,
  BookMarked, Sparkles, ArrowRight,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const welcomeKey = (userId: string) => `lt_welcome_${userId}`;

const FEATURES = [
  {
    icon: FileText,
    title: "Doku Genera",
    description: "Contratos, cartas documento, poderes y más en segundos.",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    icon: ScanSearch,
    title: "Doku Analiza",
    description: "La IA detecta cláusulas riesgosas automáticamente.",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  {
    icon: BookMarked,
    title: "Doku Consulta",
    description: "Preguntale a la IA sobre cualquier documento generado.",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Briefcase,
    title: "Gestioná expedientes",
    description: "Organizá causas, vencimientos y partes de cada juicio.",
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  },
];

export function WelcomeModal() {
  const { data: session } = useSession();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userId = (session?.user as any)?.id;
    if (!userId) return;
    if (!localStorage.getItem(welcomeKey(userId))) {
      setVisible(true);
    }
  }, [session]);

  const dismiss = () => {
    const userId = (session?.user as any)?.id;
    if (userId) localStorage.setItem(welcomeKey(userId), "1");
    setVisible(false);
  };

  const handleStart = () => {
    dismiss();
    router.push("/documents/new");
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary via-primary to-violet-600 px-8 pt-8 pb-7 text-white">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold opacity-90">DocuLex</span>
          </div>
          <h2 className="text-[1.6rem] font-extrabold leading-tight tracking-tight">
            Bienvenido a tu estudio<br />jurídico con IA
          </h2>
          <p className="text-sm text-white/75 mt-2 leading-relaxed">
            Generá documentos, gestioná expedientes y analizá contratos — todo en un solo lugar.
          </p>
        </div>

        {/* Features grid */}
        <div className="p-5 grid grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4"
              >
                <div className={cn("size-8 rounded-lg flex items-center justify-center mb-2.5", f.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                  {f.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 text-sm"
          >
            Generar mi primer documento
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={dismiss}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
          >
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
