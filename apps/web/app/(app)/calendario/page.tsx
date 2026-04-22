"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle2, Loader2, Bell, CalendarDays } from "lucide-react";
import Link from "next/link";
import {
  getCalendarDeadlines,
  getVencimientosForCalendar,
  type CalendarData,
  type CalendarDeadlineItem,
  type CalendarVencimientoItem,
  type DeadlineUrgency,
} from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatusPill } from "@/components/ui/StatusPill";
import { AccentStripe } from "@/components/ui/AccentStripe";
import { TOKENS, type GradientKey, type StatusKey } from "@/app/lib/design-tokens";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MATTER_LABELS: Record<string, string> = {
  civil:          "Civil",
  penal:          "Penal",
  laboral:        "Laboral",
  familia:        "Familia",
  comercial:      "Comercial",
  administrativo: "Administrativo",
  constitucional: "Constitucional",
  tributario:     "Tributario",
  otro:           "Otro",
};

/** Mapeo editorial: StatusPill tone + GradientKey para dots/stripes/icon bg.
 * `dot` es bg-gradient class para RiskDot-style inline dots sin importar el componente. */
const URGENCY_CONFIG: Record<DeadlineUrgency, {
  label:    string;
  tone:     StatusKey;
  gradient: GradientKey;
  text:     string;
  icon:     React.ElementType;
}> = {
  overdue: {
    label:    "Vencido",
    tone:     "danger",
    gradient: "rose",
    text:     "text-rose-600 dark:text-rose-400",
    icon:     AlertCircle,
  },
  urgent: {
    label:    "Urgente",
    tone:     "warning",
    gradient: "amber",
    text:     "text-amber-600 dark:text-amber-400",
    icon:     Clock,
  },
  warning: {
    label:    "Próximo",
    tone:     "warning",
    gradient: "amber",
    text:     "text-amber-600 dark:text-amber-400",
    icon:     Clock,
  },
  normal: {
    label:    "Programado",
    tone:     "success",
    gradient: "emerald",
    text:     "text-emerald-600 dark:text-emerald-400",
    icon:     CheckCircle2,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function today(): string {
  const d = new Date();
  return buildDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [data, setData]   = useState<CalendarData | null>(null);
  const [vencimientosMap, setVencimientosMap] = useState<Map<string, CalendarVencimientoItem[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // dateKey of selected day

  const todayKey = today();

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const [calResult, vencResult] = await Promise.allSettled([
        getCalendarDeadlines(y, m),
        getVencimientosForCalendar(y, m),
      ]);
      if (calResult.status === "fulfilled") setData(calResult.value);
      else throw calResult.reason;
      if (vencResult.status === "fulfilled") setVencimientosMap(vencResult.value);
    } catch (err: any) {
      setError(err.message ?? "Error al cargar el calendario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year, month);
  }, [year, month, load]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  // Build a map: dateKey → items for fast lookup
  const deadlineMap = new Map<string, CalendarDeadlineItem[]>();
  data?.days.forEach(d => deadlineMap.set(d.date, d.items));

  // Days in this month + offset for first day of week
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Selected day items
  const selectedItems = selected ? (deadlineMap.get(selected) ?? []) : null;

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <PageHeader
        icon={CalendarDays}
        iconGradient="sky"
        eyebrow="Gestión"
        title="Calendario"
        description="Visualizá los vencimientos de tus expedientes por mes."
        badge={data && data.summary.overdue > 0 ? { label: `${data.summary.overdue} vencidos`, tone: "danger" } : undefined}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Calendar panel ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Month navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              </button>

              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {MONTH_NAMES[month - 1]} {year}
                </h2>
                {(year !== now.getFullYear() || month !== now.getMonth() + 1) && (
                  <button
                    onClick={goToday}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    Hoy
                  </button>
                )}
              </div>

              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Summary strip */}
            {data && !loading && (
              <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 text-center text-xs">
                {(["overdue", "urgent", "warning", "normal"] as const).map((u) => {
                  const cfg = URGENCY_CONFIG[u];
                  return (
                    <div key={u} className="py-3 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("w-1.5 h-1.5 rounded-full bg-gradient-to-br", TOKENS.gradients[cfg.gradient])} />
                        <div className="text-lg font-bold text-ink dark:text-white">
                          {data.summary[u]}
                        </div>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">{cfg.label}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Days-of-week header */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
              {DAY_NAMES_SHORT.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <EmptyState
                icon={AlertCircle}
                iconGradient="rose"
                title="Error al cargar"
                description={error}
                primaryAction={
                  <button
                    onClick={() => load(year, month)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Reintentar
                  </button>
                }
                size="compact"
              />
            ) : (
              <div className="grid grid-cols-7">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-100 dark:border-slate-800/50 last:border-r-0" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateKey = buildDateKey(year, month, day);
                  const items = deadlineMap.get(dateKey) ?? [];
                  const vencItems = vencimientosMap.get(dateKey) ?? [];
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selected;
                  const hasItems = items.length > 0 || vencItems.length > 0;

                  // Determine worst urgency for the cell bg (expediente deadlines only)
                  const worstUrgency: DeadlineUrgency | null = items.length === 0 ? null
                    : items.some(x => x.urgency === "overdue") ? "overdue"
                    : items.some(x => x.urgency === "urgent")  ? "urgent"
                    : items.some(x => x.urgency === "warning") ? "warning"
                    : "normal";

                  const totalCount = items.length + vencItems.length;

                  return (
                    <button
                      key={day}
                      onClick={() => hasItems ? setSelected(isSelected ? null : dateKey) : undefined}
                      className={cn(
                        "min-h-[80px] p-2 border-b border-r border-slate-100 dark:border-slate-800/50 text-left transition-colors relative overflow-hidden",
                        // Wrap every 7
                        (firstDayOfMonth + day - 1) % 7 === 6 && "border-r-0",
                        hasItems  ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : "cursor-default",
                        isSelected && "ring-2 ring-inset ring-ink dark:ring-white",
                      )}
                    >
                      {/* Accent editorial — reemplaza el fondo de color saturado.
                          Stripe inferior gradient indica la peor urgencia del día. */}
                      {worstUrgency && !isSelected && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 right-0 bottom-0 h-[3px] bg-gradient-to-r pointer-events-none",
                            TOKENS.gradients[URGENCY_CONFIG[worstUrgency].gradient],
                          )}
                        />
                      )}

                      {/* Day number */}
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold",
                          isToday
                            ? "bg-ink text-white dark:bg-white dark:text-ink shadow-soft"
                            : "text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {day}
                      </span>

                      {/* Deadline dots + vencimiento dots */}
                      {hasItems && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {/* Expediente deadline dots — gradient editorial */}
                          {items.slice(0, 2).map((item) => (
                            <span
                              key={`exp_${item.id}`}
                              className={cn(
                                "inline-block w-2 h-2 rounded-full bg-gradient-to-br shadow-soft",
                                TOKENS.gradients[URGENCY_CONFIG[item.urgency].gradient]
                              )}
                            />
                          ))}
                          {/* Vencimiento dots — gradient sky editorial */}
                          {vencItems.slice(0, 2).map((item) => (
                            <span
                              key={`venc_${item.id}`}
                              className={cn(
                                "inline-block w-2 h-2 rounded-full bg-gradient-to-br shadow-soft",
                                TOKENS.gradients.sky,
                              )}
                            />
                          ))}
                          {totalCount > 4 && (
                            <span className="text-[10px] text-slate-500 leading-none">
                              +{totalCount - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
            {(["overdue", "urgent", "warning", "normal"] as const).map((u) => {
              const cfg = URGENCY_CONFIG[u];
              return (
                <div key={u} className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full bg-gradient-to-br shadow-soft", TOKENS.gradients[cfg.gradient])} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{cfg.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2.5 h-2.5 rounded-full bg-gradient-to-br shadow-soft", TOKENS.gradients.sky)} />
              <span className="text-xs text-slate-500 dark:text-slate-400">Módulo vencimientos</span>
            </div>
          </div>
        </div>

        {/* ── Sidebar panel ──────────────────────────────────────────────── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          {selected && selectedItems ? (
            <DeadlineSidebar
              dateKey={selected}
              items={selectedItems}
              vencItems={vencimientosMap.get(selected) ?? []}
              onClose={() => setSelected(null)}
            />
          ) : (
            <UpcomingDeadlinesSidebar data={data} loading={loading} vencimientosMap={vencimientosMap} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DeadlineSidebar — shows items for a selected day ───────────────────────

function DeadlineSidebar({
  dateKey,
  items,
  vencItems,
  onClose,
}: {
  dateKey: string;
  items: CalendarDeadlineItem[];
  vencItems: CalendarVencimientoItem[];
  onClose: () => void;
}) {
  const [d, m, y] = dateKey.split("-").map(Number);
  const displayDate = new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const totalCount = items.length + vencItems.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white capitalize">{displayDate}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalCount} evento{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          Cerrar
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
        {items.map((item) => (
          <DeadlineCard key={item.id} item={item} />
        ))}
        {vencItems.map((item) => (
          <VencimientoCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── UpcomingDeadlinesSidebar — shows next 7 days across all loaded data ─────

function UpcomingDeadlinesSidebar({
  data,
  loading,
  vencimientosMap,
}: {
  data: CalendarData | null;
  loading: boolean;
  vencimientosMap: Map<string, CalendarVencimientoItem[]>;
}) {
  // Collect all items, sorted by deadline
  const allItems = data?.days.flatMap(d => d.items) ?? [];
  const urgent = allItems.filter(i => i.urgency === "overdue" || i.urgency === "urgent");
  const upcoming = allItems.filter(i => i.urgency === "warning" || i.urgency === "normal");
  const totalVencimientos = Array.from(vencimientosMap.values()).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white">
          Eventos del mes
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className={cn("w-2 h-2 rounded-full bg-gradient-to-br inline-block shadow-soft", TOKENS.gradients.rose)} />
            {allItems.length} exp.
          </span>
          {totalVencimientos > 0 && (
            <span className="flex items-center gap-1">
              <span className={cn("w-2 h-2 rounded-full bg-gradient-to-br inline-block shadow-soft", TOKENS.gradients.sky)} />
              {totalVencimientos} venc.
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Hacé clic en un día para ver el detalle
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : !data || allItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Sin vencimientos este mes
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No hay expedientes con fecha límite en {MONTH_NAMES[data?.month ? data.month - 1 : new Date().getMonth()]}.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[70vh] overflow-y-auto">
          {urgent.length > 0 && (
            <div className="relative px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40">
              <AccentStripe tone="rose" thickness="thick" />
              <div className="flex items-center gap-2 pl-1">
                <p className={TOKENS.eyebrow}>
                  Vencidos / Urgentes
                </p>
                <StatusPill tone="danger" size="sm">{urgent.length}</StatusPill>
              </div>
            </div>
          )}
          {urgent.map(item => <DeadlineCard key={item.id} item={item} />)}
          {upcoming.length > 0 && (
            <div className="relative px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40">
              <AccentStripe tone="sky" thickness="thick" />
              <div className="flex items-center gap-2 pl-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Próximos
                </p>
                <StatusPill tone="info" size="sm">{upcoming.length}</StatusPill>
              </div>
            </div>
          )}
          {upcoming.map(item => <DeadlineCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}

// ─── VencimientoCard ──────────────────────────────────────────────────────────

const VENC_TIPO_LABEL: Record<string, string> = {
  audiencia:            "Audiencia",
  presentacion:         "Presentación",
  prescripcion:         "Prescripción",
  plazo_legal:          "Plazo legal",
  vencimiento_contrato: "Vto. contrato",
  notificacion:         "Notificación",
  pericia:              "Pericia",
  traslado:             "Traslado",
  otro:                 "Otro",
};

function VencimientoCard({ item }: { item: CalendarVencimientoItem }) {
  const isOverdue = item.estado === "vencido";
  const gradient: GradientKey = isOverdue ? "rose" : "sky";
  const tone: StatusKey = isOverdue ? "danger" : "info";
  const deadlineDate = new Date(item.fechaVencimiento).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href="/vencimientos"
      className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br text-white shadow-soft",
          TOKENS.gradients[gradient],
        )}>
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {item.titulo}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusPill tone={tone} size="sm">
              {isOverdue ? "Vencido" : "Pendiente"}
            </StatusPill>
            <span className="text-[10px] text-slate-400">
              {VENC_TIPO_LABEL[item.tipo] ?? item.tipo}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {deadlineDate}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── DeadlineCard ─────────────────────────────────────────────────────────────

function DeadlineCard({ item }: { item: CalendarDeadlineItem }) {
  const cfg = URGENCY_CONFIG[item.urgency];
  const Icon = cfg.icon;

  const deadlineDate = new Date(item.deadline).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });

  return (
    <Link
      href={`/expedientes/${item.id}`}
      className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gradient-to-br text-white shadow-soft",
          TOKENS.gradients[cfg.gradient],
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {item.title}
          </p>
          {item.number && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Exp. {item.number}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusPill tone={cfg.tone} size="sm">{cfg.label}</StatusPill>
            <span className="text-[10px] text-slate-400">
              {MATTER_LABELS[item.matter] ?? item.matter}
            </span>
            {item.client && (
              <span className="text-[10px] text-slate-400 truncate">
                · {item.client.name}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{deadlineDate}</span>
        </div>
      </div>
    </Link>
  );
}
