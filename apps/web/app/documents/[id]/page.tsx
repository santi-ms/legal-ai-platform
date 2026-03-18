"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { DashboardShell } from "@/app/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, AlertTriangle } from "lucide-react";
import { SkeletonDocumentDetail } from "@/components/ui/skeleton";
import { sanitizeInput } from "@/app/lib/sanitize";
import type {
  Document as ProxyDocument,
  DocumentApiResponse as ProxyDocumentResponse,
} from "@/app/lib/webApi";

type DocumentResponse = ProxyDocumentResponse;
type LastVersion = ProxyDocument["lastVersion"];

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadErrorRef = useRef<HTMLDivElement>(null);

  // carga el documento
  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const { getDocument } = await import("@/app/lib/webApi");
        const json = await getDocument(id);
        setData(json);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Error de red al cargar el documento");
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleDownload() {
    setDownloadError(null);
    if (!id) return;

    try {
      const response = await fetch(`/api/_proxy/documents/${id}/pdf`);
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const msg = (json as any).message || "No se pudo descargar el PDF.";
        setDownloadError(msg);
        setTimeout(() => downloadErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
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
      setDownloadError("No se pudo generar el PDF. Revisá tu conexión e intentá de nuevo.");
      setTimeout(() => downloadErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }
  }

  // distintos estados

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Cargando id…
      </div>
    );
  }

  if (loading) {
    return (
      <DashboardShell
        title="Cargando documento"
        description="Obteniendo información del documento..."
      >
        <SkeletonDocumentDetail />
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data?.document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Documento no encontrado.
      </div>
    );
  }

  // data lista
  const doc = data.document;
  const last = doc.lastVersion;

  // armamos los textos que van al header
  const headerDescription = `${sanitizeInput(doc.type || "")} • ${sanitizeInput(doc.jurisdiccion || "")} • ${
    last
      ? `Actualizado ${new Date(last.createdAt).toLocaleString("es-AR")}`
      : "Sin versión generada"
  }`;

  return (
    <DashboardShell
      title={`Documento #${doc.id.slice(0, 8)}`}
      description={headerDescription}
      action={
        <div className="flex flex-col sm:flex-row gap-2">
          {last?.rawText && (
            last?.status === "needs_review" ? (
              <button
                type="button"
                disabled
                title="El documento requiere revisión antes de generar el PDF final"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed"
              >
                <AlertTriangle className="h-4 w-4" />
                PDF no disponible
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownload();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 hover:shadow-md transition-all"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            )
          )}

          {/* Podrías agregar acá un botón Volver a /documents si querés */}
          {/* <Link href="/documents">
            <Button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900">
              Volver
            </Button>
          </Link> */}
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        {/* BANNER NEEDS REVIEW — con detalle de issues si están disponibles */}
        {last?.status === "needs_review" && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Este documento requiere revisión
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  El sistema detectó posibles placeholders o contenido incompleto durante la generación. Revisá el texto antes de usarlo. El PDF no se generó automáticamente.
                </p>
              </div>
            </div>
            {last?.outputWarnings && last.outputWarnings.length > 0 && (
              <ul className="space-y-1 pl-8">
                {last.outputWarnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-400 list-disc">
                    {w.message}
                    {w.match && (
                      <code className="ml-1 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-mono">
                        {w.match}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ERROR DE DESCARGA */}
        {downloadError && (
          <div
            ref={downloadErrorRef}
            className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Error al descargar
              </p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
                {downloadError}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="shrink-0 text-sm font-semibold text-red-700 dark:text-red-400 hover:underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* CARD DE METADATOS */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <MetaField
              label="Tipo de documento"
              value={sanitizeInput(doc.type || "")}
            />
            <MetaField
              label="Jurisdicción"
              value={sanitizeInput(doc.jurisdiccion || "")}
            />
            <MetaField
              label="Estado"
              value={
                doc.estado === "needs_review" ? "Requiere revisión"
                : doc.estado === "generated" || doc.estado === "generated_text" ? "Generado"
                : sanitizeInput(doc.estado || "")
              }
              valueClassName={
                doc.estado === "GENERATED" || doc.estado === "generated" || doc.estado === "generated_text"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : doc.estado === "needs_review"
                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                  : doc.estado === "DRAFT"
                  ? "text-amber-700"
                  : "text-gray-700"
              }
            />
            <MetaField
              label="Tono"
              value={sanitizeInput(doc.tono || "—")}
            />
            <MetaField
              label="Costo estimado (USD)"
              value={
                doc.costUsd !== null ? `$${doc.costUsd}` : "—"
              }
            />
            {last?.pdfUrl && (
              <MetaField
                label="PDF"
                value="Disponible para descarga"
              />
            )}
          </div>
        </section>

        {/* CONTENIDO LEGAL */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
                Contenido legal
              </h2>
              <p className="text-xs text-gray-500">
                Texto generado automáticamente listo para revisión.
              </p>
            </div>

            {last && (
              <span className="text-[11px] text-gray-500">
                Versión #{last.id.slice(0, 6)}
              </span>
            )}
          </div>

          {last ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02] text-sm leading-relaxed text-gray-800 whitespace-pre-wrap max-h-[70vh] overflow-y-auto">
              {sanitizeInput(last.rawText)}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-sm">
              Todavía no hay una versión generada para este documento.
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

/**
 * Campo reutilizable de metadatos
 */
function MetaField({
  label,
  value,
  valueClassName,
  mono,
  small,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase font-medium text-gray-500 tracking-wide">
        {label}
      </span>
      <span
        className={[
          "font-medium text-gray-900",
          mono ? "font-mono break-words" : "",
          small ? "text-[11px] leading-normal text-gray-500" : "text-sm",
          valueClassName || "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value || "—"}
      </span>
    </div>
  );
}
