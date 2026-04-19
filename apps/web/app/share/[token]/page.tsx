"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSharedDocument, type SharedDocumentInfo } from "@/app/lib/webApi";
import { FileText, Download, Clock, User, AlertTriangle, Loader2, Scale } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const JURIS_LABELS: Record<string, string> = {
  caba:    "CABA",
  bsas:    "Buenos Aires",
  cordoba: "Córdoba",
  rosario: "Rosario",
  mendoza: "Mendoza",
  tucuman: "Tucumán",
  nacional: "Jurisdicción Nacional",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SharedDocumentPage() {
  const params = useParams<{ token: string }>();
  const token  = params?.token;

  const [info, setInfo]       = useState<SharedDocumentInfo | null>(null);
  const [error, setError]     = useState<{ message: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getSharedDocument(token)
      .then(setInfo)
      .catch((err: any) => setError({ message: err.message, code: err.code }))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Error states ──
  if (error) {
    const isExpired = error.code === "EXPIRED";
    const isRevoked = error.code === "REVOKED";

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isExpired ? "Link expirado" : isRevoked ? "Link revocado" : "Link no disponible"}
          </h1>
          <p className="text-sm text-slate-500">
            {isExpired
              ? "Este link de compartición ya no es válido. Pedile al titular que te envíe uno nuevo."
              : isRevoked
              ? "El titular de este documento revocó el acceso a este link."
              : error.message}
          </p>
          <a
            href="/"
            className="inline-block text-sm font-semibold text-primary hover:underline mt-2"
          >
            Ir a DocuLex
          </a>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const { document: doc, share } = info;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar mínimo */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <Scale className="w-6 h-6 text-primary" />
        <span className="text-base font-bold text-slate-900">DocuLex</span>
        <span className="ml-2 text-xs text-slate-400 font-medium">· Documento compartido</span>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 pt-12">
        <div className="w-full max-w-lg space-y-4">

          {/* Hero card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            {/* Icon + title */}
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 flex-shrink-0">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 leading-snug">
                  {doc.typeLabel ?? doc.type ?? "Documento legal"}
                </h1>
                {doc.jurisdiccion && (
                  <p className="text-sm text-slate-500 mt-1">
                    {JURIS_LABELS[doc.jurisdiccion] ?? doc.jurisdiccion}
                  </p>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 gap-3">
              {doc.client && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Cliente</span>
                    <span className="font-medium text-slate-700">{doc.client.name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Creado el</span>
                  <span className="font-medium text-slate-700">{formatDate(doc.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Link vence el</span>
                  <span className="font-medium text-slate-700">{formatDate(share.expiresAt)}</span>
                </div>
              </div>
            </div>

            {/* Download button */}
            {doc.hasPdf && doc.pdfUrl ? (
              <a
                href={doc.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-400">
                PDF no disponible
              </div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 pb-8">
            Este documento fue compartido a través de{" "}
            <a href="/" className="text-primary font-medium hover:underline">DocuLex</a>.
            El acceso vence automáticamente el {formatDate(share.expiresAt)}.
          </p>
        </div>
      </main>
    </div>
  );
}
