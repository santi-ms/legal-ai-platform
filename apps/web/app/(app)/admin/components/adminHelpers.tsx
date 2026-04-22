/**
 * Shared helpers, constants, and tiny UI components used across admin sub-components.
 */

export const PLAN_LABELS: Record<string, string> = {
  free:    "Free",
  pro:     "Pro",
  proplus: "Pro+",
  estudio: "Estudio",
};

export const PLAN_COLORS: Record<string, string> = {
  free:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  pro:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  proplus: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  estudio: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

export function fmt(n: number) {
  return n.toLocaleString("es-AR");
}

export function fmtCost(usd: number) {
  return `$${usd.toFixed(4)} USD`;
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{fmt(Number(value))}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
