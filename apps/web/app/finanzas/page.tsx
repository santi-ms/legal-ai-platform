"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign, Plus, Search, X, Loader2, TrendingUp,
  Clock, AlertTriangle, CheckCircle2, Pencil, Trash2,
  ChevronLeft, ChevronRight, Briefcase, User as UserIcon, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/app/lib/utils";
import {
  listHonorarios, getHonorariosStats, createHonorario, updateHonorario,
  deleteHonorario, exportHonorariosCSV,
  Honorario, HonorarioEstado, HonorarioTipo, HonorariosStats,
} from "@/app/lib/webApi";
import {
  HonorarioForm, TIPO_LABELS, ESTADO_LABELS, ESTADO_COLORS,
} from "@/components/finanzas/HonorarioForm";

const PAGE_SIZE = 20;

const ESTADO_OPTIONS: { value: HonorarioEstado | "all"; label: string }[] = [
  { value: "all",           label: "Todos los estados" },
  { value: "presupuestado", label: "Presupuestado" },
  { value: "facturado",     label: "Facturado" },
  { value: "cobrado",       label: "Cobrado" },
  { value: "cancelado",     label: "Cancelado" },
];

const TIPO_OPTIONS: { value: HonorarioTipo | "all"; label: string }[] = [
  { value: "all",       label: "Todos los tipos" },
  { value: "consulta",  label: "Consulta" },
  { value: "juicio",    label: "Juicio" },
  { value: "acuerdo",   label: "Acuerdo" },
  { value: "mediacion", label: "Mediación" },
  { value: "otro",      label: "Otro" },
];

function formatARS(n: number, moneda = "ARS") {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency: moneda, maximumFractionDigits: 0,
    }).format(n || 0);
  } catch {
    return `$${(n || 0).toLocaleString("es-AR")}`;
  }
}

function formatDate(str: string | null | undefined) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(h: Honorario): boolean {
  if (!h.fechaVencimiento) return false;
  if (h.estado === "cobrado" || h.estado === "cancelado") return false;
  return new Date(h.fechaVencimiento).getTime() < Date.now();
}

export default function FinanzasPage() {
  const { success, error: showError } = useToast();

  const [items, setItems]         = useState<Honorario[]>([]);
  const [total, setTotal]         = useState(0);
  const [stats, setStats]         = useState<HonorariosStats | null>(null);
  const [loading, setLoading]     = useState(true);

  const [query, setQuery]         = useState("");
  const [tipo, setTipo]           = useState<HonorarioTipo | "all">("all");
  const [estado, setEstado]       = useState<HonorarioEstado | "all">("all");
  const [page, setPage]           = useState(1);

  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<Honorario | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        listHonorarios({
          query:    query || undefined,
          tipo:     tipo   !== "all" ? tipo   : undefined,
          estado:   estado !== "all" ? estado : undefined,
          page,
          pageSize: PAGE_SIZE,
        }),
        getHonorariosStats(),
      ]);
      setItems(listRes.honorarios);
      setTotal(listRes.total);
      setStats(statsRes);
    } catch {
      showError("Error al cargar los honorarios");
    } finally {
      setLoading(false);
    }
  }, [query, tipo, estado, page]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(payload: any) {
    if (editing) {
      await updateHonorario(editing.id, payload);
      success("Honorario actualizado");
    } else {
      await createHonorario(payload);
      success("Honorario creado");
    }
    setEditing(null);
    load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deleteHonorario(deleteId);
      success("Honorario eliminado");
      setDeleteId(null);
      load();
    } catch {
      showError("No se pudo eliminar");
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Finanzas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Honorarios, cobros y facturación del estudio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await exportHonorariosCSV();
              } catch {
                showError("No se pudo exportar");
              } finally {
                setExporting(false);
              }
            }}
            className="flex items-center gap-2 h-9 px-3"
            title="Exportar honorarios como CSV"
          >
            {exporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo honorario
          </Button>
        </div>
      </div>

      {/* Dashboard stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Cobrado"
            monto={stats.cobrado.monto}
            count={stats.cobrado.count}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Facturado"
            monto={stats.facturado.monto}
            count={stats.facturado.count}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Presupuestado"
            monto={stats.presupuestado.monto}
            count={stats.presupuestado.count}
            color="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Vencido"
            monto={stats.vencido.monto}
            count={stats.vencido.count}
            color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por concepto o notas..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="pl-9 bg-white dark:bg-slate-900"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={tipo}
          onChange={(e) => { setTipo(e.target.value as any); setPage(1); }}
          className="h-10 rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-sm"
        >
          {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value as any); setPage(1); }}
          className="h-10 rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-sm"
        >
          {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando honorarios...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <DollarSign className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            <p className="text-sm font-medium">
              {query || tipo !== "all" || estado !== "all"
                ? "No hay honorarios con esos filtros"
                : "Aún no tenés honorarios registrados"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setEditing(null); setFormOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Crear el primero
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Concepto</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold">Cliente / Expediente</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold">Monto</th>
                  <th className="text-left px-4 py-3 font-semibold">Vence</th>
                  <th className="text-right px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((h) => {
                  const overdue = isOverdue(h);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {h.concepto}
                        </div>
                        <div className="text-xs text-slate-400">
                          Emitido {formatDate(h.fechaEmision)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {TIPO_LABELS[h.tipo]}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {h.client && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            {h.client.name}
                          </div>
                        )}
                        {h.expediente && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <Briefcase className="w-3 h-3" />
                            {h.expediente.number ? `[${h.expediente.number}] ` : ""}{h.expediente.title}
                          </div>
                        )}
                        {!h.client && !h.expediente && <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold",
                          ESTADO_COLORS[h.estado],
                        )}>
                          {ESTADO_LABELS[h.estado]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                        {formatARS(h.monto, h.moneda)}
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-xs",
                        overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-500 dark:text-slate-400",
                      )}>
                        {overdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {formatDate(h.fechaVencimiento)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditing(h); setFormOpen(true); }}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(h.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Página {page} de {totalPages} — {total} honorario{total !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <HonorarioForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar honorario"
        description="Esta acción no se puede deshacer. ¿Seguro que querés eliminarlo?"
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, monto, count, color,
}: {
  icon: React.ReactNode;
  label: string;
  monto: number;
  count: number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("size-7 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-xl font-black text-slate-900 dark:text-white">
        {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(monto || 0)}
      </div>
      <div className="text-xs text-slate-400 mt-0.5">
        {count} {count === 1 ? "registro" : "registros"}
      </div>
    </div>
  );
}
