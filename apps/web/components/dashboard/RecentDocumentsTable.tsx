"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { formatDate, formatDocumentType } from "@/app/lib/format";
import { Document } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

interface RecentDocumentsTableProps {
  documents: Document[];
  onViewAll?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  FIRMADO: {
    label: "Firmado",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  "EN REVISIÓN": {
    label: "En Revisión",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  BORRADOR: {
    label: "Borrador",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  },
};

function getStatusConfig(status: string) {
  return (
    statusConfig[status.toUpperCase()] || {
      label: status,
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    }
  );
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
    return `Hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return `${diffDays} días`;
  } else {
    return formatDate(date);
  }
}

export function RecentDocumentsTable({
  documents,
  onViewAll,
}: RecentDocumentsTableProps) {
  // Limitar a los 4 más recientes
  const recentDocs = documents.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Documentos Recientes</h3>
        {onViewAll ? (
          <button
            onClick={onViewAll}
            className="text-primary text-sm font-semibold hover:underline"
          >
            Ver todo
          </button>
        ) : (
          <Link href="/documents" className="text-primary text-sm font-semibold hover:underline">
            Ver todo
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Nombre del Documento</th>
              <th className="px-6 py-4 font-semibold">Cliente</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentDocs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  No hay documentos recientes
                </td>
              </tr>
            ) : (
              recentDocs.map((doc) => {
                const status = doc.estado || "BORRADOR";
                const statusInfo = getStatusConfig(status);
                const clientName = doc.clientName || "Sin cliente"; // TODO: obtener del documento

                return (
                  <Link key={doc.id} href={`/documents/${doc.id}`}>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="font-medium">{formatDocumentType(doc.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {clientName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase",
                            statusInfo.className
                          )}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatRelativeDate(doc.createdAt)}
                      </td>
                    </tr>
                  </Link>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

