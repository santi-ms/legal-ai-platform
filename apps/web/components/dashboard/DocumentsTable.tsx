"use client";

import { Eye, Download, Copy, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document, getPdfUrl } from "@/app/lib/webApi";
import { formatDate, formatDocumentType } from "@/app/lib/format";
import { DocumentStatusBadge } from "@/app/components/DocumentStatusBadge";
import Link from "next/link";
import { cn } from "@/app/lib/utils";

interface DocumentsTableProps {
  documents: Document[];
  isAdmin: boolean;
  onPreview: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DocumentsTable({
  documents,
  isAdmin,
  onPreview,
  onDuplicate,
  onDelete,
}: DocumentsTableProps) {
  const handleDownload = (id: string) => {
    window.open(getPdfUrl(id), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-900 border-b border-neutral-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Jurisdicción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-neutral-900 divide-y divide-neutral-800">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-neutral-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm font-medium text-white">
                      {formatDocumentType(doc.type)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-neutral-300">
                    {doc.jurisdiccion}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <DocumentStatusBadge status={doc.estado} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-neutral-400">
                    {formatDate(doc.createdAt)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {doc.lastVersion?.pdfUrl && (
                      <>
                        <button
                          onClick={() => onPreview(doc.id)}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          aria-label="Ver PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc.id)}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          aria-label="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDuplicate(doc.id)}
                      className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                      aria-label="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-neutral-800 rounded transition-colors"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
