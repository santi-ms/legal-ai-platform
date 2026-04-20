"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Download, AlertTriangle, RefreshCcw, Loader2, User, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  listDocuments,
  deleteDocument,
  listExpedientes,
  DocumentsParams,
  Document,
} from "@/app/lib/webApi";

// ── CSV helpers ──────────────────────────────────────────────────────────────
function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function documentsToCsv(docs: Document[]): string {
  const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    CONTRATO_LOCACION: "Contrato de Locación",
    CARTA_DOCUMENTO: "Carta Documento",
    PODER_NOTARIAL: "Poder Notarial",
    DEMANDA_CIVIL: "Demanda Civil",
    CONTESTACION_DEMANDA: "Contestación de Demanda",
    RECURSO_APELACION: "Recurso de Apelación",
    ACUERDO_CONFIDENCIALIDAD: "Acuerdo de Confidencialidad",
    CONTRATO_PRESTACION_SERVICIOS: "Contrato de Prestación de Servicios",
    TESTAMENTO: "Testamento",
    ACTA_DIRECTORIO: "Acta de Directorio",
  };

  const STATUS_LABELS: Record<string, string> = {
    generated: "Generado",
    needs_review: "Revisar",
    draft: "Borrador",
    reviewed: "Revisado",
    final: "Final",
  };

  const ESTADO_LABELS: Record<string, string> = {
    PENDIENTE: "Pendiente",
    FIRMADO: "Firmado",
    ARCHIVADO: "Archivado",
  };

  const headers = [
    "ID",
    "Tipo",
    "Jurisdicción",
    "Tono",
    "Estado Documento",
    "Estado Versión",
    "Cliente",
    "Expediente",
    "Costo (USD)",
    "Fecha Creación",
    "Fecha Actualización",
  ];

  const rows = docs.map((doc) => [
    escapeCsvField(doc.id),
    escapeCsvField(DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type),
    escapeCsvField(doc.jurisdiccion),
    escapeCsvField(doc.tono),
    escapeCsvField(ESTADO_LABELS[doc.estado] ?? doc.estado),
    escapeCsvField(STATUS_LABELS[doc.lastVersion?.status ?? ""] ?? doc.lastVersion?.status),
    escapeCsvField((doc as any).client?.name ?? null),
    escapeCsvField((doc as any).expediente?.title ?? null),
    escapeCsvField(doc.costUsd != null ? doc.costUsd.toFixed(4) : null),
    escapeCsvField(new Date(doc.createdAt).toLocaleString("es-AR")),
    escapeCsvField(new Date(doc.updatedAt).toLocaleString("es-AR")),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
import { DocumentsStatsCards } from "@/components/documents/DocumentsStatsCards";
import { DocumentsFiltersBar } from "@/components/documents/DocumentsFiltersBar";
import { DocumentsTableEnhanced, DocumentsTableSkeleton } from "@/components/documents/DocumentsTableEnhanced";
import { DocumentsPagination } from "@/components/documents/DocumentsPagination";

function DocumentsContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: showError, addToast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Filters state — initialized from URL params for deep-link support
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") ?? "");
  const [documentType, setDocumentType] = useState(searchParams.get("type") ?? "all");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");

  // Expediente filter — loads once when authenticated
  const [expedientes, setExpedientes] = useState<Array<{ id: string; title: string; number: string | null }>>([]);
  useEffect(() => {
    if (!isAuthenticated) return;
    listExpedientes({ pageSize: 200, sort: "title:asc" })
      .then((r) => setExpedientes(Array.isArray(r.expedientes) ? r.expedientes : []))
      .catch(() => {/* silently ignore — filter just won't show */});
  }, [isAuthenticated]);

  // Parse filters from URL
  const getFiltersFromUrl = (): DocumentsParams => {
    return {
      query: searchParams.get("query") || undefined,
      type: searchParams.get("type") || undefined,
      jurisdiccion: searchParams.get("jurisdiccion") || undefined,
      expedienteId: searchParams.get("expedienteId") || undefined,
      clientId: searchParams.get("clientId") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      sort: (searchParams.get("sort") as "createdAt:asc" | "createdAt:desc") || "createdAt:desc",
    };
  };

  // Load documents
  const loadDocuments = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const currentFilters = getFiltersFromUrl();
      const response = await listDocuments(currentFilters);

      setDocuments(Array.isArray(response.documents) ? response.documents : []);
      setTotal(
        typeof response.total === "number"
          ? response.total
          : Array.isArray(response.documents)
          ? response.documents.length
          : 0
      );
      setCurrentPage(typeof response.page === "number" ? response.page : 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar documentos";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDocuments();
    }
  }, [searchParams, isAuthenticated, authLoading]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/documents");
    }
  }, [authLoading, isAuthenticated, router]);

  // Calculate stats
  const totalDocuments = total;
  const pendingSignatures = documents.filter((d) => d.estado === "PENDIENTE").length;
  const completedThisMonth = documents.filter((d) => {
    const docDate = new Date(d.createdAt);
    const now = new Date();
    return (
      d.lastVersion?.status === "generated" &&
      docDate.getMonth() === now.getMonth() &&
      docDate.getFullYear() === now.getFullYear()
    );
  }).length;
  const activeDrafts = documents.filter((d) => d.lastVersion?.status === "needs_review").length;

  const stats = [
    {
      label: "Total Documentos",
      value: totalDocuments.toLocaleString(),
      trend: { value: "+12%", isPositive: true },
    },
    {
      label: "Pendientes de Firma",
      value: pendingSignatures,
      status: { label: "Urgente", variant: "urgent" as const },
    },
    {
      label: "Completados este mes",
      value: completedThisMonth,
      status: { label: "Meta 80%", variant: "goal" as const },
    },
    {
      label: "Borradores Activos",
      value: activeDrafts,
      status: { label: "Sin cambios", variant: "neutral" as const },
    },
  ];

  const handleExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      // Fetch ALL documents matching current filters (up to 2000)
      const currentFilters = getFiltersFromUrl();
      const allDocs: Document[] = [];
      let page = 1;
      const batchSize = 100;

      while (true) {
        const res = await listDocuments({ ...currentFilters, page, pageSize: batchSize });
        const batch = Array.isArray(res.documents) ? res.documents : [];
        allDocs.push(...batch);
        if (allDocs.length >= res.total || batch.length < batchSize || allDocs.length >= 2000) break;
        page++;
      }

      if (allDocs.length === 0) {
        showError("No hay documentos para exportar con los filtros actuales.");
        return;
      }

      const csv = documentsToCsv(allDocs);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      downloadCsv(csv, `documentos-${dateStr}.csv`);
      success(`${allDocs.length} ${allDocs.length === 1 ? "documento exportado" : "documentos exportados"} correctamente`);
    } catch (err) {
      showError("Error al exportar documentos. Por favor intente nuevamente.");
    } finally {
      setExporting(false);
    }
  };

  const handleFiltersChange = (newFilters: Partial<DocumentsParams & { status?: string }>) => {
    const params = new URLSearchParams();
    const currentFilters = getFiltersFromUrl();
    const currentStatus = searchParams.get("status") ?? "all";
    const mergedFilters = { ...currentFilters, ...newFilters };
    const mergedStatus = (newFilters as any).status ?? currentStatus;

    if (mergedFilters.query) params.set("query", mergedFilters.query);
    if (mergedFilters.type && mergedFilters.type !== "all") params.set("type", mergedFilters.type);
    if (mergedFilters.jurisdiccion) params.set("jurisdiccion", mergedFilters.jurisdiccion);
    if (mergedFilters.expedienteId) params.set("expedienteId", mergedFilters.expedienteId);
    if (mergedFilters.clientId) params.set("clientId", mergedFilters.clientId);
    if (mergedFilters.from) params.set("from", mergedFilters.from);
    if (mergedFilters.to) params.set("to", mergedFilters.to);
    if (mergedFilters.page && mergedFilters.page > 1) params.set("page", mergedFilters.page.toString());
    if (mergedFilters.pageSize) params.set("pageSize", mergedFilters.pageSize.toString());
    if (mergedFilters.sort && mergedFilters.sort !== "createdAt:desc") params.set("sort", mergedFilters.sort);
    if (mergedStatus && mergedStatus !== "all") params.set("status", mergedStatus);

    const qs = params.toString();
    router.replace(`/documents${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    handleFiltersChange({ query: query || undefined, page: 1 });
  };

  const handleTypeChange = (type: string) => {
    setDocumentType(type);
    handleFiltersChange({ type: type !== "all" ? type : undefined, page: 1 });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    // Status filter is client-side; but we persist it in the URL for deep-link support
    handleFiltersChange({ status: newStatus, page: 1 } as any);
  };

  // Client-side status filter (backend doesn't support status param yet)
  const filteredDocuments =
    status !== "all"
      ? documents.filter((d) => d.lastVersion?.status === status)
      : documents;

  const handleExpedienteChange = (id: string) => {
    handleFiltersChange({ expedienteId: id !== "all" ? id : undefined, page: 1 });
  };

  const handleDateRangeChange = (from: string | undefined, to: string | undefined) => {
    handleFiltersChange({ from, to, page: 1 });
  };

  const handleSortChange = (sort: string) => {
    handleFiltersChange({ sort: sort as "createdAt:asc" | "createdAt:desc", page: 1 });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDocumentType("all");
    setStatus("all");
    router.replace("/documents", { scroll: false }); // clears all URL params
  };

  // Sync status from URL when navigating back/forward
  useEffect(() => {
    const urlStatus = searchParams.get("status") ?? "all";
    if (urlStatus !== status) setStatus(urlStatus);
    const urlQuery = searchParams.get("query") ?? "";
    if (urlQuery !== searchQuery) setSearchQuery(urlQuery);
    const urlType = searchParams.get("type") ?? "all";
    if (urlType !== documentType) setDocumentType(urlType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    handleFiltersChange({ page });
  };

  const handleDelete = (id: string) => {
    if (deletingId || pendingDeletes.current.has(id)) return;

    // Optimistically remove from UI
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));

    // Schedule actual API delete after 5s (undo window)
    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(id);
      setDeletingId(id);
      try {
        await deleteDocument(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al eliminar el documento";
        showError(message);
        await loadDocuments(); // restore on error
      } finally {
        setDeletingId(null);
      }
    }, 5000);

    pendingDeletes.current.set(id, timer);

    addToast("Documento eliminado", "success", 5000, {
      label: "Deshacer",
      onClick: () => {
        const t = pendingDeletes.current.get(id);
        if (t) {
          clearTimeout(t);
          pendingDeletes.current.delete(id);
        }
        // Re-fetch to restore the document in the list
        loadDocuments();
      },
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    let successCount = 0;
    let errorCount = 0;
    for (const id of ids) {
      try {
        await deleteDocument(id);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    if (successCount > 0) {
      success(
        `${successCount} ${successCount === 1 ? "documento eliminado" : "documentos eliminados"} correctamente`
      );
    }
    if (errorCount > 0) {
      showError(
        `No se ${errorCount === 1 ? "pudo eliminar" : "pudieron eliminar"} ${errorCount} ${errorCount === 1 ? "documento" : "documentos"}`
      );
    }
    await loadDocuments();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // El useEffect maneja la redirección
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full">
      <main className="flex-1">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">
              Historial de Documentos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Gestiona y supervisa todos tus activos legales de forma centralizada.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={exporting || loading}
              title="Exportar documentos a CSV"
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? "Exportando..." : "Exportar CSV"}
            </Button>
            <Link href="/documents/new">
              <Button
                size="lg"
                className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-sm font-semibold text-white hover:bg-primary/90 transition-shadow shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                Nuevo Documento
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Stats Summary */}
        <DocumentsStatsCards stats={stats} />

        {/* Filters Section */}
        <DocumentsFiltersBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          documentType={documentType}
          onTypeChange={handleTypeChange}
          status={status}
          onStatusChange={handleStatusChange}
          expedienteId={searchParams.get("expedienteId") ?? "all"}
          onExpedienteChange={handleExpedienteChange}
          expedientes={expedientes}
          from={searchParams.get("from") ?? undefined}
          to={searchParams.get("to") ?? undefined}
          onDateRangeChange={handleDateRangeChange}
          sort={searchParams.get("sort") ?? "createdAt:desc"}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
        />

        {/* Active deep-link filter chips */}
        {searchParams.get("clientId") && (
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-full text-xs text-sky-700 dark:text-sky-300 font-medium">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[200px]">
                {documents.find((d) => (d as any).client?.id === searchParams.get("clientId"))
                  ? (documents.find((d) => (d as any).client?.id === searchParams.get("clientId")) as any).client?.name
                  : "Cliente"}
              </span>
              <button
                onClick={() => handleFiltersChange({ clientId: undefined, page: 1 })}
                className="ml-0.5 text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 transition-colors"
                aria-label="Quitar filtro de cliente"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Table Container */}
        {loading ? (
          <DocumentsTableSkeleton />
        ) : error ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 flex flex-col items-center text-center gap-4">
            <div className="size-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No pudimos cargar tus documentos
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={loadDocuments}
              className="flex items-center gap-2 mt-2 text-sm border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCcw className="w-4 h-4" />
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <DocumentsTableEnhanced
              documents={filteredDocuments}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onDownloadError={showError}
              deletingId={deletingId}
              hasActiveFilters={
                !!(
                  searchParams.get("query") ||
                  (searchParams.get("type") && searchParams.get("type") !== "all") ||
                  searchParams.get("expedienteId") ||
                  searchParams.get("from") ||
                  searchParams.get("to")
                )
              }
            />
            {totalPages > 1 && (
              <DocumentsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={pageSize}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </main>

    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="layout-container flex h-full grow flex-col bg-background-light dark:bg-background-dark min-h-screen">
          <div className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8 flex-1">
            <div className="h-10 w-64 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
            <div className="h-4 w-96 rounded bg-slate-100 dark:bg-slate-800 animate-pulse mb-10" />
            <DocumentsTableSkeleton />
          </div>
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
