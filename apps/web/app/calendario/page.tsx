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

const URGENCY_CONFIG: Record<DeadlineUrgency, {
  label: string;
  dot: string;
  badge: string;
  border: string;
  bg: string;
  text: string;
  icon: React.ElementType;
}> = {
  overdue: {
    label:  "Vencido",
    dot:    "bg-red-500",
    badge:  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50",
    border: "border-red-300 dark:border-red-700",
    bg:     "bg-red-50 dark:bg-red-950/30",
    text:   "text-red-700 dark:text-red-300",
    icon:   AlertCircle,
  },
  urgent: {
    label:  "Urgente",
    dot:    "bg-orange-500",
    badge:  "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50",
    border: "border-orange-300 dark:border-orange-700",
    bg:     "bg-orange-50 dark:bg-orange-950/30",
    text:   "text-orange-700 dark:text-orange-300",
    icon:   Clock,
  },
  warning: {
    label:  "Próximo",
    dot:    "bg-yellow-500",
    badge:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50",
    border: "border-yellow-300 dark:border-yellow-700",
    bg:     "bg-yellow-50 dark:bg-yellow-950/30",
    text:   "text-yellow-700 dark:text-yellow-300",
    icon:   Clock,
  },
  normal: {
    label:  "Programado",
    dot:    "bg-emerald-500",
    badge:  "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50",
    border: "border-emerald-300 dark:border-emerald-700",
    bg:     "bg-emerald-50 dark:bg-emerald-950/30",
    text:   "text-emerald-700 dark:text-emerald-300",
    icon:   CheckCircle2,
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
                      <div className={cn("text-lg font-bold", cfg.text)}>
                        {data.summary[u]}
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
                        "min-h-[80px] p-2 border-b border-r border-slate-100 dark:border-slate-800/50 text-left transition-colors relative",
                        // Wrap every 7
                        (firstDayOfMonth + day - 1) % 7 === 6 && "border-r-0",
                        hasItems  ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : "cursor-default",
                        isSelected && "ring-2 ring-inset ring-primary",
                        !isSelected && worstUrgency && URGENCY_CONFIG[worstUrgency].bg
                      )}
                    >
                      {/* Day number */}
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold",
                          isToday
                            ? "bg-primary text-white"
                            : "text-slate-700 dark:text-slate-300"
                        )}
                      >
                        {day}
                      </span>

                      {/* Deadline dots + vencimiento dots */}
                      {hasItems && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {/* Expediente deadline dots */}
                          {items.slice(0, 2).map((item) => (
                            <span
                              key={`exp_${item.id}`}
                              className={cn(
                                "inline-block w-2 h-2 rounded-full",
                                URGENCY_CONFIG[item.urgency].dot
                              )}
                            />
                          ))}
                          {/* Vencimiento dots — blue */}
                          {vencItems.slice(0, 2).map((item) => (
                            <span
                              key={`venc_${item.id}`}
                              className="inline-block w-2 h-2 rounded-full bg-blue-500"
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
                  <span className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{cfg.label}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
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
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            {allItems.length} exp.
          </span>
          {totalVencimientos > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
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
            <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Vencidos / Urgentes ({urgent.length})
              </p>
            </div>
          )}
          {urgent.map(item => <DeadlineCard key={item.id} item={item} />)}
          {upcoming.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Próximos ({upcoming.length})
              </p>
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
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border",
          isOverdue
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
        )}>
          <Bell className={cn("w-4 h-4", isOverdue ? "text-red-500" : "text-blue-500")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {item.titulo}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
              isOverdue
                ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
            )}>
              {isOverdue ? "Vencido" : "Pendiente"}
            </span>
            <span className="text-[10px] text-slate-400">
              {VENC_TIPO_LABEL[item.tipo] ?? item.tipo}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={cn(
            "text-xs font-semibold",
            isOverdue ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
          )}>
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
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg, cfg.border, "border")}>
          <Icon className={cn("w-4 h-4", cfg.text)} />
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
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", cfg.badge)}>
              {cfg.label}
            </span>
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
          <span className={cn("text-xs font-semibold", cfg.text)}>{deadlineDate}</span>
        </div>
      </div>
    </Link>
  );
}
