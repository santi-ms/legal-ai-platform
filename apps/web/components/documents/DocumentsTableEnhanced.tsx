"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  FileIcon,
  History,
  Briefcase,
  Trash2,
  Plus,
  FolderOpen,
  Loader2,
  CheckSquare,
} from "lucide-react";
import { Document } from "@/app/lib/webApi";
import { formatDate, formatDocumentType } from "@/app/lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

interface DocumentsTableEnhancedProps {
  documents: Document[];
  onPreview?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onDownloadError?: (message: string) => void;
  hasActiveFilters?: boolean;
  deletingId?: string | null;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function DocumentsTableSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              {["", "Documento", "Tipo", "Última Modificación", "Estado", "Acciones"].map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-4 w-10">
                  <div className="size-4 rounded bg-slate-200 dark:bg-slate-700" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-36 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-4"><div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-700" /></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="size-7 rounded bg-slate-200 dark:bg-slate-700" />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function DocumentsEmptyState({ hasActiveFilters }: { hasActiveFilters?: boolean }) {
  if (hasActiveFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
          <FolderOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Sin resultados para esta búsqueda
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Intentá con otros filtros o borrá los activos para ver todos tus documentos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <FileText className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Todavía no tenés documentos
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        Creá tu primer contrato, NDA o documento legal en minutos usando nuestro flujo guiado con IA.
      </p>
      <Link href="/documents/new">
        <Button className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Crear primer documento
        </Button>
      </Link>
    </div>
  );
}

// ─── Status / Icon helpers ────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  generated_text: { label: "Generado",           className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", dotColor: "bg-emerald-500" },
  generated:      { label: "Generado",           className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", dotColor: "bg-emerald-500" },
  needs_review:   { label: "Requiere revisión",  className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",         dotColor: "bg-amber-500" },
  ready_pdf:      { label: "PDF listo",          className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",             dotColor: "bg-blue-500" },
  GENERATED:      { label: "Completado",         className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", dotColor: "bg-emerald-500" },
  DRAFT:          { label: "Borrador",           className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",            dotColor: "bg-slate-400" },
  PENDIENTE:      { label: "Pendiente de firma", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",         dotColor: "bg-amber-500" },
};

function getStatusConfig(status: string) {
  return statusConfig[status] || { label: status, className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", dotColor: "bg-slate-400" };
}

function getDocumentIcon(type: string) {
  const t = type?.toLowerCase() || "";
  if (t.includes("arrendamiento") || t.includes("lease"))        return { icon: FileIcon,  color: "bg-red-50 dark:bg-red-500/10 text-red-500" };
  if (t.includes("nda") || t.includes("confidencialidad"))       return { icon: FileText,  color: "bg-blue-50 dark:bg-blue-500/10 text-blue-500" };
  if (t.includes("poder") || t.includes("notarial"))             return { icon: History,   color: "bg-amber-50 dark:bg-amber-500/10 text-amber-500" };
  if (t.includes("laboral"))                                      return { icon: Briefcase, color: "bg-primary/10 text-primary" };
  return { icon: FileText, color: "bg-slate-50 dark:bg-slate-800 text-slate-500" };
}

function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const docDate = new Date(date);
  const diffMs = now.getTime() - docDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1)   return "Hace menos de 1h";
  if (diffHours < 24)  return `Hoy, ${docDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1)  return `Ayer, ${docDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  return formatDate(date);
}

// ─── Bulk Action Toolbar ──────────────────────────────────────────────────────

function BulkToolbar({
  count,
  onDelete,
  onClear,
  isDeleting,
}: {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl shadow-2xl shadow-black/30 animate-fade-in">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">
          {count} {count === 1 ? "documento seleccionado" : "documentos seleccionados"}
        </span>
      </div>
      <div className="w-px h-5 bg-slate-600 dark:bg-slate-300" />
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="flex items-center gap-1.5 text-sm font-semibold text-red-400 hover:text-red-300 dark:text-red-600 dark:hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Eliminar {count === 1 ? "documento" : "seleccionados"}
      </button>
      <div className="w-px h-5 bg-slate-600 dark:bg-slate-300" />
      <button
        onClick={onClear}
        disabled={isDeleting}
        className="text-sm text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 transition-colors disabled:opacity-50"
      >
        Deseleccionar
      </button>
    </div>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function DocumentsTableEnhanced({
  documents,
  onDelete,
  onBulkDelete,
  onDownloadError,
  hasActiveFilters,
  deletingId,
}: DocumentsTableEnhancedProps) {
  const [hoveredRow, setHoveredRow]       = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId]   = useState<string | null>(null);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm]     = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const deletionInFlightRef = useRef(false);

  // Limpia selección cuando cambian los documentos (ej: después de eliminar)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [documents]);

  // Cierra el single-delete dialog cuando termina la operación
  useEffect(() => {
    if (deletionInFlightRef.current && !deletingId) {
      deletionInFlightRef.current = false;
      setConfirmingId(null);
    }
  }, [deletingId]);

  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDownload = async (id: string) => {
    if (downloadingId) return;
    setDownloadingId(id);
    try {
      const response = await fetch(`/api/_proxy/documents/${id}/pdf`);
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        onDownloadError?.((json as any).message || "No se pudo descargar el PDF.");
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
    } catch (err) {
      onDownloadError?.(err instanceof Error ? err.message : "Error al descargar el PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (!onBulkDelete) return;
    setIsBulkDeleting(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsBulkDeleting(false);
      setBulkConfirm(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                {/* Select all checkbox */}
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    disabled={documents.length === 0}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Documento</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden lg:table-cell">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jurisdicción</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Última Modificación</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estado</th>
                <th className="min-w-[220px] px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <DocumentsEmptyState hasActiveFilters={hasActiveFilters} />
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const status     = doc.estado || "DRAFT";
                  const statusInfo = getStatusConfig(status);
                  const iconInfo   = getDocumentIcon(doc.type || "");
                  const Icon       = iconInfo.icon;
                  const isSelected = selectedIds.has(doc.id);

                  return (
                    <tr
                      key={doc.id}
                      onMouseEnter={() => setHoveredRow(doc.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={cn(
                        "hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group",
                        isSelected && "bg-primary/5 dark:bg-primary/10",
                        deletingId === doc.id && "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(doc.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary cursor-pointer"
                          aria-label={`Seleccionar documento ${doc.id}`}
                        />
                      </td>

                      {/* Document */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("size-10 rounded flex items-center justify-center", iconInfo.color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {formatDocumentType(doc.type)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              ID: {doc.id.slice(0, 13)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {doc.client ? (
                          <Link
                            href={`/clients/${doc.client.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium max-w-[140px] truncate"
                          >
                            {doc.client.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Jurisdicción */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {doc.jurisdiccion || "—"}
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatRelativeDate(doc.createdAt)}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", statusInfo.className)}>
                          <span className={cn("size-1.5 rounded-full mr-1.5", statusInfo.dotColor)} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="min-w-[320px] px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-nowrap items-center justify-end gap-2 text-sm">
                          <Link
                            href={`/documents/${doc.id}/edit`}
                            className="inline-flex shrink-0 px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            Editar
                          </Link>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <Link
                            href={`/documents/${doc.id}`}
                            className="inline-flex shrink-0 px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            Ver
                          </Link>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => handleDownload(doc.id)}
                            disabled={!!downloadingId}
                            className="inline-flex shrink-0 px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {downloadingId === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">|</span>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(doc.id)}
                            disabled={deletingId === doc.id}
                            className="inline-flex shrink-0 px-2 py-1 rounded-md border border-slate-300 text-red-600 hover:bg-red-50 dark:border-slate-600 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single delete dialog */}
      <ConfirmDialog
        open={confirmingId !== null}
        title="Eliminar documento"
        description="Esta acción no se puede deshacer. El documento será eliminado permanentemente."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        isLoading={deletingId === confirmingId}
        onConfirm={() => {
          if (confirmingId && onDelete) {
            deletionInFlightRef.current = true;
            onDelete(confirmingId);
          }
        }}
        onCancel={() => { if (!deletingId) setConfirmingId(null); }}
      />

      {/* Bulk delete dialog */}
      <ConfirmDialog
        open={bulkConfirm}
        title={`Eliminar ${selectedIds.size} ${selectedIds.size === 1 ? "documento" : "documentos"}`}
        description={`Esta acción no se puede deshacer. Se eliminarán permanentemente ${selectedIds.size} ${selectedIds.size === 1 ? "documento" : "documentos"}.`}
        confirmLabel="Eliminar todos"
        cancelLabel="Cancelar"
        variant="destructive"
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => { if (!isBulkDeleting) setBulkConfirm(false); }}
      />

      {/* Bulk action floating toolbar */}
      {selectedIds.size > 0 && (
        <BulkToolbar
          count={selectedIds.size}
          onDelete={() => setBulkConfirm(true)}
          onClear={() => setSelectedIds(new Set())}
          isDeleting={isBulkDeleting}
        />
      )}
    </>
  );
}
