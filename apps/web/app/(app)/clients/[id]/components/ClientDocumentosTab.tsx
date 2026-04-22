"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Document } from "@/app/lib/webApi";
import { formatDocumentType } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

interface ClientDocumentosTabProps {
  documents: Document[];
  isLoading: boolean;
}

export function ClientDocumentosTab({ documents, isLoading }: ClientDocumentosTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Documentos asociados
          </h3>
          {documents.length > 0 && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
              {documents.length}
            </span>
          )}
        </div>
        <Link href="/documents" className="text-xs text-primary hover:underline font-medium">
          Ver todos
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="size-8 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin documentos</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Generá un documento y asignalo a este cliente desde el detalle del documento.
            </p>
          </div>
          <Link
            href="/documents/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1"
          >
            Crear documento
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="size-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {formatDocumentType(doc.type)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(doc.createdAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                doc.estado === "generated" || doc.estado === "generated_text"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                  : doc.estado === "needs_review"
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              )}>
                {doc.estado === "generated" || doc.estado === "generated_text"
                  ? "Generado"
                  : doc.estado === "needs_review"
                  ? "En revisión"
                  : doc.estado || "Borrador"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
