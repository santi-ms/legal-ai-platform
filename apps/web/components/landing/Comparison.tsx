import { Clock, Zap, TrendingDown } from "lucide-react";

const COMPARISONS = [
  {
    task: "Carta documento",
    manual: "45 min",
    withUs: "2 min",
    reduction: "-95%",
  },
  {
    task: "Contrato de locación",
    manual: "1 h 30 min",
    withUs: "5 min",
    reduction: "-94%",
  },
  {
    task: "NDA / Acuerdo de confidencialidad",
    manual: "40 min",
    withUs: "3 min",
    reduction: "-92%",
  },
  {
    task: "Revisión de contrato recibido",
    manual: "1 h",
    withUs: "5 min",
    reduction: "-91%",
  },
  {
    task: "Intimación de pago",
    manual: "30 min",
    withUs: "2 min",
    reduction: "-93%",
  },
];

export function Comparison() {
  return (
    <section className="py-24 px-6 md:px-20 bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <TrendingDown className="w-3.5 h-3.5" />
            CUÁNTO TIEMPO TE AHORRA
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Horas que deberían volver{" "}
            <span className="text-primary">a tu facturación</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            Estas estimaciones están basadas en los tiempos medios de un
            abogado redactando desde cero vs. generando con DocuLex.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          {/* Header row */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-6 py-4 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <div>Tarea</div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              A mano
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              Con DocuLex
            </div>
            <div className="text-right min-w-[70px]">Ahorro</div>
          </div>

          {/* Data rows */}
          {COMPARISONS.map((row, i) => (
            <div
              key={row.task}
              className={`grid grid-cols-[1.5fr_1fr_1fr_auto] gap-4 px-6 py-5 items-center text-sm ${
                i !== COMPARISONS.length - 1
                  ? "border-b border-slate-100 dark:border-slate-800"
                  : ""
              }`}
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {row.task}
              </div>
              <div className="text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600">
                {row.manual}
              </div>
              <div className="font-bold text-primary">{row.withUs}</div>
              <div className="text-right min-w-[70px]">
                <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  {row.reduction}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          * Tiempos promedios estimados sobre redacción desde cero sin
          plantillas personalizadas. Los resultados reales pueden variar según
          la complejidad del documento.
        </p>
      </div>
    </section>
  );
}
