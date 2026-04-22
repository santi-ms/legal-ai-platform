import { BookOpen, Brain, Download } from "lucide-react";
import { Reveal, RevealStagger, StaggerItem } from "./motion";

const STEPS = [
  {
    icon: BookOpen,
    title: "Elegí el tipo de documento",
    description:
      "Seleccioná entre contratos de locación, cartas documento, acuerdos de confidencialidad y más — todos adaptados a la legislación argentina.",
  },
  {
    icon: Brain,
    title: "Completá con IA",
    description:
      "Describí lo que necesitás en lenguaje natural o respondé las preguntas del asistente. La IA redacta cláusulas personalizadas en segundos.",
  },
  {
    icon: Download,
    title: "Revisá y descargá",
    description:
      "Revisá el documento con ayuda del asistente IA, hacé los ajustes necesarios y descargalo en PDF con formato profesional.",
  },
];

export function HowItWorks() {
  return (
    <section
      className="relative py-28 px-6 md:px-20 bg-white dark:bg-background-dark overflow-hidden"
      id="como-funciona"
    >
      <div className="max-w-7xl mx-auto relative">
        {/* Header editorial */}
        <Reveal className="text-center mb-16 max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 text-gold-600 dark:text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em]">
            Cómo funciona
          </div>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.05]">
            Tu flujo legal,{" "}
            <span className="text-primary">simplificado</span>.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed text-pretty">
            Olvidate de las horas perdidas redactando desde cero. Tres pasos.
          </p>
        </Reveal>

        {/* Timeline con línea conectora */}
        <div className="relative">
          {/* Línea conectora desktop */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-16 left-[16.666%] right-[16.666%] h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"
          />

          <RevealStagger className="grid grid-cols-1 md:grid-cols-3 gap-8 relative" stagger={0.15}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <StaggerItem key={index} className="relative">
                  <div className="p-8 rounded-brand bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-hover transition-all duration-300 relative overflow-hidden group h-full">
                    {/* Número decorativo en fondo — serif gigante */}
                    <div
                      aria-hidden="true"
                      className="absolute -top-4 -right-2 text-[7rem] font-extrabold text-primary/10 dark:text-primary/15 leading-none pointer-events-none select-none tracking-tight"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    {/* Icono en dot contenedor */}
                    <div className="relative bg-white dark:bg-slate-900 w-14 h-14 rounded-2xl border-2 border-primary/20 flex items-center justify-center mb-6 group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3 text-slate-900 dark:text-white leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-pretty">
                      {step.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
