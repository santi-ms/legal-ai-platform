"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/app/components/DashboardShell";
import { ArrowLeft, Download, Save, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

export default function DocumentEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [content, setContent] = useState("");
  const [originalAiText, setOriginalAiText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [documentType, setDocumentType] = useState("");

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
          // Si hay contenido editado previo, cargarlo; si no, el texto original de la IA
          const initialContent = last.editedContent ?? last.rawText ?? "";
          setContent(initialContent);
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
    setSavedOk(false);
  }, []);

  async function handleSave() {
    if (!id || !isDirty) return;
    setSaving(true);
    setError(null);
    setSavedOk(false);

    try {
      const { saveEditedContent } = await import("@/app/lib/webApi");
      await saveEditedContent(id, content);
      setSavedOk(true);
      setIsDirty(false);
      setTimeout(() => setSavedOk(false), 4000);
    } catch (err: any) {
      setError(err?.message || "Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!id) return;

    // Guardar primero si hay cambios sin guardar
    if (isDirty) {
      await handleSave();
      if (error) return;
    }

    setDownloading(true);
    setDownloadError(null);

    try {
      const response = await fetch(`/api/_proxy/documents/${id}/pdf`);
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const msg = (json as any).message || "No se pudo generar el PDF.";
        setDownloadError(msg);
        setDownloading(false);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("No se pudo generar el PDF. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setDownloading(false);
    }
  }

  function handleRestoreOriginal() {
    if (!originalAiText) return;
    if (!window.confirm("¿Querés restaurar el texto original generado por IA? Se perderán los cambios actuales.")) return;
    setContent(originalAiText);
    setIsDirty(true);
    setSavedOk(false);
  }

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

  if (error && !content) {
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
          <Link
            href={`/documents/${id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          {originalAiText && content !== originalAiText && (
            <button
              type="button"
              onClick={handleRestoreOriginal}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar original
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Generando PDF…" : "Descargar PDF"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Feedback guardar */}
        {savedOk && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Cambios guardados correctamente. El próximo PDF usará este contenido.
          </div>
        )}

        {/* Error guardar */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Error descarga */}
        {downloadError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {downloadError}
          </div>
        )}

        {/* Indicador de cambios sin guardar */}
        {isDirty && !saving && (
          <p className="text-xs text-amber-600">
            Tenés cambios sin guardar. Guardá antes de descargar el PDF o hacé clic en &quot;Descargar PDF&quot; para guardar y descargar en un solo paso.
          </p>
        )}

        {/* Editor */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="doc-editor" className="sr-only">
            Contenido del documento
          </label>
          <textarea
            id="doc-editor"
            value={content}
            onChange={handleChange}
            spellCheck
            className="w-full min-h-[65vh] rounded-2xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-800 shadow-sm ring-1 ring-black/[0.02] focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono"
            placeholder="El contenido del documento aparecerá aquí…"
          />
          <p className="text-xs text-gray-400 text-right">
            {content.length.toLocaleString("es-AR")} caracteres
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
