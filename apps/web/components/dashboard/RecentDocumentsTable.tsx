"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Sparkles } from "lucide-react";
import { formatDate, formatDocumentType } from "@/app/lib/format";
import { Document } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

interface RecentDocumentsTableProps {
  documents: Document[];
  onViewAll?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Backend values (lowercase)
  generated: {
    label: "Generado",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  generated_text: {
    label: "Generado",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  needs_review: {
    label: "Requiere revisión",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  draft: {
    label: "Borrador",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  },
  // Legacy Spanish values
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
    statusConfig[status] ||
    statusConfig[status.toLowerCase()] ||
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

export const RecentDocumentsTable = React.memo(function RecentDocumentsTable({
  documents,
  onViewAll,
}: RecentDocumentsTableProps) {
  const router = useRouter();
  // Limitar a los 4 más recientes
  const recentDocs = documents.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Documentos Recientes</h3>
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
              <th className="px-6 py-4 font-semibold text-center">Estado</th>
              <th className="px-6 py-4 font-semibold text-center">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentDocs.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
                    <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Todavía no tenés documentos
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                        Creá tu primer documento legal con IA en menos de 5 minutos.
                      </p>
                    </div>
                    <Link
                      href="/documents/new"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      <Plus className="w-4 h-4" />
                      Crear primer documento
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              recentDocs.map((doc) => {
                const status = doc.estado || "BORRADOR";
                const statusInfo = getStatusConfig(status);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{formatDocumentType(doc.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase",
                          statusInfo.className
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      {formatRelativeDate(doc.createdAt)}
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
});

