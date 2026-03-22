"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, Search, Users, Building2, User, Mail, Phone,
  MapPin, Trash2, Pencil, RefreshCcw, AlertTriangle,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  listClients, createClient, updateClient, deleteClient,
  Client, ClientPayload, ClientsParams, ClientType,
} from "@/app/lib/webApi";
import { ClientForm } from "@/components/clients/ClientForm";
import { cn } from "@/app/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TYPE_LABELS: Record<ClientType, string> = {
  persona_fisica: "Persona Física",
  persona_juridica: "Persona Jurídica",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ClientsTableSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="hidden md:block h-3 w-28 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="hidden lg:block h-3 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear, onNew }: { hasFilters: boolean; onClear: () => void; onNew: () => void }) {
  if (hasFilters) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-14 flex flex-col items-center text-center gap-4">
        <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Search className="w-6 h-6 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Sin resultados para esa búsqueda
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Probá con otro término o limpiá los filtros.
          </p>
        </div>
        <Button variant="outline" onClick={onClear} className="text-sm">
          <X className="w-4 h-4 mr-2" />
          Limpiar filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-14 flex flex-col items-center text-center gap-4">
      <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Users className="w-7 h-7 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Todavía no tenés clientes
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Agregá tu primer cliente para comenzar a gestionar tus casos, documentos y comunicaciones de forma organizada.
        </p>
      </div>
      <Button onClick={onNew} className="bg-primary text-white hover:bg-primary/90 text-sm px-5">
        <Plus className="w-4 h-4 mr-2" />
        Agregar primer cliente
      </Button>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ClientRow({
  client,
  onEdit,
  onDelete,
}: {
  client: Client;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const initials = getInitials(client.name);
  const isJuridica = client.type === "persona_juridica";

  return (
    <div
      className="group flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      {/* Avatar */}
      <div
        className={cn(
          "size-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
          isJuridica
            ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
            : "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300"
        )}
      >
        {initials || (isJuridica ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />)}
      </div>

      {/* Name + type */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {client.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded font-medium",
              isJuridica
                ? "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300"
                : "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300"
            )}
          >
            {TYPE_LABELS[client.type]}
          </span>
          {client.documentNumber && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {client.documentType} {client.documentNumber}
            </span>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="hidden md:flex items-center gap-1.5 min-w-0 w-48">
        {client.email ? (
          <>
            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{client.email}</span>
          </>
        ) : (
          <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
        )}
      </div>

      {/* Phone */}
      <div className="hidden lg:flex items-center gap-1.5 w-36">
        {client.phone ? (
          <>
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{client.phone}</span>
          </>
        ) : (
          <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
        )}
      </div>

      {/* Province */}
      <div className="hidden xl:flex items-center gap-1.5 w-28">
        {client.province ? (
          <>
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{client.province}</span>
          </>
        ) : (
          <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
        )}
      </div>

      {/* Date */}
      <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 w-28 text-right flex-shrink-0">
        {formatDate(client.createdAt)}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(client)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Editar cliente"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(client.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Eliminar cliente"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function ClientsContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: showError, addToast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [typeFilter, setTypeFilter] = useState<ClientType | "all">(
    (searchParams.get("type") as ClientType) || "all"
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const getParams = (): ClientsParams => ({
    query: searchParams.get("query") || undefined,
    type: (searchParams.get("type") as ClientType) || undefined,
    page: parseInt(searchParams.get("page") || "1"),
    pageSize,
    sort: (searchParams.get("sort") as ClientsParams["sort"]) || "name:asc",
  });

  const pushParams = (overrides: Record<string, string | undefined>) => {
    const current = getParams();
    const p = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      query: current.query,
      type: current.type,
      page: String(current.page),
      sort: current.sort,
      ...overrides,
    };
    if (merged.query) p.set("query", merged.query);
    if (merged.type && merged.type !== "all") p.set("type", merged.type);
    if (merged.page && merged.page !== "1") p.set("page", merged.page);
    if (merged.sort && merged.sort !== "name:asc") p.set("sort", merged.sort);
    router.replace(`/clients${p.toString() ? "?" + p.toString() : ""}`, { scroll: false });
  };

  const loadClients = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await listClients(getParams());
      setClients(res.clients);
      setTotal(res.total);
      setCurrentPage(res.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar clientes";
      setFetchError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) loadClients();
  }, [searchParams, isAuthenticated, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/clients");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Search & filter ──────────────────────────────────────────────────────

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    pushParams({ query: q || undefined, page: "1" });
  };

  const handleTypeFilter = (t: ClientType | "all") => {
    setTypeFilter(t);
    pushParams({ type: t !== "all" ? t : undefined, page: "1" });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    router.replace("/clients", { scroll: false });
  };

  // ── Create / Edit ─────────────────────────────────────────────────────────

  const handleOpenNew = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleSave = async (payload: ClientPayload) => {
    if (editingClient) {
      await updateClient(editingClient.id, payload);
      success("Cliente actualizado correctamente");
    } else {
      await createClient(payload);
      success("Cliente creado correctamente");
    }
    await loadClients();
  };

  // ── Delete with undo ──────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    if (pendingDeletes.current.has(id)) return;

    setClients((prev) => prev.filter((c) => c.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));

    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(id);
      try {
        await deleteClient(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al eliminar el cliente";
        showError(msg);
        await loadClients();
      }
    }, 5000);

    pendingDeletes.current.set(id, timer);

    addToast("Cliente eliminado", "success", 5000, {
      label: "Deshacer",
      onClick: () => {
        const t = pendingDeletes.current.get(id);
        if (t) { clearTimeout(t); pendingDeletes.current.delete(id); }
        loadClients();
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const totalPages = Math.ceil(total / pageSize);
  const hasFilters = !!(searchParams.get("query") || (searchParams.get("type") && searchParams.get("type") !== "all"));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-10 py-6">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Clientes
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {total > 0 ? `${total} ${total === 1 ? "cliente registrado" : "clientes registrados"}` : "Gestioná los clientes de tu estudio"}
            </p>
          </div>
          <Button
            onClick={handleOpenNew}
            className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 px-5 text-sm font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono, documento..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden text-sm flex-shrink-0">
            {(["all", "persona_fisica", "persona_juridica"] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleTypeFilter(v)}
                className={cn(
                  "px-3 py-2.5 font-medium transition-colors border-r last:border-r-0 border-slate-200 dark:border-slate-700",
                  typeFilter === v
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {v === "all" ? "Todos" : v === "persona_fisica" ? "Física" : "Jurídica"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <ClientsTableSkeleton />
        ) : fetchError ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 flex flex-col items-center text-center gap-4">
            <div className="size-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No pudimos cargar los clientes
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{fetchError}</p>
            </div>
            <Button variant="outline" onClick={loadClients} className="text-sm">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : clients.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} onNew={handleOpenNew} />
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              <div className="size-10 flex-shrink-0" />
              <div className="flex-1">Cliente</div>
              <div className="hidden md:block w-48">Email</div>
              <div className="hidden lg:block w-36">Teléfono</div>
              <div className="hidden xl:block w-28">Provincia</div>
              <div className="hidden sm:block w-28 text-right">Alta</div>
              <div className="w-16" />
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mostrando {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pushParams({ page: String(currentPage - 1) })}
                disabled={currentPage <= 1}
                className="text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pushParams({ page: String(currentPage + 1) })}
                disabled={currentPage >= totalPages}
                className="text-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Slide-in Form */}
      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialData={editingClient}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 md:px-10 py-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="h-9 w-40 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
            <div className="h-4 w-64 rounded bg-slate-100 dark:bg-slate-800 animate-pulse mb-8" />
            <ClientsTableSkeleton />
          </div>
        </div>
      }
    >
      <ClientsContent />
    </Suspense>
  );
}
