"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase, Plus, Search, X, Loader2, AlertCircle,
  CalendarClock, User, ChevronLeft, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  listExpedientes, createExpediente, deleteExpediente,
  Expediente, ExpedienteMatter, ExpedienteStatus,
} from "@/app/lib/webApi";
import {
  ExpedienteForm,
  MATTER_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/components/expedientes/ExpedienteForm";
import { cn } from "@/app/lib/utils";

const PAGE_SIZE = 20;

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

function ExpedientesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();

  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [formOpen, setFormOpen]       = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<string[]>([]);

  // Filters from URL
  const query    = searchParams.get("query")   ?? "";
  const matter   = (searchParams.get("matter")  ?? "all") as ExpedienteMatter | "all";
  const status   = (searchParams.get("status")  ?? "all") as ExpedienteStatus  | "all";
  const page     = parseInt(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function updateUrl(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      query:  query  || undefined,
      matter: matter !== "all" ? matter : undefined,
      status: status !== "all" ? status : undefined,
      page:   String(page),
      ...overrides,
    };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/expedientes?${params.toString()}`);
  }

  const loadExpedientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listExpedientes({
        query:    query  || undefined,
        matter:   matter !== "all" ? matter : undefined,
        status:   status !== "all" ? status : undefined,
        page,
        pageSize: PAGE_SIZE,
        sort:     "createdAt:desc",
      });
      setExpedientes(res.expedientes);
      setTotal(res.total);
    } catch {
      showError("Error al cargar los expedientes");
    } finally {
      setLoading(false);
    }
  }, [query, matter, status, page]);

  useEffect(() => { loadExpedientes(); }, [loadExpedientes]);

  const handleCreate = async (payload: any) => {
    await createExpediente(payload);
    success("Expediente creado exitosamente");
    loadExpedientes();
  };

  const handleDelete = (id: string) => {
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Expedientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {total > 0 ? `${total} caso${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}` : "Gestión de casos y expedientes"}
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo expediente
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Buscar por título, número, tribunal..."
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

      {/* Table */}
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
              {query || matter !== "all" || status !== "all"
                ? "No se encontraron expedientes con esos filtros"
                : "Todavía no hay expedientes"}
            </p>
            {!query && matter === "all" && status === "all" && (
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
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        STATUS_COLORS[exp.status] ?? "bg-slate-100 text-slate-600"
                      )}>
                        {STATUS_LABELS[exp.status] ?? exp.status}
                      </span>
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

      {/* Pagination */}
      {totalPages > 1 && (
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
