"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck, Clock, Gavel, FileText, Bell, BookOpen,
  FlaskConical, Users, CreditCard, HelpCircle, CheckCircle2,
  AlertTriangle, ArrowRight, Circle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { ActivityActuacion, Vencimiento } from "@/app/lib/webApi";

// ── helpers ──────────────────────────────────────────────────────────────────

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date(dateStr);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function fmtTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = [
    "ene","feb","mar","abr","may","jun",
    "jul","ago","sep","oct","nov","dic",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ── icon map for actuaciones ──────────────────────────────────────────────────

const ACTUACION_ICON: Record<string, React.ElementType> = {
  audiencia: Gavel, escrito: FileText, notificacion: Bell,
  resolucion: BookOpen, pericia: FlaskConical,
  reunion_cliente: Users, pago: CreditCard, otro: HelpCircle,
};

const ACTUACION_COLOR: Record<string, string> = {
  audiencia: "text-violet-500", escrito: "text-blue-500",
  notificacion: "text-amber-500", resolucion: "text-emerald-500",
  pericia: "text-teal-500", reunion_cliente: "text-pink-500",
  pago: "text-green-500", otro: "text-slate-400",
};

const ACTUACION_LABEL: Record<string, string> = {
  audiencia: "Audiencia", escrito: "Escrito", notificacion: "Notificación",
  resolucion: "Resolución", pericia: "Pericia",
  reunion_cliente: "Reunión cliente", pago: "Pago", otro: "Otro",
};

const VENC_TIPO_LABEL: Record<string, string> = {
  audiencia: "Audiencia", vencimiento_plazo: "Vencimiento plazo",
  prescripcion: "Prescripción", plazo_legal: "Plazo legal",
  vencimiento_contrato: "Vencimiento contrato", notificacion: "Notificación",
  pericia: "Pericia", otro: "Otro",
};

// ── item types ────────────────────────────────────────────────────────────────

interface AgendaItem {
  id: string;
  kind: "actuacion" | "vencimiento";
  /** For vencimientos only — the raw vencimiento ID for completing */
  vencimientoId?: string;
  label: string;
  sublabel: string;
  time: string;
  timeDisplay: string;
  dateDisplay: string;
  urgent: boolean;
  href: string;
  icon: React.ElementType;
  iconColor: string;
}

// ── component ─────────────────────────────────────────────────────────────────

export const TodayAgendaWidget = React.memo(function TodayAgendaWidget() {
  const [items, setItems]               = useState<AgendaItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [todayCount, setTodayCount]     = useState(0);
  const [tomorrowCount, setTomorrowCount] = useState(0);
  const [completing, setCompleting]     = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const { getDashboardActivity, listVencimientos } = await import("@/app/lib/webApi");

      const [actuaciones, vencToday, vencTomorrow] = await Promise.allSettled([
        getDashboardActivity(50),
        listVencimientos({ estado: "pendiente", upcomingDays: 1, pageSize: 20 }),
        listVencimientos({ estado: "pendiente", upcomingDays: 2, pageSize: 20 }),
      ]);

      const built: AgendaItem[] = [];

      // Actuaciones de hoy
      if (actuaciones.status === "fulfilled") {
        for (const act of actuaciones.value) {
          if (!isToday(act.fecha)) continue;
          const Icon  = ACTUACION_ICON[act.tipo] ?? HelpCircle;
          const color = ACTUACION_COLOR[act.tipo] ?? "text-slate-400";
          built.push({
            id: `act_${act.id}`,
            kind: "actuacion",
            label: ACTUACION_LABEL[act.tipo] ?? act.tipo,
            sublabel: act.expediente
              ? `${act.expediente.number ? `Exp. ${act.expediente.number} · ` : ""}${act.expediente.title}`
              : act.descripcion ?? "",
            time: act.fecha,
            timeDisplay: fmtTime(act.fecha),
            dateDisplay: "Hoy",
            urgent: false,
            href: act.expediente
              ? `/expedientes/${act.expediente.id}?tab=actuaciones`
              : "/expedientes",
            icon: Icon,
            iconColor: color,
          });
        }
      }

      // Vencimientos de hoy
      const todayVencIds = new Set<string>();
      if (vencToday.status === "fulfilled") {
        for (const v of vencToday.value.items) {
          if (!isToday(v.fechaVencimiento)) continue;
          todayVencIds.add(v.id);
          built.push({
            id: `venc_${v.id}`,
            kind: "vencimiento",
            vencimientoId: v.id,
            label: VENC_TIPO_LABEL[v.tipo] ?? v.tipo,
            sublabel: v.titulo,
            time: v.fechaVencimiento,
            timeDisplay: "Hoy",
            dateDisplay: "Hoy",
            urgent: true,
            href: "/vencimientos",
            icon: AlertTriangle,
            iconColor: "text-red-500",
          });
        }
      }

      // Vencimientos de mañana
      const tomorrowItems: AgendaItem[] = [];
      if (vencTomorrow.status === "fulfilled") {
        for (const v of vencTomorrow.value.items) {
          if (todayVencIds.has(v.id)) continue;
          if (!isTomorrow(v.fechaVencimiento)) continue;
          tomorrowItems.push({
            id: `venc_${v.id}`,
            kind: "vencimiento",
            vencimientoId: v.id,
            label: VENC_TIPO_LABEL[v.tipo] ?? v.tipo,
            sublabel: v.titulo,
            time: v.fechaVencimiento,
            timeDisplay: "Mañana",
            dateDisplay: fmtDate(v.fechaVencimiento),
            urgent: false,
            href: "/vencimientos",
            icon: Clock,
            iconColor: "text-amber-500",
          });
        }
      }

      // Sort today's items by time
      built.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      setTodayCount(built.length);
      setTomorrowCount(tomorrowItems.length);
      setItems([...built, ...tomorrowItems]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = useCallback(async (vencimientoId: string, itemId: string) => {
    if (completing.has(vencimientoId)) return;
    // Optimistically remove
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setTodayCount((c) => c - 1);
    setCompleting((prev) => new Set(prev).add(vencimientoId));
    try {
      const { completeVencimiento } = await import("@/app/lib/webApi");
      await completeVencimiento(vencimientoId);
    } catch {
      // Restore by reloading
      await load();
    } finally {
      setCompleting((prev) => { const s = new Set(prev); s.delete(vencimientoId); return s; });
    }
  }, [completing, load]);

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-white">Agenda de Hoy</h3>
            {todayCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold leading-none">
                {todayCount}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 capitalize">{today}</p>
        </div>
        <Link
          href="/vencimientos"
          className="text-[11px] text-slate-400 hover:text-primary transition-colors flex items-center gap-0.5 mt-1"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-800/60">
        {loading ? (
          <div className="px-4 py-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-800 rounded w-2/3" />
                  <div className="h-2.5 bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
            <p className="text-sm font-semibold text-slate-400">Sin compromisos hoy</p>
            <p className="text-xs text-slate-600">No tenés actuaciones ni vencimientos pendientes.</p>
          </div>
        ) : (
          <>
            {todayCount > 0 && (
              <div className="px-4 py-1.5 bg-slate-800/30">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hoy</span>
              </div>
            )}

            {items.slice(0, todayCount).map((item) => (
              <AgendaRow
                key={item.id}
                item={item}
                completing={completing}
                onComplete={handleComplete}
              />
            ))}

            {tomorrowCount > 0 && (
              <>
                <div className="px-4 py-1.5 bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mañana</span>
                </div>
                {items.slice(todayCount).map((item) => (
                  <AgendaRow
                    key={item.id}
                    item={item}
                    completing={completing}
                    onComplete={handleComplete}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!loading && (
        <div className="px-4 py-3 border-t border-slate-800/60">
          <Link
            href="/vencimientos"
            className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Gestionar vencimientos
          </Link>
        </div>
      )}
    </div>
  );
});

// ── Sub-component: single row ─────────────────────────────────────────────────

const AgendaRow = React.memo(function AgendaRow({
  item,
  completing,
  onComplete,
}: {
  item: AgendaItem;
  completing: Set<string>;
  onComplete: (vencimientoId: string, itemId: string) => void;
}) {
  const Icon = item.icon;
  const isVenc = item.kind === "vencimiento" && item.vencimientoId;
  const isCompleting = isVenc && completing.has(item.vencimientoId!);

  return (
    <div className="flex items-center group">
      {/* Quick-complete button for vencimientos */}
      {isVenc && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onComplete(item.vencimientoId!, item.id);
          }}
          disabled={isCompleting}
          title="Marcar como completado"
          className="flex-shrink-0 ml-3 w-5 h-5 rounded-full border border-white/20 hover:border-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <Circle className={cn(
            "w-3 h-3 transition-colors",
            isCompleting ? "text-white/40 animate-spin" : "text-white/30 group-hover:text-emerald-400"
          )} />
        </button>
      )}

      <Link href={item.href} className="flex-1">
        <div
          className={cn(
            "flex items-start gap-3 px-4 py-3 transition-colors",
            !isVenc && "pl-4",
            item.urgent ? "hover:bg-red-950/20" : "hover:bg-slate-800/40"
          )}
        >
          {/* Icon */}
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
            item.urgent ? "bg-red-500/10" : "bg-slate-800"
          )}>
            <Icon className={cn("w-3.5 h-3.5", item.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-semibold leading-snug",
              item.urgent ? "text-red-400" : "text-white"
            )}>
              {item.label}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate leading-snug">
              {item.sublabel}
            </p>
          </div>

          {/* Time */}
          <span className={cn(
            "text-[10px] font-medium flex-shrink-0 mt-1",
            item.urgent ? "text-red-500" : "text-slate-500"
          )}>
            {item.timeDisplay}
          </span>
        </div>
      </Link>
    </div>
  );
});
