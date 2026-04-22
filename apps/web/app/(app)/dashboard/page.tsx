"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, AlertTriangle, X, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  listDocuments,
  duplicateDocument,
  deleteDocument,
  getDocumentStats,
  DocumentsParams,
  Document,
  DocumentStats,
} from "@/app/lib/webApi";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentDocumentsTable } from "@/components/dashboard/RecentDocumentsTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { VencimientosWidget } from "@/components/dashboard/VencimientosWidget";
import { RecentActivityWidget } from "@/components/dashboard/RecentActivityWidget";
import { TodayAgendaWidget } from "@/components/dashboard/TodayAgendaWidget";
import { RecentlyViewedWidget } from "@/components/dashboard/RecentlyViewedWidget";
import { FinanceSummaryWidget } from "@/components/dashboard/FinanceSummaryWidget";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { PDFPreviewModal } from "@/components/dashboard/PDFPreviewModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  FileText,
  Briefcase,
  Gavel,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useDeadlines } from "@/app/lib/contexts/DeadlineContext";

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
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { overdueCount } = useDeadlines();

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
      const [response] = await Promise.all([
        listDocuments(currentFilters),
        getDocumentStats().then(setStats).catch(() => {}),
      ]);

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
      <div className="px-4 sm:px-6 lg:px-10 py-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

  const totalDocuments        = stats?.total                ?? 0;
  const totalClients          = stats?.totalClients         ?? 0;
  const needsReview           = stats?.byStatus?.needs_review ?? 0;
  const expedientesActivos    = stats?.expedientesActivos   ?? 0;
  const vencimientosUrgentes  = stats?.vencimientosUrgentes ?? 0;

  const showOnboarding =
    stats !== null && (totalDocuments === 0 || totalClients === 0 || expedientesActivos === 0);

  const userName = session?.user?.name || "Usuario";
  const firstName = userName.split(" ")[0] || userName;

  const now = new Date();
  const currentDate = now.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting =
    hour < 6 ? "Buenas madrugadas" : hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 md:py-10 max-w-7xl mx-auto w-full">
      {/* ── Banner overdue ─────────────────────────────────────────────── */}
      {overdueCount > 0 && !bannerDismissed && (
        <div className="mb-6 flex items-start sm:items-center justify-between gap-2 sm:gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl px-3 sm:px-4 py-3">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1 flex-wrap">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
              {overdueCount === 1
                ? "Tenés 1 expediente con vencimiento vencido."
                : `Tenés ${overdueCount} expedientes con vencimientos vencidos.`}
            </p>
            <Link
              href="/vencimientos"
              className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 underline underline-offset-2 hover:no-underline flex-shrink-0"
            >
              Ver vencimientos →
            </Link>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Cerrar alerta"
            className="p-2 sm:p-1 rounded-md text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Hero editorial ─────────────────────────────────────────────── */}
      <section className="mb-8 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 md:gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400 mb-2 md:mb-3">
              Panel de control · {currentDate}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink dark:text-white leading-[1.05]">
              {greeting}, <span className="text-primary">{firstName}</span>.
            </h1>
            <p className="mt-2 md:mt-3 text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Acá tenés el resumen de tu actividad. Seguí donde quedaste o creá algo nuevo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:flex-shrink-0">
            <Link href="/documents/new/chat" className="sm:w-auto">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Sparkles className="w-4 h-4 text-gold-500" />
                Chat con IA
              </Button>
            </Link>
            <Link href="/documents/new" className="sm:w-auto">
              <Button variant="ink" size="lg" className="gap-2 group w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Nuevo documento
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Onboarding checklist ─────────────────────────────────────── */}
      {showOnboarding && (
        <div className="mb-8">
          <OnboardingChecklist
            hasDocs={totalDocuments > 0}
            hasClients={totalClients > 0}
            hasExpedientes={expedientesActivos > 0}
            userId={(session?.user as any)?.id}
          />
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatsCard
            icon={FileText}
            label="Documentos"
            value={stats ? totalDocuments : "—"}
            iconBgColor="bg-blue-50 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
            href="/documents"
          />
          <StatsCard
            icon={Users}
            label="Clientes"
            value={stats ? totalClients : "—"}
            iconBgColor="bg-violet-50 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
            href="/clients"
          />
          <StatsCard
            icon={Briefcase}
            label="Expedientes"
            value={stats ? expedientesActivos : "—"}
            iconBgColor="bg-emerald-50 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
            subText={vencimientosUrgentes > 0 ? `${vencimientosUrgentes} con vto. urgente` : undefined}
            subTextColor="text-rose-500 dark:text-rose-400"
            href="/expedientes"
          />
          <StatsCard
            icon={Gavel}
            label="Requieren revisión"
            value={stats ? needsReview : "—"}
            iconBgColor="bg-amber-50 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
            subText={needsReview > 0 ? "Pendientes" : undefined}
            subTextColor="text-amber-600 dark:text-amber-400"
            href="/documents?status=needs_review"
          />
        </div>
      </section>

      {/* ── Grid principal 12 col ──────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Columna izquierda (8/12) — Recent + Actividad */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent documents */}
          <div>
            <div className="flex items-baseline justify-between mb-4 px-1">
              <h2 className="text-xl font-extrabold tracking-tight text-ink dark:text-white">
                Documentos recientes
              </h2>
              <Link
                href="/documents"
                className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft p-8">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      No pudimos cargar los documentos
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadDocuments}>
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

          {/* Actividad + Agenda combinadas en fila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <TodayAgendaWidget />
            <RecentActivityWidget />
          </div>
        </div>

        {/* Columna derecha (4/12) — Quick actions + finanzas + vencimientos */}
        <div className="lg:col-span-4 space-y-6">
          <QuickActions />
          <FinanceSummaryWidget />
          <VencimientosWidget />
          <UpcomingDeadlines />
          <RecentlyViewedWidget />
        </div>
      </section>

      {/* Modal de preview */}
      {previewId && (
        <PDFPreviewModal
          open={!!previewId}
          onOpenChange={(open) => !open && setPreviewId(null)}
          documentId={previewId}
        />
      )}

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
        <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
