"use client";

// Nota: Esta página es client-side y usa Suspense para manejar useSearchParams
// El prerendering se evita automáticamente con Suspense boundary

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/app/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  listDocuments,
  duplicateDocument,
  deleteDocument,
  DocumentsParams,
  Document,
} from "@/app/lib/webApi";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { DocumentsTable } from "@/components/dashboard/DocumentsTable";
import { PDFPreviewModal } from "@/components/dashboard/PDFPreviewModal";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { Pagination } from "@/components/dashboard/Pagination";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/dashboard/DashboardComponents";

function DashboardContent() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Parsear filtros desde URL
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

  const [filters, setFilters] = useState<DocumentsParams>(getFiltersFromUrl());

  // Sincronizar filtros con URL
  const updateFilters = (newFilters: DocumentsParams) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set("query", newFilters.query);
    if (newFilters.type) params.set("type", newFilters.type);
    if (newFilters.jurisdiccion) params.set("jurisdiccion", newFilters.jurisdiccion);
    if (newFilters.from) params.set("from", newFilters.from);
    if (newFilters.to) params.set("to", newFilters.to);
    if (newFilters.page) params.set("page", newFilters.page.toString());
    if (newFilters.pageSize) params.set("pageSize", newFilters.pageSize.toString());
    if (newFilters.sort) params.set("sort", newFilters.sort);

    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // Cargar documentos
  const loadDocuments = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const currentFilters = getFiltersFromUrl();
      const response = await listDocuments(currentFilters);
      
      setDocuments(response.items);
      setTotal(response.total);
      setCurrentPage(response.page);
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
      router.push("/auth/login?callbackUrl=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleDuplicate = async (id: string) => {
    try {
      const response = await duplicateDocument(id);
      success("Documento duplicado exitosamente");
      loadDocuments();
      
      // Opcional: navegar al nuevo documento
      if (response.data?.id) {
        // router.push(`/documents/${response.data.id}`);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al duplicar documento");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      success("Documento eliminado exitosamente");
      loadDocuments();
      setDeleteId(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al eliminar documento");
      setDeleteId(null);
    }
  };

  if (authLoading) {
    return (
      <DashboardShell title="Dashboard" description="Cargando...">
        <LoadingSkeleton />
      </DashboardShell>
    );
  }

  if (!isAuthenticated) {
    return null; // El useEffect maneja la redirección
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <DashboardShell
      title="Dashboard de Documentos"
      description={`${total} documento${total !== 1 ? "s" : ""} en total`}
      action={
        <Link href="/documents/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo documento
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Filtros */}
        <FiltersBar filters={filters} onFiltersChange={updateFilters} />

        {/* Contenido */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={loadDocuments} />
        ) : documents.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <DocumentsTable
              documents={documents}
              isAdmin={isAdmin}
              onPreview={setPreviewId}
              onDuplicate={handleDuplicate}
              onDelete={(id) => setDeleteId(id)}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                onPageChange={(page) => {
                  const currentFilters = getFiltersFromUrl();
                  updateFilters({ ...currentFilters, page });
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {previewId && (
        <PDFPreviewModal
          open={!!previewId}
          onOpenChange={(open) => !open && setPreviewId(null)}
          documentId={previewId}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Eliminar documento"
          message="¿Estás seguro de que querés eliminar este documento? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="destructive"
          onConfirm={() => deleteId && handleDelete(deleteId)}
        />
      )}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <DashboardShell title="Dashboard" description="Cargando...">
        <LoadingSkeleton />
      </DashboardShell>
    }>
      <DashboardContent />
    </Suspense>
  );
}
