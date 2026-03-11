"use client";

import { Eye, Download, Copy, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document, getDocument } from "@/app/lib/webApi";
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
  const handleDownload = async (id: string, doc: Document) => {
    try {
      console.log("[documents-table] Download clicked for:", id);
      
      // Si ya tenemos el rawText en el documento, usarlo directamente
      let rawText = doc.lastVersion?.rawText;
      let documentType = doc.type || "DOCUMENTO";
      
      // Si no tenemos rawText, obtener el documento completo
      if (!rawText) {
        console.log("[documents-table] Fetching document to get rawText...");
        const documentData = await getDocument(id);
        rawText = documentData.document?.lastVersion?.rawText;
        documentType = documentData.document?.type || "DOCUMENTO";
      }
      
      if (!rawText) {
        alert("Error: No hay contenido para generar el PDF");
        return;
      }
      
      console.log("[documents-table] Generating PDF with jsPDF...");
      
      // Dynamic import de jsPDF
      const { jsPDF } = await import("jspdf");
      
      const pdfDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdfDoc.internal.pageSize.getWidth();
      const pageHeight = pdfDoc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      let yPosition = margin;

      // TEXTO DE PRUEBA
      pdfDoc.setFontSize(16);
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setTextColor(0, 0, 0);
      pdfDoc.text("PRUEBA: Este texto debe ser visible", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Título
      pdfDoc.setFontSize(18);
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setTextColor(0, 0, 0);
      const titleLines = pdfDoc.splitTextToSize(documentType.toUpperCase(), maxWidth);
      pdfDoc.text(titleLines, pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += titleLines.length * 8 + 10;

      // Línea separadora
      pdfDoc.setLineWidth(0.5);
      pdfDoc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Limpiar texto
      let cleanText = rawText
        .trim()
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1");

      const lines = cleanText.split("\n").filter((line) => line.trim().length > 0);

      pdfDoc.setFontSize(11);
      pdfDoc.setFont("helvetica", "normal");
      pdfDoc.setTextColor(0, 0, 0);

      for (const line of lines) {
        if (yPosition > pageHeight - margin - 20) {
          pdfDoc.addPage();
          yPosition = margin;
        }

        const textLines = pdfDoc.splitTextToSize(line.trim(), maxWidth);
        
        for (const textLine of textLines) {
          if (yPosition > pageHeight - margin - 20) {
            pdfDoc.addPage();
            yPosition = margin;
          }
          
          pdfDoc.setTextColor(0, 0, 0);
          pdfDoc.text(textLine, margin, yPosition);
          yPosition += 6;
        }
        
        yPosition += 2;
      }

      // Firma
      if (yPosition > pageHeight - margin - 30) {
        pdfDoc.addPage();
        yPosition = margin;
      }

      yPosition += 20;
      pdfDoc.setLineWidth(0.5);
      pdfDoc.line(margin, yPosition, margin + 80, yPosition);
      yPosition += 8;
      
      pdfDoc.setFontSize(10);
      pdfDoc.setTextColor(0, 0, 0);
      pdfDoc.text("Firma / Aclaración / DNI", margin, yPosition);

      const fileName = `${id}.pdf`;
      console.log("[documents-table] Saving PDF:", fileName);
      pdfDoc.save(fileName);
      console.log("[documents-table] PDF generated successfully");
    } catch (error) {
      console.error("[documents-table] Error generating PDF:", error);
      alert(`Error al generar el PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
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
                    {doc.lastVersion?.rawText && (
                      <>
                        <button
                          onClick={() => onPreview(doc.id)}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                          aria-label="Ver PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("[documents-table] BUTTON CLICKED");
                            handleDownload(doc.id, doc);
                          }}
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
