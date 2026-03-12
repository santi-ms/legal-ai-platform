"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  Edit,
  Mail,
  MoreVertical,
  FileIcon,
  History,
  Briefcase,
} from "lucide-react";
import { Document, getDocument } from "@/app/lib/webApi";
import { formatDate, formatDocumentType } from "@/app/lib/format";
import { generatePdfFromText } from "@/app/lib/pdfGenerator";
import { cn } from "@/app/lib/utils";

interface DocumentsTableEnhancedProps {
  documents: Document[];
  onPreview?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  GENERATED: {
    label: "Completado",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  DRAFT: {
    label: "Borrador",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    dotColor: "bg-slate-400",
  },
  PENDIENTE: {
    label: "Pendiente de firma",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status] || {
      label: status,
      className: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      dotColor: "bg-slate-400",
    }
  );
}

function getDocumentIcon(type: string) {
  const typeLower = type?.toLowerCase() || "";
  if (typeLower.includes("arrendamiento") || typeLower.includes("lease")) {
    return { icon: FileIcon, color: "bg-red-50 dark:bg-red-500/10 text-red-500" };
  }
  if (typeLower.includes("nda") || typeLower.includes("confidencialidad")) {
    return { icon: FileText, color: "bg-blue-50 dark:bg-blue-500/10 text-blue-500" };
  }
  if (typeLower.includes("poder") || typeLower.includes("notarial")) {
    return { icon: History, color: "bg-amber-50 dark:bg-amber-500/10 text-amber-500" };
  }
  if (typeLower.includes("laboral")) {
    return { icon: Briefcase, color: "bg-primary/10 text-primary" };
  }
  return { icon: FileText, color: "bg-slate-50 dark:bg-slate-800 text-slate-500" };
}

function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const docDate = new Date(date);
  const diffMs = now.getTime() - docDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return "Hace menos de 1h";
  } else if (diffHours < 24) {
    return `Hoy, ${docDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Ayer, ${docDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return formatDate(date);
  } else {
    return formatDate(date);
  }
}

export function DocumentsTableEnhanced({
  documents,
  onPreview,
  onEdit,
  onDelete,
}: DocumentsTableEnhancedProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleDownload = async (id: string, doc: Document) => {
    try {
      let rawText = doc.lastVersion?.rawText;
      let documentType = doc.type || "DOCUMENTO";

      if (!rawText) {
        const documentData = await getDocument(id);
        rawText = documentData.document?.lastVersion?.rawText;
        documentType = documentData.document?.type || "DOCUMENTO";
      }

      if (!rawText) {
        alert("Error: No hay contenido para generar el PDF");
        return;
      }

      generatePdfFromText(documentType, rawText, `${id}.pdf`);
    } catch (error) {
      console.error("[documents-table] Error generating PDF:", error);
      alert(`Error al generar el PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Documento
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tipo
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Última Modificación
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estado
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No hay documentos disponibles
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const status = doc.estado || "DRAFT";
                const statusInfo = getStatusConfig(status);
                const iconInfo = getDocumentIcon(doc.type || "");
                const Icon = iconInfo.icon;
                const isHovered = hoveredRow === doc.id;

                return (
                  <tr
                    key={doc.id}
                    onMouseEnter={() => setHoveredRow(doc.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group"
                  >
                    {/* Document */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-10 rounded flex items-center justify-center",
                            iconInfo.color
                          )}
                        >
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

                    {/* Type */}
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {doc.jurisdiccion || "—"}
                    </td>

                    {/* Last Modification */}
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {formatRelativeDate(doc.createdAt)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          statusInfo.className
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full mr-1.5", statusInfo.dotColor)}></span>
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div
                        className={cn(
                          "flex items-center justify-end gap-2 transition-opacity",
                          isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {doc.lastVersion?.rawText && (
                          <>
                            <button
                              onClick={() => handleDownload(doc.id, doc)}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-400"
                              title="Descargar"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-400"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </>
                        )}
                        {status === "DRAFT" && onEdit && (
                          <Link
                            href={`/documents/${doc.id}/review`}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-400"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {status === "PENDIENTE" && (
                          <button
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-primary"
                            title="Recordar firma"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-600 dark:text-slate-400"
                          title="Más opciones"
                        >
                          <MoreVertical className="w-4 h-4" />
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
  );
}

