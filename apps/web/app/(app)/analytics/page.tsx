"use client";

/**
 * Página de Analytics / Estadísticas
 * Muestra métricas clave del estudio legal con tendencias MoM y drill-downs.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2, TrendingUp, TrendingDown, Minus, Briefcase, Users,
  DollarSign, FileText, CalendarClock, Gavel, AlertTriangle,
  RefreshCw, CheckCircle2, Clock, ArrowRight,
} from "lucide-react";
import { getStatsOverview, type StatsOverview } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatsGrid } from "@/components/ui/StatsGrid";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtARS(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

function pctChange(current: number, prev: number): number | null {
  if (prev === 0 && current === 0) return null;
  if (prev === 0) return 100;
  return Math.round(((current - prev) / prev) * 100);
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const MATTER_COLORS: Record<string, string> = {
  civil: "bg-blue-500", penal: "bg-red-500", laboral: "bg-amber-500",
  familia: "bg-pink-500", comercial: "bg-violet-500",
  administrativo: "bg-cyan-500", constitucional: "bg-emerald-500",
  tributario: "bg-orange-500", otro: "bg-slate-500",
};
const MATTER_LABELS: Record<string, string> = {
  civil: "Civil", penal: "Penal", laboral: "Laboral",
  familia: "Familia", comercial: "Comercial",
  administrativo: "Administrativo", constitucional: "Constitucional",
  tributario: "Tributario", otro: "Otro",
};
const STATUS_COLORS: Record<string, string> = {
  activo: "bg-emerald-500", cerrado: "bg-slate-400",
  archivado: "bg-slate-300", suspendido: "bg-amber-500",
};
const STATUS_LABELS: Record<string, string> = {
  activo: "Activo", cerrado: "Cerrado", archivado: "Archivado", suspendido: "Suspendido",
};
const HONOR_COLORS: Record<string, string> = {
  cobrado: "bg-emerald-500", facturado: "bg-blue-500",
  presupuestado: "bg-amber-400", cancelado: "bg-slate-400",
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

// ─── KPI Card with trend ─────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, iconBg, iconColor, trend, trendLabel, href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  trend?: number | null;
  trendLabel?: string;
  href?: string;
}) {
  const trendPositive = trend !== null && trend !== undefined && trend > 0;
  const trendNegative = trend !== null && trend !== undefined && trend < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  const inner = (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        {href && (
          <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
        )}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">{value}</p>
      {trend !== undefined && trend !== null && (
        <div className={cn(
          "mt-2 flex items-center gap-1 text-[11px] font-semibold",
          trendPositive ? "text-emerald-600 dark:text-emerald-400"
            : trendNegative ? "text-red-500 dark:text-red-400"
            : "text-slate-400"
        )}>
          <TrendIcon className="w-3 h-3" />
          {trend > 0 ? "+" : ""}{trend}% {trendLabel ?? "vs mes anterior"}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all group cursor-pointer"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col">
      {inner}
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({
  data, valueKey, value2Key, label1, label2,
  color1 = "bg-emerald-500", color2 = "bg-blue-400/70",
  formatValue = (v: number) => String(v),
}: {
  data: Array<Record<string, any>>;
  valueKey: string; value2Key?: string;
  label1?: string; label2?: string;
  color1?: string; color2?: string;
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
          {label1 && <span className="flex items-center gap-1"><span className={cn("w-2 h-2 rounded-sm inline-block", color1)} />{label1}</span>}
          {label2 && <span className="flex items-center gap-1"><span className={cn("w-2 h-2 rounded-sm inline-block", color2)} />{label2}</span>}
        </div>
      )}
      <div className="flex items-end gap-2 h-28 pt-2">
        {data.map((d, i) => {
          const v1 = d[valueKey] ?? 0;
          const v2 = value2Key ? (d[value2Key] ?? 0) : 0;
          const h1 = Math.round((v1 / max) * 100);
          const h2 = value2Key ? Math.round((v2 / max) * 100) : 0;
          const isLast = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {label1 && `${label1}: ${formatValue(v1)}`}
                {label2 && value2Key && ` / ${label2}: ${formatValue(v2)}`}
                {!label1 && !label2 && formatValue(v1)}
              </div>
              <div className="flex items-end gap-0.5 flex-1 w-full">
                <div
                  className={cn("flex-1 rounded-t-sm transition-all duration-500", color1, isLast ? "opacity-100" : "opacity-70")}
                  style={{ height: `${h1}%`, minHeight: v1 > 0 ? "2px" : "0" }}
                />
                {value2Key && (
                  <div
                    className={cn("flex-1 rounded-t-sm transition-all duration-500", color2, isLast ? "opacity-100" : "opacity-70")}
                    style={{ height: `${h2}%`, minHeight: v2 > 0 ? "2px" : "0" }}
                  />
                )}
              </div>
              <span className={cn(
                "text-[10px] truncate max-w-full px-0.5",
                isLast ? "text-slate-600 dark:text-slate-300 font-semibold" : "text-slate-400 dark:text-slate-500"
              )}>
                {d.label ?? d.name ?? i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Distribution chart ───────────────────────────────────────────────────────

function DistributionChart({
  items, colorMap, labelMap, onClickItem,
}: {
  items: Array<{ key: string; count: number }>;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
  onClickItem?: (key: string) => void;
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
          <button
            key={item.key}
            onClick={() => onClickItem?.(item.key)}
            className={cn(
              "flex items-center gap-1.5 text-left",
              onClickItem && "hover:opacity-75 transition-opacity cursor-pointer"
            )}
          >
            <span className={cn("w-2 h-2 rounded-sm flex-shrink-0", colorMap[item.key] ?? "bg-slate-400")} />
            <span className="text-xs text-slate-600 dark:text-slate-400">{labelMap[item.key] ?? item.key}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.count}</span>
            <span className="text-[10px] text-slate-400">({Math.round((item.count / total) * 100)}%)</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal bar list ──────────────────────────────────────────────────────

function HorizontalBarList({
  items, labelMap, color = "bg-primary",
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

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Section({ title, icon: Icon, iconColor, children, action }: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", iconColor)} />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getStatsOverview());
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <PageSkeleton variant="dashboard" count={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <EmptyState
          icon={AlertTriangle}
          iconGradient="rose"
          title="No se pudieron cargar las estadísticas"
          description={error ?? "Hubo un problema al obtener los datos del estudio."}
          primaryAction={
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  const {
    totals, ingresosPorMes, clientesPorMes,
    expedientesPorMateria, expedientesPorEstado,
    honorariosPorEstado, actuacionesPorTipo, vencimientos,
  } = data;

  // Trend calculations (current month vs previous month)
  const revMonths     = ingresosPorMes.slice(-2);
  const clientMonths  = clientesPorMes.slice(-2);
  const revCurrent    = revMonths[revMonths.length - 1]?.cobrado ?? 0;
  const revPrev       = revMonths.length >= 2 ? (revMonths[revMonths.length - 2]?.cobrado ?? 0) : 0;
  const clientCurrent = clientMonths[clientMonths.length - 1]?.nuevos ?? 0;
  const clientPrev    = clientMonths.length >= 2 ? (clientMonths[clientMonths.length - 2]?.nuevos ?? 0) : 0;
  const revTrend      = pctChange(revCurrent, revPrev);
  const clientTrend   = pctChange(clientCurrent, clientPrev);

  const sortedMaterias = [...expedientesPorMateria].sort((a, b) => b.count - a.count);
  const sortedEstados  = [...expedientesPorEstado ].sort((a, b) => b.count - a.count);
  const sortedTipos    = [...actuacionesPorTipo   ].sort((a, b) => b.count - a.count);
  const totalVenc      = vencimientos.pendientes + vencimientos.completados + vencimientos.vencidos || 1;
  const compliancePct  = Math.round((vencimientos.completados / totalVenc) * 100);

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-5 sm:space-y-8 max-w-7xl mx-auto w-full">

      {/* Header */}
      <PageHeader
        icon={BarChart2}
        iconGradient="primary"
        title="Analytics"
        description={`Estadísticas y métricas del estudio${lastUpdated ? ` · actualizado ${lastUpdated.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}`}
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        }
      />

      {/* KPI Cards — with trends and drill-down links */}
      <StatsGrid
        columns={5}
        items={[
          { icon: Briefcase,  label: "Expedientes",    value: totals.expedientes,          tone: "sky",     href: "/expedientes" },
          { icon: Users,      label: "Clientes",       value: totals.clientes,             tone: "violet",  href: "/clients",
            change: clientTrend != null ? { value: `${clientTrend > 0 ? "+" : ""}${clientTrend}%`, isPositive: clientTrend >= 0 } : undefined },
          { icon: DollarSign, label: "Total cobrado",  value: fmtARS(totals.cobrado),      tone: "emerald", href: "/finanzas?estado=cobrado",
            change: revTrend != null ? { value: `${revTrend > 0 ? "+" : ""}${revTrend}%`, isPositive: revTrend >= 0 } : undefined },
          { icon: FileText,   label: "Documentos",     value: totals.documentos,           tone: "amber",   href: "/documents" },
          { icon: Gavel,      label: "Actuaciones",    value: totals.actuaciones,          tone: "rose"  },
        ]}
      />

      {/* Row 1: Revenue + Clients charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Ingresos — últimos 6 meses"
          icon={TrendingUp} iconColor="text-emerald-500"
          action={
            <Link href="/finanzas" className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 transition-colors">
              Ver finanzas <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <BarChart
            data={ingresosPorMes.map((m) => ({ label: m.label.slice(0, 3), cobrado: m.cobrado, facturado: m.facturado }))}
            valueKey="cobrado"
            value2Key="facturado"
            label1="Cobrado"
            label2="Facturado"
            color1="bg-emerald-500"
            color2="bg-blue-400/70"
            formatValue={fmtARS}
          />
        </Section>

        <Section
          title="Clientes nuevos — últimos 6 meses"
          icon={Users} iconColor="text-violet-500"
          action={
            <Link href="/clients" className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 transition-colors">
              Ver clientes <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <BarChart
            data={clientesPorMes.map((m) => ({ label: m.label.slice(0, 3), nuevos: m.nuevos }))}
            valueKey="nuevos"
            label1="Nuevos clientes"
            color1="bg-violet-500"
            formatValue={(v) => String(v)}
          />
        </Section>
      </div>

      {/* Row 2: Expedientes distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Expedientes por materia"
          icon={Briefcase} iconColor="text-blue-500"
          action={
            <Link href="/expedientes" className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 transition-colors">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {sortedMaterias.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            : <DistributionChart
                items={sortedMaterias.map((m) => ({ key: m.materia, count: m.count }))}
                colorMap={MATTER_COLORS}
                labelMap={MATTER_LABELS}
                onClickItem={(key) => {
                  window.location.href = `/expedientes?matter=${key}`;
                }}
              />
          }
        </Section>

        <Section
          title="Expedientes por estado"
          icon={Briefcase} iconColor="text-slate-500"
          action={
            <Link href="/expedientes" className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 transition-colors">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {sortedEstados.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            : <DistributionChart
                items={sortedEstados.map((e) => ({ key: e.estado, count: e.count }))}
                colorMap={STATUS_COLORS}
                labelMap={STATUS_LABELS}
                onClickItem={(key) => {
                  window.location.href = `/expedientes?status=${key}`;
                }}
              />
          }
        </Section>
      </div>

      {/* Row 3: Honorarios + Actuaciones + Vencimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Honorarios por estado */}
        <Section
          title="Honorarios por estado"
          icon={DollarSign} iconColor="text-emerald-500"
          action={
            <Link href="/finanzas" className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 transition-colors">
              Ver <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          {honorariosPorEstado.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            : (
              <div className="space-y-2.5">
                {[...honorariosPorEstado].sort((a, b) => b.monto - a.monto).map((h) => (
                  <Link
                    key={h.estado}
                    href={`/finanzas?estado=${h.estado}`}
                    className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-1 px-1 rounded transition-colors"
                  >
                    <span className={cn("w-2.5 h-2.5 rounded-sm flex-shrink-0", HONOR_COLORS[h.estado] ?? "bg-slate-400")} />
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">
                      {HONOR_LABELS[h.estado] ?? h.estado}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmtARS(h.monto)}</span>
                    <span className="text-[10px] text-slate-400">({h.count})</span>
                  </Link>
                ))}
              </div>
            )
          }
        </Section>

        {/* Actuaciones por tipo */}
        <Section
          title="Actuaciones — últimos 30 días"
          icon={Gavel} iconColor="text-rose-500"
        >
          {sortedTipos.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">Sin actuaciones recientes</p>
            : <HorizontalBarList
                items={sortedTipos.map((t) => ({ key: t.tipo, count: t.count }))}
                labelMap={TIPO_LABELS}
                color="bg-rose-500"
              />
          }
        </Section>

        {/* Vencimientos */}
        <Section
          title="Vencimientos"
          icon={CalendarClock} iconColor="text-amber-500"
          action={
            <Link href="/vencimientos" className="text-xs text-slate-400 hover:text-primary flex items-center gap-0.5 transition-colors">
              Ver <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
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
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tasa de cumplimiento
                </p>
                <span className={cn(
                  "text-sm font-bold",
                  compliancePct >= 75 ? "text-emerald-600 dark:text-emerald-400"
                  : compliancePct >= 50 ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
                )}>
                  {compliancePct}%
                </span>
              </div>
            </div>
          </div>
        </Section>
      </div>

    </div>
  );
}
