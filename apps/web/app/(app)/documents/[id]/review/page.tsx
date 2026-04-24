"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, ChevronRight, Download, FileText, MapPin, FileType } from "lucide-react";
import { AIAssistantSidebar } from "@/components/documents/review/AIAssistantSidebar";
import { DocumentToolbar } from "@/components/documents/review/DocumentToolbar";
import { SmartRevisionsSidebar } from "@/components/documents/review/SmartRevisionsSidebar";
import { DocumentWorkspaceShell } from "@/components/documents/DocumentWorkspaceShell";
import { DocumentStatusBadge } from "@/app/components/DocumentStatusBadge";
import { Button } from "@/components/ui/button";
import { getDocument, askDocument, getDocumentRevisions, saveEditedContent, downloadDocumentDocx, isPlanUpsellError, type DocumentRevisionSuggestion } from "@/app/lib/webApi";
import { sanitizeInput } from "@/app/lib/sanitize";
import type { DocumentApiResponse } from "@/app/lib/webApi";
import { usePlanLimitHandler } from "@/app/lib/hooks/usePlanLimitHandler";

type DocumentResponse = DocumentApiResponse;

export default function DocumentReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const handlePlanLimit = usePlanLimitHandler();
  const id = params?.id;

  const [data, setData] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentContent, setDocumentContent] = useState("");

  // Revision state
  const [suggestedChanges, setSuggestedChanges] = useState<DocumentRevisionSuggestion[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Load document
  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const json = await getDocument(id);
        setData(json);
        if (json.document?.lastVersion?.rawText) {
          setDocumentContent(json.document.lastVersion.rawText);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Error de red al cargar el documento");
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Fetch revisions once document is loaded
  useEffect(() => {
    if (!id || loading) return;

    async function fetchRevisions() {
      if (!id) return;
      setLoadingRevisions(true);
      try {
        const revisions = await getDocumentRevisions(id);
        setSuggestedChanges(revisions);
      } catch (err) {
        if (isPlanUpsellError(err)) {
          // La sugerencia de revisiones no está en el plan — mostramos el CTA
          handlePlanLimit(err);
        }
        // Otros errores: silent — las revisiones son un nice-to-have
      } finally {
        setLoadingRevisions(false);
      }
    }

    fetchRevisions();
  }, [id, loading, handlePlanLimit]);

  const handleFinalize = async () => {
    if (!id) return;
    router.push(`/documents/${id}`);
  };

  const handleDownload = async () => {
    if (!id) return;
    const response = await fetch(`/api/_proxy/documents/${id}/pdf`);
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${id}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const showAiNotice = (msg: string) => {
    setAiNotice(msg);
    setTimeout(() => setAiNotice(null), 3000);
  };

  const handleApplyChange = useCallback(async (changeId: string) => {
    const change = suggestedChanges.find((c) => c.id === changeId);
    if (!change || !id) return;

    // Apply text replacement in document content
    const updated = documentContent.replace(change.original, change.suggested);
    if (updated === documentContent) {
      // Original text not found verbatim — just remove from list
      setSuggestedChanges((prev) => prev.filter((c) => c.id !== changeId));
      showAiNotice("Cambio marcado como aplicado.");
      return;
    }

    setDocumentContent(updated);
    setSuggestedChanges((prev) => prev.filter((c) => c.id !== changeId));

    // Persist to backend
    try {
      await saveEditedContent(id, updated);
      showAiNotice("Cambio aplicado y guardado.");
    } catch {
      showAiNotice("Cambio aplicado localmente (no se pudo guardar).");
    }
  }, [suggestedChanges, documentContent, id]);

  const handleIgnoreChange = useCallback((changeId: string) => {
    setSuggestedChanges((prev) => prev.filter((c) => c.id !== changeId));
  }, []);

  const handleAskAI = async (question: string): Promise<string> => {
    if (!id) throw new Error("No hay documento seleccionado");
    try {
      return await askDocument(id, question);
    } catch (err) {
      if (isPlanUpsellError(err)) {
        handlePlanLimit(err);
        // Devolvemos un mensaje amable en lugar de propagar el error feo
        return "Esta función no está disponible en tu plan actual. Revisá los planes disponibles para activarla.";
      }
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-pulse text-slate-500">Cargando documento...</div>
      </div>
    );
  }

  if (error || !data?.document) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="text-red-500">{error || "Documento no encontrado"}</div>
      </div>
    );
  }

  const doc = data.document;
  const documentTitle = doc.type || "Documento";
  const fileName = `${documentTitle}_V2.pdf`;
  const last = doc.lastVersion;
  const currentStatus = doc.estado || last?.status || "draft";

  return (
    <DocumentWorkspaceShell
      title="Revisión del documento"
      description={`${sanitizeInput(documentTitle)} · ${sanitizeInput(doc.jurisdiccion || "Sin jurisdicción")} · Ajustes finales antes de continuar.`}
      actions={
        <>
          <Link href="/documents">
            <Button variant="outline" className="flex items-center gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => id && downloadDocumentDocx(id, documentTitle).catch(() => {})}
            className="flex items-center gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <FileType className="h-4 w-4" />
            Descargar Word
          </Button>
          <Button type="button" onClick={handleFinalize} className="flex items-center gap-2">
            Finalizar
          </Button>
        </>
      }
    >
      {aiNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-lg shadow-lg">
          {aiNotice}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ReviewSummaryCard
          icon={<FileText className="h-5 w-5 text-primary" />}
          label="Documento"
          value={sanitizeInput(documentTitle)}
        />
        <ReviewSummaryCard
          icon={<MapPin className="h-5 w-5 text-primary" />}
          label="Jurisdicción"
          value={sanitizeInput(doc.jurisdiccion || "Sin definir")}
        />
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Estado actual</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <DocumentStatusBadge status={currentStatus} />
            <span className="text-xs text-slate-500 dark:text-slate-400 text-right">
              {last ? new Date(last.createdAt).toLocaleString("es-AR") : "Sin versión"}
            </span>
          </div>
        </div>
      </div>

      <main className="flex flex-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        {/* Left Sidebar: AI Assistant */}
        <AIAssistantSidebar
          documentId={id ?? undefined}
          documentContent={documentContent}
        />

        {/* Main Content Area: Editor */}
        <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto min-w-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 px-8 py-4 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70">
            <Link href="/documents" className="hover:text-primary transition-colors">
              Documentos
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 dark:text-slate-200 font-medium">{fileName}</span>
          </div>

          {/* Toolbar */}
          <DocumentToolbar className="mx-6 mt-5" />

          {/* Document Viewer */}
          <div className="flex-1 px-6 py-6">
            <div className="max-w-[850px] mx-auto rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 p-10 md:p-12 min-h-[1000px] text-slate-800 dark:text-slate-200 leading-relaxed text-base">
              {/* Document Title */}
              <h1 className="text-3xl font-bold mb-8 text-center border-b border-slate-100 dark:border-slate-800 pb-6">
                {documentTitle}
              </h1>

              {/* Document Content */}
              <div className="mb-6">
                {documentContent ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    {documentContent.split("\n").map((paragraph, index) => {
                      if (!paragraph.trim()) return <br key={index} />;

                      if (/^\d+\./.test(paragraph.trim())) {
                        return (
                          <h2 key={index} className="text-xl font-bold mb-4 mt-8">
                            {paragraph.trim()}
                          </h2>
                        );
                      }

                      return (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    No hay contenido disponible para mostrar.
                  </p>
                )}

                {/* Signature Lines */}
                <div className="h-24 w-full border-b-2 border-slate-100 dark:border-slate-800 mb-8 border-dashed"></div>
                <div className="flex justify-between items-end mt-12 px-8">
                  <div className="flex flex-col items-center">
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 w-48 mb-2"></div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Firma del Cliente
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 w-48 mb-2"></div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Firma del Prestador
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Smart Revisions */}
        <SmartRevisionsSidebar
          suggestedChanges={suggestedChanges}
          loadingRevisions={loadingRevisions}
          onApplyChange={handleApplyChange}
          onIgnoreChange={handleIgnoreChange}
          onAskAI={handleAskAI}
        />
      </main>
    </DocumentWorkspaceShell>
  );
}

function ReviewSummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">{icon}</div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{value}</p>
    </div>
  );
}
