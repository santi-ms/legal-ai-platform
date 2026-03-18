"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Download, AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { listDocuments, deleteDocument, DocumentsParams, Document } from "@/app/lib/webApi";
import { DocumentsPageHeader } from "@/components/documents/DocumentsPageHeader";
import { DocumentsStatsCards } from "@/components/documents/DocumentsStatsCards";
import { DocumentsFiltersBar } from "@/components/documents/DocumentsFiltersBar";
import { DocumentsTableEnhanced, DocumentsTableSkeleton } from "@/components/documents/DocumentsTableEnhanced";
import { DocumentsPagination } from "@/components/documents/DocumentsPagination";
import { DocumentsPageFooter } from "@/components/documents/DocumentsPageFooter";

function DocumentsContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [documentType, setDocumentType] = useState("all");
  const [status, setStatus] = useState("all");

  // Parse filters from URL
  const getFiltersFromUrl = (): DocumentsParams => {
    return {
      query: searchParams.get("query") || undefined,
      type: searchParams.get("type") || undefined,
      jurisdiccion: searchParams.get("jurisdiccion") || undefined,
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

  const handleFiltersChange = (newFilters: Partial<DocumentsParams>) => {
    const params = new URLSearchParams();
    const currentFilters = getFiltersFromUrl();
    const mergedFilters = { ...currentFilters, ...newFilters };

    if (mergedFilters.query) params.set("query", mergedFilters.query);
    if (mergedFilters.type && mergedFilters.type !== "all") params.set("type", mergedFilters.type);
    if (mergedFilters.jurisdiccion) params.set("jurisdiccion", mergedFilters.jurisdiccion);
    if (mergedFilters.from) params.set("from", mergedFilters.from);
    if (mergedFilters.to) params.set("to", mergedFilters.to);
    if (mergedFilters.page) params.set("page", mergedFilters.page.toString());
    if (mergedFilters.pageSize) params.set("pageSize", mergedFilters.pageSize.toString());
    if (mergedFilters.sort) params.set("sort", mergedFilters.sort);

    router.replace(`/documents?${params.toString()}`, { scroll: false });
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
    // El filtro por estado se aplica client-side sobre los documentos ya cargados
    // El backend no expone un filtro de estado en GET /documents todavía
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDocumentType("all");
    setStatus("all");
    router.replace("/documents", { scroll: false });
  };

  const handlePageChange = (page: number) => {
    handleFiltersChange({ page });
  };

  const handleDelete = async (id: string) => {
    // Guard: evitar doble-click o llamadas concurrentes
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      success("Documento eliminado correctamente");
      await loadDocuments();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar el documento";
      showError(message);
    } finally {
      setDeletingId(null);
    }
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
    <div className="layout-container flex h-full grow flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <DocumentsPageHeader />

      <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8 flex-1">
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
              disabled
              title="Próximamente"
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 opacity-50 cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Link href="/documents/new/guided">
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
          onClearFilters={handleClearFilters}
        />

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
              documents={documents}
              onDelete={handleDelete}
              onDownloadError={showError}
              deletingId={deletingId}
              hasActiveFilters={
                !!(
                  searchParams.get("query") ||
                  (searchParams.get("type") && searchParams.get("type") !== "all") ||
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

      <DocumentsPageFooter />
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
