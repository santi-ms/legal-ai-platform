"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Clock, Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronUp,
  Gavel, FileText, Bell, BookOpen, FlaskConical,
  Users, DollarSign, MoreHorizontal, X, Check, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/app/lib/utils";
import {
  Actuacion, TipoActuacion, TIPO_ACTUACION_LABELS,
  listActuaciones, createActuacion, updateActuacion, deleteActuacion,
  CreateActuacionPayload,
} from "@/app/lib/webApi";

// ─── Tipo config ──────────────────────────────────────────────────────────────

const TIPO_OPTIONS: { value: TipoActuacion; label: string; icon: React.ElementType; color: string }[] = [
  { value: "audiencia",       label: "Audiencia",           icon: Gavel,         color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300" },
  { value: "escrito",         label: "Escrito",             icon: FileText,      color: "bg-sky-100    text-sky-600    dark:bg-sky-900/30    dark:text-sky-300"    },
  { value: "notificacion",    label: "Notificación",        icon: Bell,          color: "bg-amber-100  text-amber-600  dark:bg-amber-900/30  dark:text-amber-300"  },
  { value: "resolucion",      label: "Resolución",          icon: BookOpen,      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "pericia",         label: "Pericia",             icon: FlaskConical,  color: "bg-cyan-100   text-cyan-600   dark:bg-cyan-900/30   dark:text-cyan-300"   },
  { value: "reunion_cliente", label: "Reunión con cliente", icon: Users,         color: "bg-pink-100   text-pink-600   dark:bg-pink-900/30   dark:text-pink-300"   },
  { value: "pago",            label: "Pago",                icon: DollarSign,    color: "bg-green-100  text-green-600  dark:bg-green-900/30  dark:text-green-300"  },
  { value: "otro",            label: "Otro",                icon: MoreHorizontal,color: "bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400"  },
];

function getTipoConfig(tipo: TipoActuacion) {
  return TIPO_OPTIONS.find((t) => t.value === tipo) ?? TIPO_OPTIONS[TIPO_OPTIONS.length - 1];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateTime(str: string) {
  const d = new Date(str);
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTimeInput(str: string) {
  // Convert ISO datetime to "YYYY-MM-DDTHH:mm" for datetime-local input
  return new Date(str).toISOString().slice(0, 16);
}

function todayIso() {
  return new Date().toISOString().slice(0, 16);
}

function formatARS(amount: number, moneda = "ARS") {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency: moneda, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString("es-AR")}`;
  }
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface ActuacionFormData {
  tipo:        TipoActuacion;
  fecha:       string;
  titulo:      string;
  descripcion: string;
  monto:       string;
  moneda:      string;
}

const EMPTY_FORM: ActuacionFormData = {
  tipo:        "audiencia",
  fecha:       todayIso(),
  titulo:      "",
  descripcion: "",
  monto:       "",
  moneda:      "ARS",
};

interface ActuacionFormProps {
  initial?: ActuacionFormData;
  onSave: (data: ActuacionFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function ActuacionForm({ initial, onSave, onCancel, saving }: ActuacionFormProps) {
  const [form, setForm] = useState<ActuacionFormData>(initial ?? EMPTY_FORM);

  const set = (key: keyof ActuacionFormData, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tipo + Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Tipo *
          </label>
          <select
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {TIPO_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Fecha *
          </label>
          <input
            type="datetime-local"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            required
          />
        </div>
      </div>

      {/* Título */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Título *
        </label>
        <Input
          value={form.titulo}
          onChange={(e) => set("titulo", e.target.value)}
          placeholder="Ej: Audiencia de Vista de Causa, Presentación de memorial..."
          required
        />
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Descripción / Notas
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          placeholder="Detalles adicionales, resultado, próximos pasos..."
          rows={3}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Monto */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Monto (opcional)
          </label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={form.monto}
            onChange={(e) => set("monto", e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Moneda
          </label>
          <select
            value={form.moneda}
            onChange={(e) => set("moneda", e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ARS">ARS $</option>
            <option value="USD">USD $</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={saving || !form.titulo.trim()}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

// ─── Timeline Item ─────────────────────────────────────────────────────────────

interface TimelineItemProps {
  actuacion: Actuacion;
  onEdit: (a: Actuacion) => void;
  onDelete: (id: string) => void;
}

function TimelineItem({ actuacion, onEdit, onDelete }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getTipoConfig(actuacion.tipo);
  const Icon = cfg.icon;

  const authorName =
    actuacion.createdBy.firstName && actuacion.createdBy.lastName
      ? `${actuacion.createdBy.firstName} ${actuacion.createdBy.lastName}`
      : actuacion.createdBy.name ?? "Usuario";

  return (
    <div className="flex gap-3 group">
      {/* Icon dot */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "size-8 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-slate-950",
          cfg.color
        )}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                cfg.color
              )}>
                {TIPO_ACTUACION_LABELS[actuacion.tipo]}
              </span>
              <span className="text-xs text-slate-400">
                {formatDateTime(actuacion.fecha)}
              </span>
              {actuacion.monto && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatARS(actuacion.monto, actuacion.moneda ?? "ARS")}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">
              {actuacion.titulo}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">por {authorName}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {actuacion.descripcion && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title={expanded ? "Ocultar detalle" : "Ver detalle"}
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={() => onEdit(actuacion)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(actuacion.id)}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Descripción expandida */}
        {actuacion.descripcion && expanded && (
          <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {actuacion.descripcion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ActuacionesTimelineProps {
  expedienteId: string;
}

export function ActuacionesTimeline({ expedienteId }: ActuacionesTimelineProps) {
  const { success, error: showError } = useToast();

  const [actuaciones, setActuaciones]   = useState<Actuacion[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Actuacion | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [filterTipo, setFilterTipo]     = useState<TipoActuacion | "all">("all");
  const [searchQuery, setSearchQuery]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listActuaciones(expedienteId, {
        tipo:  filterTipo !== "all" ? filterTipo : undefined,
        limit: 100,
      });
      setActuaciones(res.actuaciones);
      setTotal(res.total);
    } catch {
      showError("Error al cargar las actuaciones");
    } finally {
      setLoading(false);
    }
  }, [expedienteId, filterTipo]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: ActuacionFormData) => {
    setSaving(true);
    try {
      await createActuacion(expedienteId, {
        tipo:        data.tipo,
        fecha:       new Date(data.fecha).toISOString(),
        titulo:      data.titulo.trim(),
        descripcion: data.descripcion.trim() || null,
        monto:       data.monto ? parseFloat(data.monto) : null,
        moneda:      data.monto ? data.moneda : null,
      } as CreateActuacionPayload);
      success("Actuación registrada");
      setShowForm(false);
      await load();
    } catch {
      showError("No se pudo registrar la actuación");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: ActuacionFormData) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await updateActuacion(expedienteId, editTarget.id, {
        tipo:        data.tipo,
        fecha:       new Date(data.fecha).toISOString(),
        titulo:      data.titulo.trim(),
        descripcion: data.descripcion.trim() || null,
        monto:       data.monto ? parseFloat(data.monto) : null,
        moneda:      data.monto ? data.moneda : null,
      });
      success("Actuación actualizada");
      setEditTarget(null);
      await load();
    } catch {
      showError("No se pudo actualizar la actuación");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteActuacion(expedienteId, deleteId);
      success("Actuación eliminada");
      setDeleteId(null);
      await load();
    } catch {
      showError("No se pudo eliminar la actuación");
    } finally {
      setDeleting(false);
    }
  };

  // Client-side text search filter (applied on top of tipo API filter)
  const filteredActuaciones = searchQuery.trim()
    ? actuaciones.filter((a) => {
        const q = searchQuery.toLowerCase();
        return (
          a.titulo.toLowerCase().includes(q) ||
          (a.descripcion ?? "").toLowerCase().includes(q)
        );
      })
    : actuaciones;

  // Financial summary: total monto of pago actuaciones (client-side)
  const pagoTotal = actuaciones
    .filter((a) => a.tipo === "pago" && a.monto)
    .reduce((sum, a) => sum + (a.monto ?? 0), 0);

  const editFormData = editTarget
    ? ({
        tipo:        editTarget.tipo,
        fecha:       formatDateTimeInput(editTarget.fecha),
        titulo:      editTarget.titulo,
        descripcion: editTarget.descripcion ?? "",
        monto:       editTarget.monto ? String(editTarget.monto) : "",
        moneda:      editTarget.moneda ?? "ARS",
      } as ActuacionFormData)
    : undefined;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">
            Registro de Actuaciones
          </h2>
          {total > 0 && (
            <span className="text-xs text-slate-400 font-normal">
              {total} {total === 1 ? "entrada" : "entradas"}
            </span>
          )}
        </div>
        {!showForm && !editTarget && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva
          </Button>
        )}
      </div>

      {/* New form */}
      {showForm && !editTarget && (
        <div className="mb-5 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
              Nueva actuación
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ActuacionForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Edit form */}
      {editTarget && (
        <div className="mb-5 p-4 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wide">
              Editar actuación
            </p>
            <button
              onClick={() => setEditTarget(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ActuacionForm
            initial={editFormData}
            onSave={handleEdit}
            onCancel={() => setEditTarget(null)}
            saving={saving}
          />
        </div>
      )}

      {/* Search + Filter */}
      {total > 0 && !showForm && !editTarget && (
        <div className="space-y-2.5 mb-4">
          {/* Text search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar en actuaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterTipo("all")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                filterTipo === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              Todos
            </button>
            {TIPO_OPTIONS.filter((t) =>
              actuaciones.some((a) => a.tipo === t.value)
            ).map((t) => (
              <button
                key={t.value}
                onClick={() => setFilterTipo(t.value)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                  filterTipo === t.value
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Financial summary (only if there are pago actuaciones) */}
          {pagoTotal > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-700 dark:text-emerald-300">
                Total pagos registrados:{" "}
                <span className="font-bold">{formatARS(pagoTotal)}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      ) : filteredActuaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <Clock className="w-8 h-8 text-slate-200 dark:text-slate-700" />
          <p className="text-sm text-slate-400 font-medium">
            {searchQuery
              ? `Sin resultados para "${searchQuery}"`
              : filterTipo === "all"
              ? "No hay actuaciones registradas"
              : `No hay actuaciones de tipo "${TIPO_ACTUACION_LABELS[filterTipo as TipoActuacion]}"`}
          </p>
          {!searchQuery && filterTipo === "all" && (
            <p className="text-xs text-slate-400">
              Registrá audiencias, escritos, notificaciones y más
            </p>
          )}
          {!showForm && filterTipo === "all" && !searchQuery && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="mt-2 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar primera actuación
            </Button>
          )}
          {(searchQuery || filterTipo !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setFilterTipo("all"); }}
              className="text-xs text-primary hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div>
          {searchQuery && filteredActuaciones.length < actuaciones.length && (
            <p className="text-xs text-slate-400 mb-3">
              Mostrando {filteredActuaciones.length} de {actuaciones.length} actuaciones
            </p>
          )}
          {filteredActuaciones.map((a) => (
            <TimelineItem
              key={a.id}
              actuacion={a}
              onEdit={(act) => { setShowForm(false); setEditTarget(act); }}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar actuación"
        description="¿Estás seguro de que querés eliminar esta actuación? Esta acción no se puede deshacer."
        confirmLabel={deleting ? "Eliminando..." : "Eliminar"}
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
