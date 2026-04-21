import { BookOpen, Brain, Download } from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    title: "Elegí el tipo de documento",
    description: "Seleccioná entre contratos de locación, cartas documento, acuerdos de confidencialidad y más — todos adaptados a la legislación argentina.",
  },
  {
    icon: Brain,
    title: "Completá con IA",
    description: "Describí lo que necesitás en lenguaje natural o respondé las preguntas del asistente. La IA redacta cláusulas personalizadas en segundos.",
  },
  {
    icon: Download,
    title: "Revisá y descargá",
    description: "Revisá el documento generado con ayuda del asistente IA, hacé los ajustes necesarios y descargalo en PDF con formato profesional.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 md:px-20 bg-background-light dark:bg-background-dark" id="como-funciona">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tu flujo legal, <span className="text-primary">simplificado</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Olvídate de las horas perdidas redactando desde cero. Nuestro proceso inteligente lo hace por vos en tres pasos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-shadow relative overflow-hidden group"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform"></div>
                <div className="bg-primary/10 text-primary w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



