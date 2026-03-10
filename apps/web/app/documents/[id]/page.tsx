"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/app/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
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
    console.log("[document-detail] handleDownload CLICKED");
    console.log("[document-detail] id:", id);
    console.log("[document-detail] data:", data);
    console.log("[document-detail] lastVersion:", data?.document?.lastVersion);
    
    if (!id || !data?.document?.lastVersion?.rawText) {
      console.error("[document-detail] No hay texto para generar PDF");
      alert("Error: No hay contenido para generar el PDF");
      return;
    }
    
    try {
      console.log("[document-detail] Iniciando descarga de PDF");
      console.log("[document-detail] Document ID:", id);
      console.log("[document-detail] Text length:", data.document.lastVersion.rawText?.length || 0);
      
      // Dynamic import de jsPDF para evitar problemas con SSR
      const { jsPDF } = await import("jspdf");
      console.log("[document-detail] jsPDF imported successfully");
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      let yPosition = margin;

      // TEXTO DE PRUEBA
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("PRUEBA: Este texto debe ser visible", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Título
      const documentTitle = data.document.type || "DOCUMENTO";
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      const titleLines = doc.splitTextToSize(documentTitle.toUpperCase(), maxWidth);
      doc.text(titleLines, pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += titleLines.length * 8 + 10;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Limpiar texto
      let cleanText = data.document.lastVersion.rawText
        .trim()
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1");

      const lines = cleanText.split("\n").filter((line) => line.trim().length > 0);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      console.log("[document-detail] Escribiendo", lines.length, "líneas");

      for (const line of lines) {
        if (yPosition > pageHeight - margin - 20) {
          doc.addPage();
          yPosition = margin;
        }

        const textLines = doc.splitTextToSize(line.trim(), maxWidth);
        
        for (const textLine of textLines) {
          if (yPosition > pageHeight - margin - 20) {
            doc.addPage();
            yPosition = margin;
          }
          
          doc.setTextColor(0, 0, 0);
          doc.text(textLine, margin, yPosition);
          yPosition += 6;
        }
        
        yPosition += 2;
      }

      // Firma
      if (yPosition > pageHeight - margin - 30) {
        doc.addPage();
        yPosition = margin;
      }

      yPosition += 20;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, margin + 80, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Firma / Aclaración / DNI", margin, yPosition);

      const fileName = `${id}.pdf`;
      console.log("[document-detail] Guardando PDF:", fileName);
      doc.save(fileName);
      console.log("[document-detail] PDF generado exitosamente");
    } catch (error) {
      console.error("[document-detail] Error al generar PDF:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
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
              value={sanitizeInput(doc.type || "")}
            />
            <MetaField
              label="Jurisdicción"
              value={sanitizeInput(doc.jurisdiccion || "")}
            />
            <MetaField
              label="Estado"
              value={sanitizeInput(doc.estado || "")}
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
