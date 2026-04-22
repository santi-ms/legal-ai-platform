"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  DollarSign, Plus, Search, X, Loader2, TrendingUp,
  Clock, AlertTriangle, CheckCircle2, Pencil, Trash2,
  ChevronLeft, ChevronRight, Briefcase, User as UserIcon, Download,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatsGrid, type StatItem } from "@/components/ui/StatsGrid";
import { StatusPill } from "@/components/ui/StatusPill";
import { AccentStripe } from "@/components/ui/AccentStripe";
import { cn } from "@/app/lib/utils";
import {
  listHonorarios, getHonorariosStats, createHonorario, updateHonorario,
  deleteHonorario, exportHonorariosCSV,
  Honorario, HonorarioEstado, HonorarioTipo, HonorariosStats,
} from "@/app/lib/webApi";
import {
  HonorarioForm, TIPO_LABELS, ESTADO_LABELS, ESTADO_TONES,
} from "@/components/finanzas/HonorarioForm";

const PAGE_SIZE = 20;

type SortField = "monto" | "fechaEmision" | "fechaVencimiento";
type SortDir   = "asc" | "desc";

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

// ─── Sortable column header ──────────────────────────────────────────────────

const SortableHeader = React.memo(function SortableHeader({
  field, label, currentField, currentDir, onSort, className,
}: {
  field: SortField; label: string;
  currentField: SortField | null; currentDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const active = currentField === field;
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors group",
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (
          currentDir === "asc"
            ? <ArrowUp className="w-3 h-3 text-primary" />
            : <ArrowDown className="w-3 h-3 text-primary" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </div>
    </th>
  );
});

// ─── Honorario row ───────────────────────────────────────────────────────────

const HonorarioRow = React.memo(function HonorarioRow({
  honorario: h,
  onEdit,
  onDelete,
  onFilterEstado,
}: {
  honorario: Honorario;
  onEdit: (h: Honorario) => void;
  onDelete: (id: string) => void;
  onFilterEstado: (estado: string) => void;
}) {
  const overdue = isOverdue(h);
  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className={cn(
        "px-4 py-3 relative",
        overdue && "pl-5"
      )}>
        {/* Accent editorial sólo en la primera celda — reemplaza el tint rojo del row */}
        {overdue && <AccentStripe tone="rose" thickness="md" />}
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
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
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
        <button
          onClick={() => onFilterEstado(h.estado)}
          title={`Filtrar por ${ESTADO_LABELS[h.estado]}`}
          className="hover:opacity-80 transition-opacity"
        >
          <StatusPill tone={ESTADO_TONES[h.estado]} size="sm">
            {ESTADO_LABELS[h.estado]}
          </StatusPill>
        </button>
      </td>
      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
        {formatARS(h.monto, h.moneda)}
      </td>
      <td className={cn(
        "px-4 py-3 text-xs hidden lg:table-cell",
        overdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-slate-500 dark:text-slate-400",
      )}>
        {overdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
        {formatDate(h.fechaVencimiento)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(h)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(h.id)}
            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

// ─── Main content (uses useSearchParams) ─────────────────────────────────────

function FinanzasContent() {
  const { success, error: showError } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read filters from URL
  const query        = searchParams.get("query")       ?? "";
  const tipo         = (searchParams.get("tipo")       ?? "all") as HonorarioTipo | "all";
  const estado       = (searchParams.get("estado")     ?? "all") as HonorarioEstado | "all";
  const expedienteId = searchParams.get("expedienteId") ?? "";
  const clientId     = searchParams.get("clientId")    ?? "";
  const page         = parseInt(searchParams.get("page") ?? "1");
  const sortBy       = (searchParams.get("sortBy")  ?? null) as SortField | null;
  const sortDir      = (searchParams.get("sortDir") ?? "desc") as SortDir;

  const [items, setItems]         = useState<Honorario[]>([]);
  const [total, setTotal]         = useState(0);
  const [stats, setStats]         = useState<HonorariosStats | null>(null);
  const [loading, setLoading]     = useState(true);

  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<Honorario | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Memoized totals derived from current page items
  const totals = useMemo(() => ({
    total:       items.reduce((sum, h) => sum + (h.monto || 0), 0),
    cobrado:     items.filter((h) => h.estado === "cobrado").reduce((sum, h) => sum + (h.monto || 0), 0),
    facturado:   items.filter((h) => h.estado === "facturado").reduce((sum, h) => sum + (h.monto || 0), 0),
    presupuestado: items.filter((h) => h.estado === "presupuestado").reduce((sum, h) => sum + (h.monto || 0), 0),
  }), [items]);

  // Stable handlers for HonorarioRow
  const handleEditRow = useCallback((h: Honorario) => {
    setEditing(h);
    setFormOpen(true);
  }, []);

  const handleDeleteRow = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- updateUrl is redefined each render from URL params
  const handleFilterEstado = useCallback((estadoValue: string) => {
    updateUrl({ estado: estadoValue, page: "1" });
  }, [query, tipo, estado, expedienteId, clientId, page, sortBy, sortDir]); // same deps as updateUrl

  function updateUrl(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      query:        query        || undefined,
      tipo:         tipo         !== "all" ? tipo   : undefined,
      estado:       estado       !== "all" ? estado : undefined,
      expedienteId: expedienteId || undefined,
      clientId:     clientId     || undefined,
      page:         String(page),
      sortBy:       sortBy       ?? undefined,
      sortDir:      sortDir      !== "desc" ? sortDir : undefined,
      ...overrides,
    };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/finanzas?${params.toString()}`);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      // Toggle direction
      updateUrl({ sortDir: sortDir === "asc" ? "desc" : "asc", page: "1" });
    } else {
      updateUrl({ sortBy: field, sortDir: "desc", page: "1" });
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sortParam = sortBy ? (`${sortBy}:${sortDir}` as any) : undefined;
      const [listRes, statsRes] = await Promise.all([
        listHonorarios({
          query:        query        || undefined,
          tipo:         tipo         !== "all" ? tipo   : undefined,
          estado:       estado       !== "all" ? estado : undefined,
          expedienteId: expedienteId || undefined,
          clientId:     clientId     || undefined,
          page,
          pageSize: PAGE_SIZE,
          sort:     sortParam,
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
  }, [query, tipo, estado, expedienteId, clientId, page, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  // Auto-open form from URL param
  useEffect(() => {
    if (searchParams.get("formOpen") === "1") {
      setEditing(null);
      setFormOpen(true);
      const p = new URLSearchParams(searchParams.toString());
      p.delete("formOpen");
      const qs = p.toString();
      router.replace(`/finanzas${qs ? `?${qs}` : ""}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const hasFilters = query || tipo !== "all" || estado !== "all" || expedienteId || clientId;

  // Derive expediente/client labels from loaded items
  const expedienteLabel = expedienteId
    ? (items.find((h) => h.expediente?.id === expedienteId)?.expediente?.title ?? "Expediente")
    : "";

  const clientLabelFinanzas = clientId
    ? (items.find((h) => h.client?.id === clientId)?.client?.name ?? "Cliente")
    : "";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <PageHeader
        icon={DollarSign}
        iconGradient="emerald"
        iconTreatment="outline"
        eyebrow="Gestión"
        title="Finanzas"
        description="Honorarios, cobros y facturación del estudio"
        badge={
          stats && stats.vencido.count > 0
            ? { label: `${stats.vencido.count} vencido${stats.vencido.count !== 1 ? "s" : ""}`, tone: "danger" }
            : undefined
        }
        actions={
          <>
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
              variant="ink"
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo honorario
            </Button>
          </>
        }
      />

      {/* Dashboard stats */}
      {stats && (
        <StatsGrid
          columns={4}
          iconTreatment="outline"
          items={[
            {
              icon: CheckCircle2,
              label: "Cobrado",
              value: formatARS(stats.cobrado.monto),
              tone: "emerald",
              subText: `${stats.cobrado.count} ${stats.cobrado.count === 1 ? "registro" : "registros"}`,
            },
            {
              icon: Clock,
              label: "Facturado",
              value: formatARS(stats.facturado.monto),
              tone: "amber",
              subText: `${stats.facturado.count} ${stats.facturado.count === 1 ? "registro" : "registros"}`,
            },
            {
              icon: TrendingUp,
              label: "Presupuestado",
              value: formatARS(stats.presupuestado.monto),
              tone: "slate",
              subText: `${stats.presupuestado.count} ${stats.presupuestado.count === 1 ? "registro" : "registros"}`,
            },
            {
              icon: AlertTriangle,
              label: "Vencido",
              value: formatARS(stats.vencido.monto),
              tone: "rose",
              urgent: stats.vencido.count > 0,
              subText: `${stats.vencido.count} ${stats.vencido.count === 1 ? "registro" : "registros"}`,
              subTone: stats.vencido.count > 0 ? "danger" : undefined,
            },
          ]}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por concepto o notas..."
            value={query}
            onChange={(e) => updateUrl({ query: e.target.value || undefined, page: "1" })}
            className="pl-9 bg-white dark:bg-slate-900"
          />
          {query && (
            <button
              onClick={() => updateUrl({ query: undefined, page: "1" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={tipo}
          onChange={(e) => updateUrl({ tipo: e.target.value === "all" ? undefined : e.target.value, page: "1" })}
          className="h-10 rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={estado}
          onChange={(e) => updateUrl({ estado: e.target.value === "all" ? undefined : e.target.value, page: "1" })}
          className="h-10 rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => updateUrl({ query: undefined, tipo: undefined, estado: undefined, expedienteId: undefined, clientId: undefined, page: "1" })}
            className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Active filter summary */}
      {(sortBy || hasFilters) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {hasFilters && <span className="text-slate-400">Filtrando por:</span>}
          {expedienteId && (
            <StatusPill tone="info" size="sm" icon={Briefcase}>
              {expedienteLabel || "Expediente"}
              <button
                onClick={() => updateUrl({ expedienteId: undefined, page: "1" })}
                aria-label="Quitar filtro de expediente"
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </StatusPill>
          )}
          {clientId && (
            <StatusPill tone="neutral" size="sm" icon={UserIcon}>
              {clientLabelFinanzas || "Cliente"}
              <button
                onClick={() => updateUrl({ clientId: undefined, page: "1" })}
                aria-label="Quitar filtro de cliente"
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </StatusPill>
          )}
          {query && (
            <StatusPill tone="neutral" size="sm">
              "{query}"
              <button
                onClick={() => updateUrl({ query: undefined, page: "1" })}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </StatusPill>
          )}
          {tipo !== "all" && (
            <StatusPill tone="neutral" size="sm">
              {TIPO_LABELS[tipo as HonorarioTipo]}
              <button
                onClick={() => updateUrl({ tipo: undefined, page: "1" })}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </StatusPill>
          )}
          {estado !== "all" && (
            <StatusPill tone={ESTADO_TONES[estado as HonorarioEstado]} size="sm">
              {ESTADO_LABELS[estado as HonorarioEstado]}
              <button
                onClick={() => updateUrl({ estado: undefined, page: "1" })}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </StatusPill>
          )}
          {sortBy && (
            <StatusPill tone="neutral" size="sm">
              Ord: {sortBy} {sortDir === "asc" ? "↑" : "↓"}
              <button
                onClick={() => updateUrl({ sortBy: undefined, sortDir: undefined })}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </StatusPill>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <PageSkeleton variant="list" count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          iconGradient="emerald"
          iconTreatment="outline"
          title={hasFilters ? "No hay honorarios con esos filtros" : "Aún no registraste honorarios"}
          description={
            hasFilters
              ? "Probá limpiar los filtros o ajustar la búsqueda para ver más resultados."
              : "Llevá un control claro de consultas, juicios y cobros. Registrá tu primer honorario y seguí tu facturación mes a mes."
          }
          primaryAction={
            !hasFilters ? (
              <Button
                variant="ink"
                onClick={() => { setEditing(null); setFormOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Crear primer honorario
              </Button>
            ) : (
              <Button variant="outline" onClick={() => updateUrl({ query: undefined, tipo: undefined, estado: undefined, expedienteId: undefined, clientId: undefined, page: "1" })}>
                Limpiar filtros
              </Button>
            )
          }
          tips={
            !hasFilters
              ? [
                  "Podés asociar honorarios a expedientes y clientes",
                  "Exportá a CSV para integrar con tu contador",
                  "Ves el estado de cobros de un vistazo en el dashboard",
                ]
              : undefined
          }
        />
      ) : (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Concepto</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Cliente / Expediente</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <SortableHeader
                    field="monto" label="Monto"
                    currentField={sortBy} currentDir={sortDir}
                    onSort={handleSort}
                    className="text-right"
                  />
                  <SortableHeader
                    field="fechaVencimiento" label="Vence"
                    currentField={sortBy} currentDir={sortDir}
                    onSort={handleSort}
                    className="text-left hidden lg:table-cell"
                  />
                  <th className="text-right px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((h) => (
                  <HonorarioRow
                    key={h.id}
                    honorario={h}
                    onEdit={handleEditRow}
                    onDelete={handleDeleteRow}
                    onFilterEstado={handleFilterEstado}
                  />
                ))}
              </tbody>
            </table>
          </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Página {page} de {totalPages} — {total} honorario{total !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => updateUrl({ page: String(page - 1) })}
                disabled={page === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateUrl({ page: String(page + 1) })}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      <HonorarioForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        presetExpedienteId={!editing && expedienteId ? expedienteId : undefined}
        presetClientId={!editing && clientId ? clientId : undefined}
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

// ─── Page export ─────────────────────────────────────────────────────────────

export default function FinanzasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          <PageSkeleton variant="dashboard" />
        </div>
      }
    >
      <FinanzasContent />
    </Suspense>
  );
}
