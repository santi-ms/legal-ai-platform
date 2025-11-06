"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/app/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { SkeletonDocumentDetail } from "@/components/ui/skeleton";

type LastVersion = {
  id: string;
  rawText: string;
  pdfUrl: string | null;
  createdAt: string;
};

type DocumentResponse = {
  ok: boolean;
  document: {
    id: string;
    type: string;
    jurisdiccion: string;
    tono: string;
    estado: string;
    costUsd: number | null;
    lastVersion: LastVersion | null;
  };
};

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  function handleDownload() {
    if (!id) return;
    // Usar el proxy para el PDF
    window.open(
      `/api/_proxy/documents/${id}/pdf`,
      "_blank",
      "noopener,noreferrer"
    );
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
  const headerDescription = `${doc.type} • ${doc.jurisdiccion} • ${
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
          {last?.pdfUrl && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-teal-700/30 hover:bg-teal-500 hover:shadow-md transition-all"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
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
        {/* CARD DE METADATOS */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <MetaField
              label="Tipo de documento"
              value={doc.type}
            />
            <MetaField
              label="Jurisdicción"
              value={doc.jurisdiccion}
            />
            <MetaField
              label="Estado"
              value={doc.estado}
              valueClassName={
                doc.estado === "GENERATED"
                  ? "text-emerald-700"
                  : doc.estado === "DRAFT"
                  ? "text-amber-700"
                  : "text-gray-700"
              }
            />
            <MetaField
              label="Tono"
              value={doc.tono || "—"}
            />
            <MetaField
              label="Costo estimado (USD)"
              value={
                doc.costUsd !== null ? `$${doc.costUsd}` : "—"
              }
            />
            {last?.pdfUrl && (
              <MetaField
                label="Ruta interna PDF"
                value={last.pdfUrl}
                mono
                small
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
              {last.rawText}
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
