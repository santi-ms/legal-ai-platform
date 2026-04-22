"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchDebounce } from "../lib/hooks/useSearchDebounce";
import {
  Briefcase, Plus, Search, X, Loader2, AlertCircle,
  CalendarClock, User, ChevronLeft, ChevronRight, AlertTriangle, Download,
  List, LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  listExpedientes, createExpediente, deleteExpediente, updateExpediente, getExpediente, exportExpedientesCSV,
  Expediente, ExpedienteMatter, ExpedienteStatus,
} from "@/app/lib/webApi";
import {
  ExpedienteForm,
  MATTER_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/components/expedientes/ExpedienteForm";
import { cn } from "@/app/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const PAGE_SIZE = 20;

// Deadline quick-filter presets
type DeadlineFilter = "all" | "overdue" | "week" | "month";

const DEADLINE_OPTIONS: { value: DeadlineFilter; label: string; title: string }[] = [
  { value: "all",     label: "Todos",        title: "Sin filtro de vencimiento" },
  { value: "overdue", label: "Vencidos",     title: "Deadline ya pasó" },
  { value: "week",    label: "Esta semana",  title: "Vencen en los próximos 7 días" },
  { value: "month",   label: "Este mes",     title: "Vencen en los próximos 30 días" },
];

function deadlineParams(filter: DeadlineFilter): {
  hasDeadline?: "true";
  deadlineBefore?: string;
  deadlineAfter?: string;
  sort?: "deadline:asc";
} {
  const now    = new Date().toISOString();
  const week   = new Date(Date.now() + 7  * 86_400_000).toISOString();
  const month  = new Date(Date.now() + 30 * 86_400_000).toISOString();
  if (filter === "overdue") return { hasDeadline: "true", deadlineBefore: now,   sort: "deadline:asc" };
  if (filter === "week")    return { hasDeadline: "true", deadlineAfter: now, deadlineBefore: week,  sort: "deadline:asc" };
  if (filter === "month")   return { hasDeadline: "true", deadlineAfter: now, deadlineBefore: month, sort: "deadline:asc" };
  return {};
}

const MATTER_OPTIONS: { value: ExpedienteMatter | "all"; label: string }[] = [
  { value: "all",            label: "Todas las materias" },
  { value: "civil",          label: "Civil" },
  { value: "penal",          label: "Penal" },
  { value: "laboral",        label: "Laboral" },
  { value: "familia",        label: "Familia" },
  { value: "comercial",      label: "Comercial" },
  { value: "administrativo", label: "Administrativo" },
  { value: "constitucional", label: "Constitucional" },
  { value: "tributario",     label: "Tributario" },
  { value: "otro",           label: "Otro" },
];

const STATUS_OPTIONS: { value: ExpedienteStatus | "all"; label: string }[] = [
  { value: "all",        label: "Todos los estados" },
  { value: "activo",     label: "Activo" },
  { value: "cerrado",    label: "Cerrado" },
  { value: "archivado",  label: "Archivado" },
  { value: "suspendido", label: "Suspendido" },
];

function formatDate(str: string | null | undefined) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Board View ───────────────────────────────────────────────────────────────

const BOARD_COLUMNS: { status: ExpedienteStatus; label: string; color: string; bg: string; border: string }[] = [
  { status: "activo",     label: "Activo",     color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20",  border: "border-emerald-200 dark:border-emerald-800" },
  { status: "suspendido", label: "Suspendido", color: "text-amber-700 dark:text-amber-300",    bg: "bg-amber-50 dark:bg-amber-900/20",      border: "border-amber-200 dark:border-amber-800"    },
  { status: "cerrado",    label: "Cerrado",    color: "text-slate-700 dark:text-slate-300",    bg: "bg-slate-100 dark:bg-slate-800",         border: "border-slate-200 dark:border-slate-700"    },
  { status: "archivado",  label: "Archivado",  color: "text-slate-500 dark:text-slate-400",    bg: "bg-slate-50 dark:bg-slate-900/40",       border: "border-slate-200 dark:border-slate-700"    },
];

interface ExpedienteBoardProps {
  expedientes: Expediente[];
  loading: boolean;
  updatingStatusId: string | null;
  onStatusChange: (id: string, status: ExpedienteStatus) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const ExpedienteBoard = React.memo(function ExpedienteBoard({
  expedientes,
  loading,
  updatingStatusId,
  onStatusChange,
  onDelete,
  onCreateNew,
}: ExpedienteBoardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Cargando expedientes...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {BOARD_COLUMNS.map((col) => {
        const colItems = expedientes.filter((e) => e.status === col.status);
        return (
          <div key={col.status} className="flex flex-col gap-3">
            {/* Column header */}
            <div className={cn(
              "flex items-center justify-between px-3 py-2 rounded-xl border",
              col.bg, col.border
            )}>
              <div className="flex items-center gap-2">
                <span className={cn("text-xs font-bold uppercase tracking-wider", col.color)}>
                  {col.label}
                </span>
                <span className={cn(
                  "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                  col.bg, col.color, "border", col.border
                )}>
                  {colItems.length}
                </span>
              </div>
              {col.status === "activo" && (
                <button
                  onClick={onCreateNew}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
                  title="Nuevo expediente"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[120px]">
              {colItems.length === 0 ? (
                <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-400">Sin expedientes</p>
                </div>
              ) : (
                colItems.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    {/* Title */}
                    <Link
                      href={`/expedientes/${exp.id}`}
                      className="block font-semibold text-sm text-slate-900 dark:text-white hover:text-primary transition-colors leading-snug line-clamp-2 mb-1.5"
                    >
                      {exp.title}
                    </Link>

                    {/* Number + matter */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {exp.number && (
                        <span className="text-[10px] font-medium text-slate-400">
                          #{exp.number}
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium capitalize">
                        {MATTER_LABELS[exp.matter] ?? exp.matter}
                      </span>
                    </div>

                    {/* Client */}
                    {exp.client && (
                      <Link
                        href={`/clients/${exp.client.id}`}
                        className="flex items-center gap-1 mb-1.5 text-xs text-slate-500 hover:text-primary transition-colors"
                      >
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{exp.client.name}</span>
                      </Link>
                    )}

                    {/* Deadline */}
                    {exp.deadline && (
                      <div className={cn(
                        "flex items-center gap-1 text-[10px] mb-2",
                        new Date(exp.deadline) < new Date()
                          ? "text-red-500"
                          : "text-slate-400"
                      )}>
                        <CalendarClock className="w-3 h-3" />
                        {formatDate(exp.deadline)}
                      </div>
                    )}

                    {/* Status changer */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {updatingStatusId === exp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <select
                          value={exp.status}
                          onChange={(e) => onStatusChange(exp.id, e.target.value as ExpedienteStatus)}
                          onClick={(e) => e.preventDefault()}
                          className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 border-0 outline-none cursor-pointer bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-600 transition-all px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

function ExpedientesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();

  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [formOpen, setFormOpen]       = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exporting, setExporting]     = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [viewMode, setViewMode]       = useState<"list" | "board">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("exp_view") as "list" | "board") ?? "list";
    }
    return "list";
  });

  // Filters from URL
  const query    = searchParams.get("query")    ?? "";
  const matter   = (searchParams.get("matter")  ?? "all") as ExpedienteMatter | "all";
  const status   = (searchParams.get("status")  ?? "all") as ExpedienteStatus  | "all";
  const deadline = (searchParams.get("deadline") ?? "all") as DeadlineFilter;
  const clientId = searchParams.get("clientId") ?? "";
  const page     = parseInt(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function updateUrl(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      query:    query    || undefined,
      matter:   matter   !== "all" ? matter   : undefined,
      status:   status   !== "all" ? status   : undefined,
      deadline: deadline !== "all" ? deadline : undefined,
      clientId: clientId || undefined,
      page:     String(page),
      ...overrides,
    };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/expedientes?${params.toString()}`);
  }

  // Local controlled input state — debounced before pushing to URL
  const [searchInput, setSearchInput] = useState(query);
  const debouncedSearch = useSearchDebounce(searchInput, 300);

  // Sync debounced value to URL (only when it actually differs from current URL query)
  useEffect(() => {
    if (debouncedSearch !== query) {
      updateUrl({ query: debouncedSearch || undefined, page: "1" });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep local input in sync when URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Auto-open create form from ?create=1 (e.g. from client detail quick-action)
  const createParam = searchParams.get("create");
  useEffect(() => {
    if (createParam === "1") {
      setFormOpen(true);
      // Clean up the ?create param from the URL so a reload doesn't re-open
      const params = new URLSearchParams(searchParams.toString());
      params.delete("create");
      const qs = params.toString();
      router.replace(`/expedientes${qs ? `?${qs}` : ""}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExpedientes = useCallback(async () => {
    setLoading(true);
    try {
      const dp = deadlineParams(deadline);
      const isBoard = viewMode === "board";
      const res = await listExpedientes({
        query:    query    || undefined,
        matter:   matter   !== "all" ? matter   : undefined,
        // In board view, don't filter by status so all columns are populated
        status:   !isBoard && status !== "all" ? status : undefined,
        clientId: clientId || undefined,
        page:     isBoard ? 1 : page,
        pageSize: isBoard ? 100 : PAGE_SIZE,
        sort:     dp.sort ?? "createdAt:desc",
        ...dp,
      });
      setExpedientes(res.expedientes);
      setTotal(res.total);
    } catch {
      showError("Error al cargar los expedientes");
    } finally {
      setLoading(false);
    }
  }, [query, matter, status, deadline, clientId, page, viewMode]);

  useEffect(() => { loadExpedientes(); }, [loadExpedientes]);

  const handleCreate = async (payload: any) => {
    await createExpediente(payload);
    success("Expediente creado exitosamente");
    loadExpedientes();
  };

  const executeDeleteExpediente = (id: string) => {
    setDeleteQueue((q) => [...q, id]);
    setExpedientes((list) => list.filter((e) => e.id !== id));
    const timer = setTimeout(async () => {
      try {
        await deleteExpediente(id);
        setDeleteQueue((q) => q.filter((x) => x !== id));
        setTotal((t) => t - 1);
        success("Expediente eliminado");
      } catch {
        showError("No se pudo eliminar el expediente");
        loadExpedientes();
        setDeleteQueue((q) => q.filter((x) => x !== id));
      }
    }, 4000);
    return () => clearTimeout(timer);
  };

  const handleDelete = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  const handleStatusChange = useCallback(async (expId: string, newStatus: ExpedienteStatus) => {
    setUpdatingStatusId(expId);
    try {
      const full = await getExpediente(expId);
      await updateExpediente(expId, {
        title:         full.title,
        matter:        full.matter,
        status:        newStatus,
        clientId:      full.client?.id ?? null,
        court:         full.court ?? null,
        judge:         full.judge ?? null,
        opposingParty: full.opposingParty ?? null,
        openedAt:      full.openedAt ?? null,
        closedAt:      full.closedAt ?? null,
        deadline:      full.deadline ?? null,
        notes:         full.notes ?? null,
      });
      setExpedientes((prev) =>
        prev.map((x) => x.id === expId ? { ...x, status: newStatus } : x)
      );
      success(`Estado actualizado a "${STATUS_LABELS[newStatus]}"`);
    } catch {
      showError("No se pudo actualizar el estado");
    } finally {
      setUpdatingStatusId(null);
    }
  }, [success, showError]);

  // Memoized per-status counts for board view header badges
  const boardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const exp of expedientes) {
      counts[exp.status] = (counts[exp.status] ?? 0) + 1;
    }
    return counts;
  }, [expedientes]);

  // Derive client label from loaded expedientes
  const clientLabel = clientId
    ? (expedientes.find((e) => e.client?.id === clientId)?.client?.name ?? "Cliente")
    : "";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 md:py-10 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header editorial */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400 mb-2">
            Gestión
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink dark:text-white leading-[1.1]">
            Expedientes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-2 leading-relaxed">
            {total > 0 ? `${total} caso${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""} en tu estudio.` : "Gestión de casos y expedientes."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => { setViewMode("list"); localStorage.setItem("exp_view", "list"); }}
              title="Vista lista"
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode("board"); localStorage.setItem("exp_view", "board"); }}
              title="Vista tablero"
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "board"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await exportExpedientesCSV();
              } catch {
                showError("No se pudo exportar");
              } finally {
                setExporting(false);
              }
            }}
            className="flex items-center gap-2 h-9 px-3"
            title="Exportar expedientes como CSV"
          >
            {exporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo expediente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search + dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Buscar por título, número, tribunal..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); updateUrl({ query: undefined, page: "1" }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={matter}
            onChange={(e) => updateUrl({ matter: e.target.value === "all" ? undefined : e.target.value, page: "1" })}
            className="h-10 rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {MATTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => updateUrl({ status: e.target.value === "all" ? undefined : e.target.value, page: "1" })}
            className="h-10 rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Deadline quick-filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
            <CalendarClock className="w-3.5 h-3.5" />
            Vencimientos:
          </span>
          {DEADLINE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              title={opt.title}
              onClick={() => updateUrl({ deadline: opt.value !== "all" ? opt.value : undefined, page: "1" })}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                deadline === opt.value
                  ? opt.value === "overdue"
                    ? "bg-red-500 border-red-500 text-white shadow-sm shadow-red-200 dark:shadow-red-900/30"
                    : opt.value === "week"
                    ? "bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
                    : opt.value === "month"
                    ? "bg-yellow-500 border-yellow-500 text-white shadow-sm shadow-yellow-200 dark:shadow-yellow-900/30"
                    : "bg-primary border-primary text-white shadow-sm shadow-primary/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              {opt.value === "overdue" && <AlertTriangle className="w-3 h-3" />}
              {opt.label}
            </button>
          ))}
          {deadline !== "all" && (
            <button
              onClick={() => updateUrl({ deadline: undefined, page: "1" })}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 ml-1"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
          {/* Client filter chip */}
          {clientId && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-full text-xs text-sky-700 dark:text-sky-300 font-medium">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[160px]">{clientLabel || "Cliente"}</span>
              <button
                onClick={() => updateUrl({ clientId: undefined, page: "1" })}
                className="ml-0.5 text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 transition-colors"
                aria-label="Quitar filtro de cliente"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Board OR Table */}
      {viewMode === "board" ? (
        <ExpedienteBoard
          expedientes={expedientes}
          loading={loading}
          updatingStatusId={updatingStatusId}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onCreateNew={() => setFormOpen(true)}
        />
      ) : (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando expedientes...</span>
          </div>
        ) : expedientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Briefcase className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            <p className="text-sm font-medium">
              {query || matter !== "all" || status !== "all" || deadline !== "all"
                ? "No se encontraron expedientes con esos filtros"
                : "Todavía no hay expedientes"}
            </p>
            {!query && matter === "all" && status === "all" && deadline === "all" && (
              <button
                onClick={() => setFormOpen(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Crear el primero
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    Expediente
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    Materia
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide hidden md:table-cell">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide hidden lg:table-cell">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                    Docs
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expedientes.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <Link href={`/expedientes/${exp.id}`} className="group/link">
                        <p className="font-semibold text-slate-900 dark:text-white group-hover/link:text-primary transition-colors truncate max-w-[220px]">
                          {exp.title}
                        </p>
                        {exp.number && (
                          <p className="text-xs text-slate-400 mt-0.5">#{exp.number}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                        {MATTER_LABELS[exp.matter] ?? exp.matter}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {exp.client ? (
                        <Link
                          href={`/clients/${exp.client.id}`}
                          className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                        >
                          <User className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{exp.client.name}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {exp.deadline ? (
                        <span className={cn(
                          "flex items-center gap-1 text-xs",
                          new Date(exp.deadline) < new Date()
                            ? "text-red-500"
                            : "text-slate-500 dark:text-slate-400"
                        )}>
                          <CalendarClock className="w-3 h-3" />
                          {formatDate(exp.deadline)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {updatingStatusId === exp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <select
                          value={exp.status}
                          onChange={(e) => handleStatusChange(exp.id, e.target.value as ExpedienteStatus)}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "cursor-pointer text-xs font-semibold rounded-full px-2 py-0.5 border-0 outline-none",
                            "focus:ring-2 focus:ring-primary/30",
                            STATUS_COLORS[exp.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}
                        >
                          {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-xs font-medium text-slate-400">
                        {exp._count?.documents ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-all px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      )} {/* end board/list conditional */}

      {/* Undo delete snackbar */}
      {deleteQueue.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Eliminando expediente...</span>
          <button
            onClick={() => {
              setDeleteQueue([]);
              loadExpedientes();
            }}
            className="text-primary font-semibold hover:underline"
          >
            Deshacer
          </button>
        </div>
      )}

      {/* Pagination — only in list view */}
      {viewMode === "list" && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Página {page} de {totalPages} · {total} expedientes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUrl({ page: String(page - 1) })}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateUrl({ page: String(page + 1) })}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Form panel */}
      <ExpedienteForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        defaultClientId={clientId}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Eliminar expediente"
        description="¿Estás seguro de que querés eliminar este expediente? Podrás deshacer la acción durante 4 segundos."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            executeDeleteExpediente(confirmDeleteId);
            setConfirmDeleteId(null);
          }
        }}
      />
    </div>
  );
}

export default function ExpedientesPage() {
  return (
    <Suspense fallback={
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded" />)}
          </div>
        </div>
      </div>
    }>
      <ExpedientesContent />
    </Suspense>
  );
}
