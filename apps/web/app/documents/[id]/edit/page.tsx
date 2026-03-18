"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/app/components/DashboardShell";
import { ArrowLeft } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PlainTextDocumentEditor } from "@/src/features/documents/ui/editor/PlainTextDocumentEditor";
import { usePlainTextDocumentEditor } from "@/src/features/documents/ui/editor/usePlainTextDocumentEditor";

export default function DocumentEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [initialContent, setInitialContent] = useState("");
  const [originalAiText, setOriginalAiText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState("");

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
      <DashboardShell title="Editor de documento" description="Cargando contenido…">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-[60vh] bg-gray-100 rounded-2xl" />
        </div>
      </DashboardShell>
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
    <DashboardShell
      title="Editor de documento"
      description={`${documentType || "Documento"} · Edición manual`}
      action={
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => documentEditor.requestNavigation(() => router.push(`/documents/${id}`))}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
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
    </DashboardShell>
  );
}
