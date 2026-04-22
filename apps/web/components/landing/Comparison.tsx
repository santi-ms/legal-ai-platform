import { Clock, Zap, TrendingDown } from "lucide-react";
import { CountUp, RevealStagger, StaggerItem } from "./motion";

interface ComparisonRow {
  task: string;
  /** Minutos estimados haciendo la tarea a mano */
  manualMinutes: number;
  /** Minutos estimados haciendo la tarea con DocuLex */
  docuLexMinutes: number;
}

const COMPARISONS: ComparisonRow[] = [
  { task: "Carta documento",              manualMinutes: 45, docuLexMinutes: 2 },
  { task: "Contrato de locación",          manualMinutes: 90, docuLexMinutes: 5 },
  { task: "NDA / Acuerdo de confidencialidad", manualMinutes: 40, docuLexMinutes: 3 },
  { task: "Revisión de contrato recibido", manualMinutes: 60, docuLexMinutes: 5 },
  { task: "Intimación de pago",            manualMinutes: 30, docuLexMinutes: 2 },
];

/** Escala fija: la barra más larga (1h 30m = 90m) = 100% de ancho */
const MAX_MINUTES = Math.max(...COMPARISONS.map((c) => c.manualMinutes));

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min === 0 ? `${h} h` : `${h} h ${min} min`;
}

function calcReduction(manual: number, withUs: number): number {
  return Math.round(((manual - withUs) / manual) * 100);
}

export function Comparison() {
  // Promedio de ahorro para el hero-number
  const avgReduction = Math.round(
    COMPARISONS.reduce((sum, c) => sum + calcReduction(c.manualMinutes, c.docuLexMinutes), 0) /
      COMPARISONS.length
  );

  return (
    <section className="relative py-28 px-6 md:px-20 bg-white dark:bg-background-dark overflow-hidden">
      {/* Dotted grid background sutil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-dotted-grid bg-grid-24 opacity-40 dark:opacity-20"
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Header editorial con hero-number */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 items-end">
          <div className="md:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 text-gold-600 dark:text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <TrendingDown className="w-3.5 h-3.5" />
              Cuánto tiempo te ahorra
            </div>
            <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.05]">
              Horas que deberían volver{" "}
              <span className="text-primary">a tu facturación</span>.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed text-pretty max-w-xl">
              Estimaciones basadas en los tiempos medios de un abogado
              redactando desde cero vs. generando con DocuLex.
            </p>
          </div>

          {/* Hero number con CountUp */}
          <div className="md:col-span-5 md:text-right">
            <div className="text-8xl md:text-9xl font-extrabold text-primary leading-none tabular-nums tracking-tight">
              <CountUp to={avgReduction} prefix="−" suffix="%" />
            </div>
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">
              Tiempo promedio ahorrado
            </div>
          </div>
        </div>

        {/* Card con barras */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft p-6 md:p-10">
          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-xs font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              A mano
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="w-3 h-3 rounded-sm bg-primary" aria-hidden="true" />
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              Con DocuLex
            </div>
          </div>

          {/* Barras con stagger */}
          <RevealStagger className="space-y-6" stagger={0.1}>
            {COMPARISONS.map((row) => {
              const manualWidth = (row.manualMinutes / MAX_MINUTES) * 100;
              const withUsWidth = (row.docuLexMinutes / MAX_MINUTES) * 100;
              const reduction = calcReduction(row.manualMinutes, row.docuLexMinutes);

              return (
                <StaggerItem key={row.task} className="group">
                  {/* Title row */}
                  <div className="flex items-baseline justify-between mb-2.5">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {row.task}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                      <TrendingDown className="w-3 h-3" />
                      −{reduction}%
                    </span>
                  </div>

                  {/* Bars */}
                  <div className="space-y-1.5">
                    {/* Manual bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-slate-300 dark:bg-slate-700 rounded-md transition-all duration-1000 ease-out group-hover:bg-slate-400 dark:group-hover:bg-slate-600"
                          style={{ width: `${manualWidth}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-[70px] text-right tabular-nums">
                        {formatMinutes(row.manualMinutes)}
                      </span>
                    </div>

                    {/* DocuLex bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-md transition-all duration-1000 ease-out shadow-[0_0_20px_-2px_rgba(43,59,238,0.5)]"
                          style={{ width: `${withUsWidth}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary w-[70px] text-right tabular-nums">
                        {formatMinutes(row.docuLexMinutes)}
                      </span>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </RevealStagger>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          * Tiempos promedios estimados sobre redacción desde cero sin plantillas
          personalizadas. Los resultados reales pueden variar según la complejidad del
          documento.
        </p>
      </div>
    </section>
  );
}
