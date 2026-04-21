import Link from "next/link";
import { PenLine, ScanSearch, MessageSquare, ArrowRight, Check } from "lucide-react";
import { cn } from "@/app/lib/utils";

const ASSISTANTS = [
  {
    name: "Doku Genera",
    tagline: "Redactá cualquier documento legal en minutos",
    description:
      "Describí lo que necesitás en lenguaje natural y la IA redacta el documento completo: contratos, cartas documento, poderes notariales, acuerdos de confidencialidad y más.",
    icon: PenLine,
    color: "from-primary to-violet-600",
    lightColor: "bg-primary/10 text-primary",
    features: [
      "Chat conversacional con IA",
      "Documentos de referencia (imita tu estilo)",
      "Descarga en PDF y Word",
      "Revisiones inteligentes con sugerencias",
    ],
    example: {
      input: "Necesito un contrato de locación para un departamento en Corrientes capital, alquiler de $300.000 por mes, 2 años de duración.",
      output: "CONTRATO DE LOCACIÓN — Entre el Sr. [LOCADOR], DNI...",
    },
  },
  {
    name: "Doku Analiza",
    tagline: "Detectá riesgos en contratos automáticamente",
    description:
      "Subí cualquier contrato y la IA lo analiza cláusula por cláusula. Identifica riesgos, ambigüedades y cláusulas abusivas con nivel de riesgo alto, medio o bajo.",
    icon: ScanSearch,
    color: "from-amber-500 to-orange-600",
    lightColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    features: [
      "Análisis de cláusulas riesgosas",
      "Nivel de riesgo por sección",
      "Informe descargable en PDF",
      "Sugerencias de modificación",
    ],
    example: {
      input: "Contrato de locación comercial (12 páginas) — subido como PDF",
      output: "🔴 Cláusula 8: Riesgo alto — La penalidad por rescisión anticipada...",
    },
  },
  {
    name: "Doku Consulta",
    tagline: "Preguntale a la IA sobre tus documentos",
    description:
      "Seleccioná cualquier documento generado y hacé preguntas en lenguaje natural. La IA responde con precisión basándose en el contenido exacto del documento.",
    icon: MessageSquare,
    color: "from-emerald-500 to-teal-600",
    lightColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    features: [
      "Preguntas sobre cláusulas específicas",
      "Explicación en lenguaje simple",
      "Asistente siempre disponible",
      "Contexto basado en el documento real",
    ],
    example: {
      input: "¿Qué pasa si el inquilino no paga 2 meses seguidos según este contrato?",
      output: "Según la cláusula 12, ante falta de pago de 2 períodos...",
    },
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 md:px-20 bg-slate-50 dark:bg-slate-900/30" id="funciones">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Tres asistentes IA,<br className="hidden md:block" /> un solo lugar
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
            Cada asistente está especializado en una tarea distinta, todos entrenados en normativa argentina.
          </p>
        </div>

        {/* Assistants */}
        <div className="space-y-8">
          {ASSISTANTS.map((a, i) => {
            const Icon = a.icon;
            const isReversed = i % 2 !== 0;

            return (
              <div
                key={a.name}
                className={cn(
                  "grid grid-cols-1 lg:grid-cols-2 gap-8 items-center rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-sm",
                  isReversed && "lg:[&>*:first-child]:order-2"
                )}
              >
                {/* Info */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className={cn("size-11 rounded-2xl flex items-center justify-center bg-gradient-to-br", a.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asistente IA</p>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{a.name}</h3>
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-snug">
                    {a.tagline}
                  </p>

                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {a.description}
                  </p>

                  <ul className="space-y-2">
                    {a.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <div className={cn("size-5 rounded-full flex items-center justify-center flex-shrink-0", a.lightColor)}>
                          <Check className="w-3 h-3" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Probarlo gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Example chat bubble */}
                <div className="space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-primary text-white text-sm rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                      {a.example.input}
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex items-start gap-3">
                    <div className={cn("size-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br mt-1", a.color)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="max-w-[85%] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="font-semibold text-xs text-slate-400 mb-1">{a.name}</p>
                      {a.example.output}
                      <span className="inline-block w-0.5 h-3.5 bg-slate-400 ml-0.5 animate-pulse align-middle" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
