"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CalendarClock, Plus, CheckCircle2, AlertTriangle, Clock,
  Loader2, Trash2, X, ChevronDown, RotateCcw, Bell,
  FileText, User, Filter, Calendar, CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/app/lib/utils";
import {
  listVencimientos, getVencimientoStats, createVencimiento, updateVencimiento,
  completeVencimiento, reopenVencimiento, deleteVencimiento,
  Vencimiento, VencimientoStats, CreateVencimientoPayload, VENCIMIENTO_TIPOS,
} from "@/app/lib/webApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = Object.fromEntries(
  VENCIMIENTO_TIPOS.map((t) => [t.value, t.label])
);

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  const date = new Date(dateStr); date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / 86_400_000);
}

function urgencyInfo(v: Vencimiento): {
  color: string; bg: string; border: string; badge: string; label: string
} {
  if (v.estado === "completado") {
    return { color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/30", border: "border-slate-200 dark:border-slate-700", badge: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400", label: "Completado" };
  }
  const d = daysUntil(v.fechaVencimiento);
  if (d < 0)  return { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10",      border: "border-red-200 dark:border-red-800",      badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",      label: `Vencido hace ${Math.abs(d)}d` };
  if (d === 0) return { color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10",     border: "border-red-200 dark:border-red-800",      badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",      label: "Vence hoy" };
  if (d <= 3)  return { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-200 dark:border-orange-800", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: `En ${d} día${d !== 1 ? "s" : ""}` };
  if (d <= 7)  return { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10",  border: "border-amber-200 dark:border-amber-800",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",  label: `En ${d} días` };
  if (d <= 30) return { color: "text-blue-600",  bg: "bg-blue-50 dark:bg-blue-900/10",    border: "border-blue-100 dark:border-blue-800",      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",    label: `En ${d} días` };
  return       { color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800/30",         border: "border-slate-200 dark:border-slate-700",    badge: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",   label: `En ${d} días` };
}

// ─── Modal de Crear/Editar ─────────────────────────────────────────────────────

function VencimientoModal({
  venc,
  onClose,
  onSaved,
}: {
  venc:    Vencimiento | null;   // null = crear
  onClose: () => void;
  onSaved: (v: Vencimiento) => void;
}) {
  const { success, error: showError } = useToast();
  const isEdit = Boolean(venc);

  const [titulo,           setTitulo]           = useState(venc?.titulo ?? "");
  const [descripcion,      setDescripcion]      = useState(venc?.descripcion ?? "");
  const [tipo,             setTipo]             = useState(venc?.tipo ?? "otro");
  const [fecha,            setFecha]            = useState(
    venc ? venc.fechaVencimiento.substring(0, 10) : ""
  );
  const [alertaDias,       setAlertaDias]       = useState(venc?.alertaDias ?? 3);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().substring(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) { showError("El título es requerido"); return; }
    if (!fecha)         { showError("La fecha es requerida");  return; }

    const payload: CreateVencimientoPayload = {
      titulo:           titulo.trim(),
      descripcion:      descripcion.trim() || null,
      tipo,
      fechaVencimiento: new Date(fecha + "T12:00:00").toISOString(),
      alertaDias,
    };

    setSaving(true);
    try {
      const saved = isEdit
        ? await updateVencimiento(venc!.id, payload)
        : await createVencimiento(payload);
      success(isEdit ? "Vencimiento actualizado" : "Vencimiento creado");
      onSaved(saved);
    } catch (e: any) {
      showError(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isEdit ? "Editar vencimiento" : "Nuevo vencimiento"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Audiencia preliminar - Expte 2024/001"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
              autoFocus
            />
          </div>

          {/* Tipo + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {VENCIMIENTO_TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Fecha de vencimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={fecha}
                min={isEdit ? undefined : today}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
          </div>

          {/* Alerta */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Alertar con anticipación
            </label>
            <select
              value={alertaDias}
              onChange={(e) => setAlertaDias(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {[0, 1, 2, 3, 5, 7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d === 0 ? "Sin alerta" : `${d} día${d !== 1 ? "s" : ""} antes`}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Notas / descripción (opcional)
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              placeholder="Detalles adicionales..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? "Guardar cambios" : "Crear vencimiento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Vencimiento Item ──────────────────────────────────────────────────────────

function VencimientoItem({
  venc,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
}: {
  venc:       Vencimiento;
  onComplete: (id: string) => void;
  onReopen:   (id: string) => void;
  onEdit:     (v: Vencimiento) => void;
  onDelete:   (id: string) => void;
}) {
  const u = urgencyInfo(venc);
  const [delConfirm, setDelConfirm] = useState(false);

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border transition-all",
      u.bg, u.border,
      venc.estado === "completado" && "opacity-60"
    )}>
      {/* Complete toggle */}
      <button
        onClick={() => venc.estado === "completado" ? onReopen(venc.id) : onComplete(venc.id)}
        title={venc.estado === "completado" ? "Reabrir" : "Marcar como completado"}
        className="flex-shrink-0 mt-0.5"
      >
        <CheckCircle2 className={cn(
          "w-5 h-5 transition-colors",
          venc.estado === "completado"
            ? "text-emerald-500"
            : "text-slate-300 dark:text-slate-600 hover:text-emerald-400"
        )} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span className={cn(
            "text-sm font-medium",
            venc.estado === "completado"
              ? "line-through text-slate-400 dark:text-slate-500"
              : "text-slate-800 dark:text-slate-100"
          )}>
            {venc.titulo}
          </span>
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", u.badge)}>
            {u.label}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {fmtDate(venc.fechaVencimiento)}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            {TIPO_LABELS[venc.tipo] ?? venc.tipo}
          </span>
          {venc.expediente && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {venc.expediente.title}
              {venc.expediente.number && ` #${venc.expediente.number}`}
            </span>
          )}
          {venc.client && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {venc.client.name}
            </span>
          )}
        </div>

        {venc.descripcion && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {venc.descripcion}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={() => onEdit(venc)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
          title="Editar"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={() => setDelConfirm(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <ConfirmDialog
        open={delConfirm}
        onCancel={() => setDelConfirm(false)}
        title="Eliminar vencimiento"
        description="¿Estás seguro de que querés eliminar este vencimiento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => { setDelConfirm(false); onDelete(venc.id); }}
      />
    </div>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: VencimientoStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {[
        { label: "Pendientes",       value: stats.totalPendientes, color: "text-slate-700 dark:text-slate-200",  iconColor: "text-slate-400" },
        { label: "Vencidos",         value: stats.vencidos,        color: "text-red-600 dark:text-red-400",      iconColor: "text-red-400",   urgent: stats.vencidos > 0 },
        { label: "Próximos 3 días",  value: stats.proximos3d,      color: "text-orange-600 dark:text-orange-400",iconColor: "text-orange-400",urgent: stats.proximos3d > 0 },
        { label: "Esta semana",      value: stats.proximos7d,      color: "text-amber-600 dark:text-amber-400",  iconColor: "text-amber-400" },
        { label: "Este mes",         value: stats.proximos30d,     color: "text-blue-600 dark:text-blue-400",    iconColor: "text-blue-400"  },
        { label: "Completados/mes",  value: stats.completadosMes,  color: "text-emerald-600 dark:text-emerald-400",iconColor: "text-emerald-400" },
      ].map((s) => (
        <div key={s.label} className={cn(
          "bg-white dark:bg-slate-900 rounded-xl border p-3 text-center",
          s.urgent
            ? "border-red-200 dark:border-red-800 shadow-sm shadow-red-100 dark:shadow-none"
            : "border-slate-200 dark:border-slate-800"
        )}>
          <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterEstado = "todos" | "pendiente" | "completado";

export default function VencimientosPage() {
  const { success, error: showError } = useToast();

  const [items, setItems]     = useState<Vencimiento[]>([]);
  const [stats, setStats]     = useState<VencimientoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);

  const [filterEstado, setFilterEstado] = useState<FilterEstado>("todos");
  const [filterTipo,   setFilterTipo]   = useState<string>("todos");

  const [modal, setModal]     = useState<"create" | Vencimiento | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params: Parameters<typeof listVencimientos>[0] = {
        pageSize: 100,
      };
      if (filterEstado !== "todos") params.estado = filterEstado;
      if (filterTipo !== "todos")   params.tipo   = filterTipo;

      const [res, st] = await Promise.all([
        listVencimientos(params),
        getVencimientoStats(),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setStats(st);
    } catch (e: any) {
      showError(e?.message ?? "Error al cargar vencimientos");
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterTipo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleComplete(id: string) {
    try {
      await completeVencimiento(id);
      setItems((prev) => prev.map((v) =>
        v.id === id ? { ...v, estado: "completado", completadoAt: new Date().toISOString() } : v
      ));
      success("Marcado como completado");
      fetchData(); // refresh stats
    } catch (e: any) { showError(e?.message ?? "Error"); }
  }

  async function handleReopen(id: string) {
    try {
      await reopenVencimiento(id);
      setItems((prev) => prev.map((v) =>
        v.id === id ? { ...v, estado: "pendiente", completadoAt: null } : v
      ));
      success("Vencimiento reabierto");
      fetchData();
    } catch (e: any) { showError(e?.message ?? "Error"); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVencimiento(id);
      setItems((prev) => prev.filter((v) => v.id !== id));
      success("Vencimiento eliminado");
      fetchData();
    } catch (e: any) { showError(e?.message ?? "Error al eliminar"); }
  }

  function handleSaved(saved: Vencimiento) {
    setItems((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = saved; return next;
      }
      return [saved, ...prev];
    });
    setModal(null);
    fetchData();
  }

  // Group by week
  const now = new Date(); now.setHours(0, 0, 0, 0);

  const vencidos   = items.filter((v) => v.estado === "pendiente" && daysUntil(v.fechaVencimiento) < 0);
  const hoy        = items.filter((v) => v.estado === "pendiente" && daysUntil(v.fechaVencimiento) === 0);
  const semana     = items.filter((v) => v.estado === "pendiente" && daysUntil(v.fechaVencimiento) > 0 && daysUntil(v.fechaVencimiento) <= 7);
  const mes        = items.filter((v) => v.estado === "pendiente" && daysUntil(v.fechaVencimiento) > 7 && daysUntil(v.fechaVencimiento) <= 30);
  const futuros    = items.filter((v) => v.estado === "pendiente" && daysUntil(v.fechaVencimiento) > 30);
  const completados = items.filter((v) => v.estado === "completado");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <CalendarClock className="w-6 h-6 text-violet-500" />
            Vencimientos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audiencias, plazos procesales, vencimientos de contratos y cualquier fecha crítica
          </p>
        </div>
        <Button onClick={() => setModal("create")} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo vencimiento
        </Button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      {stats && <StatsRow stats={stats} />}

      {/* ── Alerts banner: critical ───────────────────────────────────────────── */}
      {stats && (stats.vencidos > 0 || stats.proximos3d > 0) && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            {stats.vencidos > 0 && (
              <><strong>{stats.vencidos} vencimiento{stats.vencidos !== 1 ? "s" : ""} vencido{stats.vencidos !== 1 ? "s" : ""}</strong>.</>
            )}
            {stats.proximos3d > 0 && stats.vencidos === 0 && (
              <><strong>{stats.proximos3d} vencimiento{stats.proximos3d !== 1 ? "s" : ""}</strong> en los próximos 3 días.</>
            )}
            {stats.proximos3d > 0 && stats.vencidos > 0 && (
              <> Además, {stats.proximos3d} vence{stats.proximos3d !== 1 ? "n" : ""} en los próximos 3 días.</>
            )}
          </span>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Estado filter */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
          {(["todos", "pendiente", "completado"] as FilterEstado[]).map((e) => (
            <button
              key={e}
              onClick={() => setFilterEstado(e)}
              className={cn(
                "px-3 py-1.5 transition-colors",
                filterEstado === e
                  ? "bg-violet-500 text-white"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {e === "todos" ? "Todos" : e === "pendiente" ? "Pendientes" : "Completados"}
            </button>
          ))}
        </div>

        {/* Tipo filter */}
        <div className="relative">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="pl-3 pr-8 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
          >
            <option value="todos">Todos los tipos</option>
            {VENCIMIENTO_TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <span className="text-xs text-slate-400 ml-auto">
          {total} resultado{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CalendarClock className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-base font-medium text-slate-500">Sin vencimientos</p>
          <p className="text-sm mt-1">
            {filterEstado !== "todos" || filterTipo !== "todos"
              ? "No hay resultados para los filtros aplicados."
              : "Creá tu primer vencimiento para no perder ninguna fecha clave."}
          </p>
          {filterEstado === "todos" && filterTipo === "todos" && (
            <Button onClick={() => setModal("create")} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Nuevo vencimiento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Vencidos */}
          {vencidos.length > 0 && (
            <Section title="⚠️ Vencidos" count={vencidos.length} urgent>
              {vencidos.map((v) => (
                <VencimientoItem key={v.id} venc={v}
                  onComplete={handleComplete} onReopen={handleReopen}
                  onEdit={(v) => setModal(v)} onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

          {/* Hoy */}
          {hoy.length > 0 && (
            <Section title="🔴 Vence hoy" count={hoy.length} urgent>
              {hoy.map((v) => (
                <VencimientoItem key={v.id} venc={v}
                  onComplete={handleComplete} onReopen={handleReopen}
                  onEdit={(v) => setModal(v)} onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

          {/* Esta semana */}
          {semana.length > 0 && (
            <Section title="Esta semana" count={semana.length}>
              {semana.map((v) => (
                <VencimientoItem key={v.id} venc={v}
                  onComplete={handleComplete} onReopen={handleReopen}
                  onEdit={(v) => setModal(v)} onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

          {/* Este mes */}
          {mes.length > 0 && (
            <Section title="Este mes" count={mes.length}>
              {mes.map((v) => (
                <VencimientoItem key={v.id} venc={v}
                  onComplete={handleComplete} onReopen={handleReopen}
                  onEdit={(v) => setModal(v)} onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

          {/* Futuros */}
          {futuros.length > 0 && (
            <Section title="Próximos (+30 días)" count={futuros.length}>
              {futuros.map((v) => (
                <VencimientoItem key={v.id} venc={v}
                  onComplete={handleComplete} onReopen={handleReopen}
                  onEdit={(v) => setModal(v)} onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

          {/* Completados */}
          {completados.length > 0 && (filterEstado === "todos" || filterEstado === "completado") && (
            <Section title="Completados" count={completados.length} collapsed>
              {completados.map((v) => (
                <VencimientoItem key={v.id} venc={v}
                  onComplete={handleComplete} onReopen={handleReopen}
                  onEdit={(v) => setModal(v)} onDelete={handleDelete}
                />
              ))}
            </Section>
          )}
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {modal !== null && (
        <VencimientoModal
          venc={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title, count, urgent = false, collapsed = false, children,
}: {
  title:     string;
  count:     number;
  urgent?:   boolean;
  collapsed?: boolean;
  children:  React.ReactNode;
}) {
  const [open, setOpen] = useState(!collapsed);

  return (
    <div>
      <button
        className="flex items-center gap-2 mb-3 w-full text-left group"
        onClick={() => setOpen((v) => !v)}
      >
        <h2 className={cn(
          "text-sm font-semibold",
          urgent ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"
        )}>
          {title}
        </h2>
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full font-medium",
          urgent
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        )}>
          {count}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 ml-auto text-slate-400 transition-transform",
          open && "rotate-180"
        )} />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}
