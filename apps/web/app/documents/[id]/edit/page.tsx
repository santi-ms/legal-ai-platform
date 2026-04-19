"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, CalendarClock, FileText, MapPin } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlainTextDocumentEditor } from "@/src/features/documents/ui/editor/PlainTextDocumentEditor";
import { usePlainTextDocumentEditor } from "@/src/features/documents/ui/editor/usePlainTextDocumentEditor";
import { DocumentWorkspaceShell } from "@/components/documents/DocumentWorkspaceShell";
import { DocumentStatusBadge } from "@/app/components/DocumentStatusBadge";
import { Button } from "@/components/ui/button";

export default function DocumentEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [initialContent, setInitialContent] = useState("");
  const [originalAiText, setOriginalAiText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [documentJurisdiction, setDocumentJurisdiction] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const [lastVersionCreatedAt, setLastVersionCreatedAt] = useState<string | null>(null);

  const documentEditor = usePlainTextDocumentEditor({
    documentId: id,
    initialContent,
    originalContent: originalAiText,
    enabled: Boolean(id) && !loading,
  });

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const { getDocument } = await import("@/app/lib/webApi");
        const json = await getDocument(id);
        const doc = json?.document;
        const last = doc?.lastVersion;

        if (!doc) {
          setError("Documento no encontrado.");
          setLoading(false);
          return;
        }

        setDocumentType(doc.type ?? "");
        setDocumentJurisdiction(doc.jurisdiccion ?? "");
        setDocumentStatus(doc.estado ?? last?.status ?? "draft");
        setLastVersionCreatedAt(last?.createdAt ?? null);

        if (last) {
          const nextInitialContent = last.editedContent ?? last.rawText ?? "";
          setInitialContent(nextInitialContent);
          setOriginalAiText(last.rawText ?? "");
        }

        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Error al cargar el documento");
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Estados de carga / error ──────────────────────────────────────────────

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Cargando…
      </div>
    );
  }

  if (loading) {
    return (
      <DocumentWorkspaceShell title="Editor de documento" description="Cargando contenido editable del documento.">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-slate-100 rounded-2xl" />
            <div className="h-28 bg-slate-100 rounded-2xl" />
            <div className="h-28 bg-slate-100 rounded-2xl" />
          </div>
          <div className="h-[60vh] bg-slate-100 rounded-2xl" />
        </div>
      </DocumentWorkspaceShell>
    );
  }

  if (error && !initialContent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // ── Render principal ──────────────────────────────────────────────────────

  return (
    <DocumentWorkspaceShell
      title="Editor de documento"
      description={`${documentType || "Documento"} · Edición manual con autosave y descarga PDF integrada.`}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => documentEditor.requestNavigation(() => router.push(`/documents/${id}`))}
            className="flex items-center gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <EditorSummaryCard
            icon={<FileText className="h-5 w-5 text-primary" />}
            label="Documento"
            value={documentType || "Documento"}
          />
          <EditorSummaryCard
            icon={<MapPin className="h-5 w-5 text-primary" />}
            label="Jurisdicción"
            value={documentJurisdiction || "Sin definir"}
          />
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Estado actual</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <DocumentStatusBadge status={documentStatus || "draft"} />
              <span className="text-xs text-slate-500 dark:text-slate-400 text-right">
                {lastVersionCreatedAt ? new Date(lastVersionCreatedAt).toLocaleString("es-AR") : "Sin versión"}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Edición del contenido</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Los cambios se guardan con la lógica actual de autosave, retry, guardado manual y protección de navegación.
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              ID {id?.slice(0, 8)}
            </div>
          </div>

          <PlainTextDocumentEditor
            content={documentEditor.content}
            originalContent={documentEditor.originalContent}
            isDirty={documentEditor.isDirty}
            isManualSaving={documentEditor.isManualSaving}
            isSaving={documentEditor.isSaving}
            isAutosaveRetrying={documentEditor.isAutosaveRetrying}
            saveStatus={documentEditor.saveStatus}
            saveError={documentEditor.saveError}
            lastSavedAt={documentEditor.lastSavedAt}
            isDownloadingPdf={documentEditor.isDownloadingPdf}
            pdfDownloadError={documentEditor.pdfDownloadError}
            editorRef={documentEditor.editorRef}
            onSave={documentEditor.save}
            onRestoreOriginal={documentEditor.restoreOriginal}
            onDownloadPdf={documentEditor.downloadPdf}
            onDismissPdfDownloadError={documentEditor.dismissPdfDownloadError}
            onEditorInput={documentEditor.handleEditorInput}
            onEditorPaste={documentEditor.handleEditorPaste}
            onEditorDrop={documentEditor.handleEditorDrop}
            onEditorKeyDown={documentEditor.handleEditorKeyDown}
          />
        </section>
      </div>

      <ConfirmDialog
        open={documentEditor.confirmNavigationOpen}
        variant="destructive"
        title="Hay cambios sin guardar"
        description="Si continuás con esta navegación, vas a perder las ediciones del documento que todavía no guardaste."
        confirmLabel="Salir igual"
        cancelLabel="Seguir editando"
        onConfirm={documentEditor.confirmNavigation}
        onCancel={documentEditor.cancelNavigation}
      />
    </DocumentWorkspaceShell>
  );
}

function EditorSummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
