"use client";

/**
 * AnnotationsCard — notas/comentarios internos de un documento.
 *
 * Features:
 *  - Lista de anotaciones con autor, fecha y contenido
 *  - Marcar como resuelto / sin resolver
 *  - Agregar nueva anotación
 *  - Eliminar anotaciones propias
 */

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import {
  listDocumentAnnotations,
  createDocumentAnnotation,
  updateDocumentAnnotation,
  deleteDocumentAnnotation,
  type DocumentAnnotation,
} from "@/app/lib/webApi";

function AnnotationItem({
  annotation,
  documentId,
  onUpdate,
  onDelete,
}: {
  annotation: DocumentAnnotation;
  documentId: string;
  onUpdate: (updated: DocumentAnnotation) => void;
  onDelete: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleToggleResolved = async () => {
    setLoading(true);
    try {
      const updated = await updateDocumentAnnotation(documentId, annotation.id, {
        resolved: !annotation.resolved,
      });
      onUpdate(updated);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDocumentAnnotation(documentId, annotation.id);
      onDelete(annotation.id);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const authorLabel = annotation.author?.name || annotation.author?.email || "Usuario";
  const date = new Date(annotation.createdAt).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
        annotation.resolved
          ? "opacity-60 bg-slate-50 dark:bg-slate-800/30"
          : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50"
      }`}
    >
      {/* Resolve toggle */}
      <button
        onClick={handleToggleResolved}
        disabled={loading}
        title={annotation.resolved ? "Marcar como pendiente" : "Marcar como resuelto"}
        className="flex-shrink-0 mt-0.5 text-slate-300 hover:text-primary transition-colors disabled:opacity-50"
      >
        {annotation.resolved ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${
            annotation.resolved
              ? "line-through text-slate-400 dark:text-slate-500"
              : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {annotation.content}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {authorLabel} · {date}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={loading}
        title="Eliminar anotación"
        className="flex-shrink-0 p-1 rounded text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

export function AnnotationsCard({ documentId }: { documentId: string }) {
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [newText, setNewText]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listDocumentAnnotations(documentId)
      .then(setAnnotations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [documentId]);

  const handleAdd = async () => {
    const content = newText.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      const created = await createDocumentAnnotation(documentId, content);
      setAnnotations((prev) => [...prev, created]);
      setNewText("");
      textareaRef.current?.focus();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  const pending  = annotations.filter((a) => !a.resolved).length;
  const resolved = annotations.filter((a) =>  a.resolved).length;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Notas internas
          </h2>
          {annotations.length > 0 && (
            <div className="flex items-center gap-1.5 ml-1">
              {pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {pending} pendiente{pending !== 1 ? "s" : ""}
                </span>
              )}
              {resolved > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {resolved} resuelta{resolved !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Annotations list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : annotations.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-3">
          Sin notas todavía. Agregá una nota interna para este documento.
        </p>
      ) : (
        <div className="space-y-2">
          {annotations.map((a) => (
            <AnnotationItem
              key={a.id}
              annotation={a}
              documentId={documentId}
              onUpdate={(updated) =>
                setAnnotations((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
              }
              onDelete={(id) =>
                setAnnotations((prev) => prev.filter((x) => x.id !== id))
              }
            />
          ))}
        </div>
      )}

      {/* New annotation input */}
      <div className="flex gap-2 items-end pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <textarea
          ref={textareaRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Escribí una nota interna… (Ctrl+Enter para guardar)"
          className="flex-1 resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim() || submitting}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Agregar nota (Ctrl+Enter)"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Agregar
            </>
          )}
        </button>
      </div>
    </section>
  );
}
