"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { getDocumentStats, type DocumentStats } from "@/app/lib/webApi";
import {
  BarChart2,
  FileText,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Star,
  Clock,
  RotateCcw,
  TrendingUp,
  Loader2,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  service_contract:  "Contrato de servicios",
  nda:               "Acuerdo de confidencialidad",
  legal_notice:      "Carta documento",
  lease:             "Contrato de alquiler",
  debt_recognition:  "Reconocimiento de deuda",
  simple_authorization: "Autorización simple",
};

const MONTH_ABBR: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function formatMonth(yyyyMm: string) {
  const [, mm] = yyyyMm.split("-");
  return MONTH_ABBR[mm] ?? mm;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className={`flex-shrink-0 rounded-xl p-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 flex-shrink-0 text-sm text-slate-600 dark:text-slate-400 truncate">{label}</span>
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
        {value} <span className="text-xs font-normal text-slate-400">({pct}%)</span>
      </span>
    </div>
  );
}

function MonthBars({ byMonth }: { byMonth: Array<{ month: string; count: number }> }) {
  const max = Math.max(...byMonth.map((m) => m.count), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {byMonth.map(({ month, count }) => {
        const heightPct = Math.round((count / max) * 100);
        return (
          <div key={month} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{count || ""}</span>
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className="w-full rounded-t-lg bg-primary/80 hover:bg-primary transition-colors"
                style={{ height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%` }}
                title={`${formatMonth(month)}: ${count} documentos`}
              />
            </div>
            <span className="text-[11px] text-slate-400">{formatMonth(month)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/analytics");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getDocumentStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full text-slate-500 text-sm">
        No se pudieron cargar las estadísticas.
      </div>
    );
  }

  const total = stats.total;

  // Status data
  const statusRows = [
    { key: "final",        label: "Final",           value: stats.byStatus.final,        icon: Star,          color: "bg-emerald-500" },
    { key: "reviewed",     label: "Revisado",        value: stats.byStatus.reviewed,     icon: CheckCircle2,  color: "bg-sky-500" },
    { key: "generated",    label: "Generado",        value: stats.byStatus.generated,    icon: Clock,         color: "bg-blue-500" },
    { key: "needs_review", label: "Requiere revisión", value: stats.byStatus.needs_review, icon: AlertTriangle, color: "bg-amber-500" },
    { key: "draft",        label: "Borrador",        value: stats.byStatus.draft,        icon: RotateCcw,     color: "bg-slate-400" },
  ];

  // Type data
  const typeRows = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({
      label: TYPE_LABELS[type] ?? type,
      value: count,
    }));

  // Month activity
  const totalActivity = stats.byMonth.reduce((s, m) => s + m.count, 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <BarChart2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Resumen de actividad de tu plataforma legal</p>
        </div>
      </div>

      {/* Overview tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={FileText}
          label="Total documentos"
          value={total}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <StatTile
          icon={Users}
          label="Clientes"
          value={stats.totalClients}
          color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
        />
        <StatTile
          icon={Briefcase}
          label="Expedientes activos"
          value={stats.expedientesActivos}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <StatTile
          icon={TrendingUp}
          label="Actividad (6 meses)"
          value={totalActivity}
          color="bg-primary/10 text-primary"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Documents by status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-5">
            Documentos por estado
          </h2>
          {total === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin documentos aún</p>
          ) : (
            <div className="space-y-3">
              {statusRows.map((row) => (
                <HorizontalBar
                  key={row.key}
                  label={row.label}
                  value={row.value}
                  total={total}
                  color={row.color}
                />
              ))}
            </div>
          )}
        </div>

        {/* Documents by type */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-5">
            Documentos por tipo
          </h2>
          {typeRows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin documentos aún</p>
          ) : (
            <div className="space-y-3">
              {typeRows.map((row, i) => (
                <HorizontalBar
                  key={i}
                  label={row.label}
                  value={row.value}
                  total={total}
                  color="bg-primary/70"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity over time */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Actividad — últimos 6 meses
          </h2>
          <span className="text-xs text-slate-400">{totalActivity} documentos generados</span>
        </div>
        {stats.byMonth.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Sin datos de actividad</p>
        ) : (
          <MonthBars byMonth={stats.byMonth} />
        )}
      </div>

      {/* Insights */}
      {stats.vencimientosUrgentes > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {stats.vencimientosUrgentes === 1
                ? "1 expediente con vencimiento urgente"
                : `${stats.vencimientosUrgentes} expedientes con vencimientos urgentes`}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Revisá la sección de Expedientes para ver los detalles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
