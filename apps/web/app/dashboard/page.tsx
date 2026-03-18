"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
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
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentDocumentsTable } from "@/components/dashboard/RecentDocumentsTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { NextHearing } from "@/components/dashboard/NextHearing";
import { TeamActivity } from "@/components/dashboard/TeamActivity";
import { PDFPreviewModal } from "@/components/dashboard/PDFPreviewModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  FileText,
  PenTool,
  Gavel,
  CheckCircle2,
} from "lucide-react";
import { useSession } from "next-auth/react";

function DashboardContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Cargar documentos
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar documentos";
      // Sólo error inline — sin toast duplicado para fallas de carga
      setError(message);
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
      await duplicateDocument(id);
      success("Documento duplicado exitosamente");
      loadDocuments();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al duplicar documento");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      success("Documento eliminado exitosamente");
      loadDocuments();
      setDeleteId(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al eliminar documento");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Estadísticas basadas en datos reales del backend
  // estado="generated_text" es el único valor que escribe el backend actualmente
  const activeDocuments = documents.length;
  const pendingSignatures = 0; // Flujo de firma no implementado en backend
  const casesInProcess = documents.filter((d) => d.lastVersion?.status === "needs_review").length;
  const signedDocuments = documents.filter((d) => d.lastVersion?.status === "generated").length;

  // Nombre del usuario — sin prefijo "Dr." inventado
  const userName = session?.user?.name || "Usuario";
  const firstName = userName.split(" ")[0] || userName;

  const currentDate = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Welcome & Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">
            Bienvenido de nuevo, {firstName}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Acá tenés el resumen de tu actividad legal para hoy, {currentDate}.
          </p>
        </div>
        <Link href="/documents/new/guided">
          <Button
            size="lg"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-5 h-5" />
            Nuevo Documento
          </Button>
        </Link>
      </div>

      {/* Stats Grid — valores reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={FileText}
          label="Documentos Activos"
          value={activeDocuments}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          icon={PenTool}
          label="Pendientes de Firma"
          value={pendingSignatures}
          iconBgColor="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          icon={Gavel}
          label="Requieren Revisión"
          value={casesInProcess}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Generados"
          value={signedDocuments}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Main Area Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents Table */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    No pudimos cargar los documentos
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDocuments}
                  className="mt-1"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <RecentDocumentsTable
              documents={documents}
              onViewAll={() => router.push("/documents")}
            />
          )}
        </div>

        {/* Side Widgets */}
        <div className="space-y-6">
          <QuickActions />
          <NextHearing />
          <TeamActivity />
        </div>
      </div>

      {/* Modal de preview */}
      {previewId && (
        <PDFPreviewModal
          open={!!previewId}
          onOpenChange={(open) => !open && setPreviewId(null)}
          documentId={previewId}
        />
      )}

      {/* ConfirmDialog reutilizable (components/ui/ConfirmDialog) */}
      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar documento"
        description="¿Estás seguro de que querés eliminar este documento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        isLoading={!!deletingId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => { if (!deletingId) setDeleteId(null); }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
