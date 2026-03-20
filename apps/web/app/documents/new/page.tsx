"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, ClipboardList, Sparkles, ArrowRight, ChevronLeft } from "lucide-react";

export default function NewDocumentPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Botón volver */}
      <div className="max-w-2xl w-full mb-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </button>
      </div>

      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Título */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">Nuevo documento</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            ¿Cómo querés generar tu documento?
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            Elegí el modo que mejor se adapte a vos
          </p>
        </div>

        {/* Cards de selección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {/* Flujo guiado */}
          <button
            onClick={() => router.push("/documents/new/guided")}
            className="group relative flex flex-col items-start gap-4 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary rounded-2xl text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
              <ClipboardList className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors" />
            </div>

            <div className="space-y-1.5 flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Flujo guiado
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Completás un formulario paso a paso con todos los campos del documento. Ideal para quien sabe exactamente qué necesita.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Empezar <ArrowRight className="h-3.5 w-3.5" />
            </div>

            {/* Badge */}
            <span className="absolute top-4 right-4 text-xs font-medium text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              6 tipos
            </span>
          </button>

          {/* Chat con IA */}
          <button
            onClick={() => router.push("/documents/new/chat")}
            className="group relative flex flex-col items-start gap-4 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary rounded-2xl text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>

            <div className="space-y-1.5 flex-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Chat con IA
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Describís en tus palabras lo que necesitás y la IA te hace las preguntas necesarias. Más natural y flexible.
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Empezar <ArrowRight className="h-3.5 w-3.5" />
            </div>

            {/* Badge "Nuevo" */}
            <span className="absolute top-4 right-4 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Nuevo
            </span>
          </button>
        </div>

        {/* Nota */}
        <p className="text-xs text-slate-400 dark:text-slate-600">
          Ambos modos generan el mismo documento final · Podés editarlo antes de descargar
        </p>
      </div>
    </div>
  );
}
