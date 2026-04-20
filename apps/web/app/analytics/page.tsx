"use client";

/**
 * Página de Analytics / Estadísticas
 * Muestra métricas clave del estudio legal:
 *   - Ingresos mensuales (honorarios cobrados / facturados)
 *   - Expedientes por materia y estado
 *   - Honorarios por estado
 *   - Actuaciones últimos 30 días
 *   - Nuevos clientes por mes
 *   - Vencimientos
 */

import { useEffect, useState } from "react";
import {
  BarChart2, TrendingUp, Briefcase, Users, DollarSign,
  FileText, CalendarClock, Gavel, AlertTriangle, RefreshCw,
  CheckCircle2, Clock,
} from "lucide-react";
import { getStatsOverview, type StatsOverview } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";

// ─── Currency formatter ────────────────────────────────────────────────────────

function fmtARS(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const MATTER_COLORS: Record<string, string> = {
  civil:          "bg-blue-500",
  penal:          "bg-red-500",
  laboral:        "bg-amber-500",
  familia:        "bg-pink-500",
  comercial:      "bg-violet-500",
  administrativo: "bg-cyan-500",
  constitucional: "bg-emerald-500",
  tributario:     "bg-orange-500",
  otro:           "bg-slate-500",
};
const MATTER_LABELS: Record<string, string> = {
  civil: "Civil", penal: "Penal", laboral: "Laboral",
  familia: "Familia", comercial: "Comercial",
  administrativo: "Administrativo", constitucional: "Constitucional",
  tributario: "Tributario", otro: "Otro",
};
const STATUS_COLORS: Record<string, string> = {
  activo:     "bg-emerald-500",
  cerrado:    "bg-slate-400",
  archivado:  "bg-slate-300",
  suspendido: "bg-amber-500",
};
const STATUS_LABELS: Record<string, string> = {
  activo: "Activo", cerrado: "Cerrado", archivado: "Archivado", suspendido: "Suspendido",
};
const HONOR_COLORS: Record<string, string> = {
  cobrado:       "bg-emerald-500",
  facturado:     "bg-blue-500",
  presupuestado: "bg-amber-400",
  cancelado:     "bg-slate-400",
};
const HONOR_LABELS: Record<string, string> = {
  cobrado: "Cobrado", facturado: "Facturado",
  presupuestado: "Presupuestado", cancelado: "Cancelado",
};
const TIPO_LABELS: Record<string, string> = {
  audiencia: "Audiencia", escrito: "Escrito", notificacion: "Notificación",
  resolucion: "Resolución", pericia: "Pericia", reunion_cliente: "Reunión",
  pago: "Pago", otro: "Otro",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

function BarChart({
  data,
  valueKey,
  value2Key,
  label1,
  label2,
  color1 = "bg-emerald-500",
  color2 = "bg-blue-400/70",
  formatValue = (v: number) => String(v),
}: {
  data: Array<Record<string, any>>;
  valueKey: string;
  value2Key?: string;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(
    ...data.map((d) => Math.max(d[valueKey] ?? 0, value2Key ? (d[value2Key] ?? 0) : 0)),
    1
  );

  return (
    <div className="space-y-2">
      {(label1 || label2) && (
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {label1 && (
            <span className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-sm inline-block", color1)} />
              {label1}
            </span>
          )}
          {label2 && (
            <span className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-sm inline-block", color2)} />
              {label2}
            </span>
          )}
        </div>
      )}
      <div className="flex items-end gap-2 h-28 pt-2">
        {data.map((d, i) => {
          const v1 = d[valueKey] ?? 0;
          const v2 = value2Key ? (d[value2Key] ?? 0) : 0;
          const h1 = Math.round((v1 / max) * 100);
          const h2 = value2Key ? Math.round((v2 / max) * 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {label1 && `${label1}: ${formatValue(v1)}`}
                {label2 && value2Key && ` / ${label2}: ${formatValue(v2)}`}
                {!label1 && !label2 && formatValue(v1)}
              </div>
              <div className="flex items-end gap-0.5 flex-1 w-full">
                <div
                  className={cn("flex-1 rounded-t-sm transition-all duration-500", color1)}
                  style={{ height: `${h1}%`, minHeight: v1 > 0 ? "2px" : "0" }}
                />
                {value2Key && (
                  <div
                    className={cn("flex-1 rounded-t-sm transition-all duration-500", color2)}
                    style={{ height: `${h2}%`, minHeight: v2 > 0 ? "2px" : "0" }}
                  />
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-full px-0.5">
                {d.label ?? d.name ?? i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistributionChart({
  items,
  colorMap,
  labelMap,
}: {
  items: Array<{ key: string; count: number }>;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
}) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {items.map((item) => (
          <div
            key={item.key}
            title={`${labelMap[item.key] ?? item.key}: ${item.count}`}
            className={cn("transition-all duration-500", colorMap[item.key] ?? "bg-slate-400")}
            style={{ width: `${Math.round((item.count / total) * 100)}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-sm flex-shrink-0", colorMap[item.key] ?? "bg-slate-400")} />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {labelMap[item.key] ?? item.key}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.count}</span>
            <span className="text-[10px] text-slate-400">
              ({Math.round((item.count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarList({
  items,
  labelMap,
  color = "bg-primary",
}: {
  items: Array<{ key: string; count: number }>;
  labelMap: Record<string, string>;
  color?: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 w-28 flex-shrink-0 truncate">
            {labelMap[item.key] ?? item.key}
          </span>
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", color)}
              style={{ width: `${Math.round((item.count / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right flex-shrink-0">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getStatsOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map((i) => <div key={i} className="h-52 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          {error ?? "No se pudieron cargar las estadísticas"}
        </p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const {
    totals, ingresosPorMes, clientesPorMes,
    expedientesPorMateria, expedientesPorEstado,
    honorariosPorEstado, actuacionesPorTipo, vencimientos,
  } = data;

  const sortedMaterias = [...expedientesPorMateria].sort((a, b) => b.count - a.count);
  const sortedEstados  = [...expedientesPorEstado ].sort((a, b) => b.count - a.count);
  const sortedTipos    = [...actuacionesPorTipo   ].sort((a, b) => b.count - a.count);
  const totalVenc      = vencimientos.pendientes + vencimientos.completados + vencimientos.vencidos || 1;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Estadísticas y métricas del estudio
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Briefcase} label="Expedientes" value={totals.expedientes}
          iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Users} label="Clientes" value={totals.clientes}
          iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          icon={DollarSign} label="Total cobrado" value={fmtARS(totals.cobrado)}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={FileText} label="Documentos" value={totals.documentos}
          iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Gavel} label="Actuaciones" value={totals.actuaciones}
          iconBg="bg-rose-100 dark:bg-rose-900/30" iconColor="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Row 1: Revenue + Clients charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ingresos — últimos 6 meses
            </h2>
          </div>
          <BarChart
            data={ingresosPorMes.map((m) => ({ label: m.label, cobrado: m.cobrado, facturado: m.facturado }))}
            valueKey="cobrado"
            value2Key="facturado"
            label1="Cobrado"
            label2="Facturado"
            color1="bg-emerald-500"
            color2="bg-blue-400/70"
            formatValue={fmtARS}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Clientes nuevos — últimos 6 meses
            </h2>
          </div>
          <BarChart
            data={clientesPorMes.map((m) => ({ label: m.label, nuevos: m.nuevos }))}
            valueKey="nuevos"
            label1="Nuevos clientes"
            color1="bg-violet-500"
            formatValue={(v) => String(v)}
          />
        </div>
      </div>

      {/* Row 2: Expedientes distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Expedientes por materia
            </h2>
          </div>
          {sortedMaterias.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            : <DistributionChart
                items={sortedMaterias.map((m) => ({ key: m.materia, count: m.count }))}
                colorMap={MATTER_COLORS}
                labelMap={MATTER_LABELS}
              />
          }
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Expedientes por estado
            </h2>
          </div>
          {sortedEstados.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            : <DistributionChart
                items={sortedEstados.map((e) => ({ key: e.estado, count: e.count }))}
                colorMap={STATUS_COLORS}
                labelMap={STATUS_LABELS}
              />
          }
        </div>
      </div>

      {/* Row 3: Honorarios + Actuaciones + Vencimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Honorarios por estado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Honorarios por estado
            </h2>
          </div>
          {honorariosPorEstado.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            : (
              <div className="space-y-2.5">
                {[...honorariosPorEstado].sort((a, b) => b.monto - a.monto).map((h) => (
                  <div key={h.estado} className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-sm flex-shrink-0", HONOR_COLORS[h.estado] ?? "bg-slate-400")} />
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">
                      {HONOR_LABELS[h.estado] ?? h.estado}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmtARS(h.monto)}</span>
                    <span className="text-[10px] text-slate-400">({h.count})</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Actuaciones por tipo */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Actuaciones — últimos 30 días
            </h2>
          </div>
          {sortedTipos.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin actuaciones recientes</p>
            : <HorizontalBarList
                items={sortedTipos.map((t) => ({ key: t.tipo, count: t.count }))}
                labelMap={TIPO_LABELS}
                color="bg-rose-500"
              />
          }
        </div>

        {/* Vencimientos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Vencimientos
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
              <div className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.round((vencimientos.completados / totalVenc) * 100)}%` }} />
              <div className="bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.round((vencimientos.pendientes / totalVenc) * 100)}%` }} />
              <div className="bg-red-500 transition-all duration-500"
                style={{ width: `${Math.round((vencimientos.vencidos / totalVenc) * 100)}%` }} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">Completados</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{vencimientos.completados}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">Pendientes</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{vencimientos.pendientes}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">Vencidos</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{vencimientos.vencidos}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tasa de cumplimiento:{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round((vencimientos.completados / totalVenc) * 100)}%
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
