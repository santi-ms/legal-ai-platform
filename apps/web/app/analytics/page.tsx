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
  UserPlus,
  Gavel,
  Share2,
  ScanText,
  Download,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  service_contract:     "Contrato de servicios",
  nda:                  "Acuerdo de confidencialidad",
  legal_notice:         "Carta documento",
  lease:                "Contrato de alquiler",
  debt_recognition:     "Reconocimiento de deuda",
  simple_authorization: "Autorización simple",
};

const MATERIA_LABELS: Record<string, string> = {
  civil:           "Civil",
  penal:           "Penal",
  laboral:         "Laboral",
  familia:         "Familia",
  comercial:       "Comercial",
  administrativo:  "Administrativo",
  otro:            "Otro",
};

const MONTH_ABBR: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

const MATERIA_COLORS: Record<string, string> = {
  civil:          "bg-sky-500",
  penal:          "bg-red-500",
  laboral:        "bg-amber-500",
  familia:        "bg-pink-500",
  comercial:      "bg-violet-500",
  administrativo: "bg-teal-500",
  otro:           "bg-slate-400",
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
  badge,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  badge?: { text: string; color: string } | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className={`flex-shrink-0 rounded-xl p-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
      </div>
      {badge && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${badge.color}`}>
          {badge.text}
        </span>
      )}
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

  function exportCsv() {
    if (!stats) return;
    const rows = [
      ["Métrica", "Valor"],
      ["Total documentos", stats.total],
      ["Documentos este mes", stats.docsThisMonth],
      ["Clientes activos", stats.totalClients],
      ["Clientes nuevos este mes", stats.newClientsThisMonth],
      ["Expedientes activos", stats.expedientesActivos],
      ["Vencimientos urgentes", stats.vencimientosUrgentes],
      ["Links de compartición activos", stats.activeShares],
      ["Análisis IA realizados", stats.totalAnalyses],
      [],
      ["Estado documentos", ""],
      ["Generados", stats.byStatus.generated],
      ["Requieren revisión", stats.byStatus.needs_review],
      ["Revisados", stats.byStatus.reviewed],
      ["Finales", stats.byStatus.final],
      ["Borradores", stats.byStatus.draft],
      [],
      ["Mes", "Documentos creados"],
      ...stats.byMonth.map(({ month, count }) => [month, count]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `docuLex-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Status data
  const statusRows = [
    { key: "final",        label: "Final",             value: stats.byStatus.final,        icon: Star,          color: "bg-emerald-500" },
    { key: "reviewed",     label: "Revisado",          value: stats.byStatus.reviewed,     icon: CheckCircle2,  color: "bg-sky-500" },
    { key: "generated",    label: "Generado",          value: stats.byStatus.generated,    icon: Clock,         color: "bg-blue-500" },
    { key: "needs_review", label: "Requiere revisión", value: stats.byStatus.needs_review, icon: AlertTriangle, color: "bg-amber-500" },
    { key: "draft",        label: "Borrador",          value: stats.byStatus.draft,        icon: RotateCcw,     color: "bg-slate-400" },
  ];

  // Type data
  const typeRows = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({
      label: TYPE_LABELS[type] ?? type,
      value: count,
    }));

  // Materia data
  const totalExpedientes = Object.values(stats.byMateria).reduce((s, v) => s + v, 0);
  const materiaRows = Object.entries(stats.byMateria)
    .sort(([, a], [, b]) => b - a)
    .map(([materia, count]) => ({
      label: MATERIA_LABELS[materia] ?? materia,
      value: count,
      color: MATERIA_COLORS[materia] ?? "bg-slate-400",
    }));

  // Month activity
  const totalActivity = stats.byMonth.reduce((s, m) => s + m.count, 0);

  // Badges for "este mes"
  const docsMonthBadge = stats.docsThisMonth > 0
    ? { text: `+${stats.docsThisMonth} este mes`, color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" }
    : null;
  const clientsMonthBadge = stats.newClientsThisMonth > 0
    ? { text: `+${stats.newClientsThisMonth} este mes`, color: "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" }
    : null;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Resumen de actividad de tu plataforma legal</p>
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Overview tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatTile
          icon={FileText}
          label="Total documentos"
          value={total}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          badge={docsMonthBadge}
        />
        <StatTile
          icon={Users}
          label="Clientes activos"
          value={stats.totalClients}
          color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          badge={clientsMonthBadge}
        />
        <StatTile
          icon={Briefcase}
          label="Expedientes activos"
          value={stats.expedientesActivos}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          badge={null}
        />
        <StatTile
          icon={TrendingUp}
          label="Actividad (6 meses)"
          value={totalActivity}
          color="bg-primary/10 text-primary"
          badge={null}
        />
        <StatTile
          icon={Share2}
          label="Links activos"
          value={stats.activeShares}
          color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
          badge={null}
        />
        <StatTile
          icon={ScanText}
          label="Análisis IA"
          value={stats.totalAnalyses}
          color="bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400"
          badge={null}
        />
      </div>

      {/* Charts row 1 */}
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

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Activity over time */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Actividad — últimos 6 meses
            </h2>
            <span className="text-xs text-slate-400">{totalActivity} docs generados</span>
          </div>
          {stats.byMonth.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin datos de actividad</p>
          ) : (
            <MonthBars byMonth={stats.byMonth} />
          )}
        </div>

        {/* Expedientes by materia */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Gavel className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Expedientes por materia
            </h2>
          </div>
          {materiaRows.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin expedientes aún</p>
          ) : (
            <div className="space-y-3">
              {materiaRows.map((row) => (
                <HorizontalBar
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  total={totalExpedientes}
                  color={row.color}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
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
        {stats.newClientsThisMonth > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 p-4">
            <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {stats.newClientsThisMonth === 1
                  ? "1 cliente nuevo este mes"
                  : `${stats.newClientsThisMonth} clientes nuevos este mes`}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Tu cartera de clientes está creciendo.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
