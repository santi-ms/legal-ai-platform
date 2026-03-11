"use client";

import { Dialog, DialogHeader, DialogContent } from "@/components/ui/dialog";
import { getDocument } from "@/app/lib/webApi";
import { useEffect, useState } from "react";

interface PDFPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
}

export function PDFPreviewModal({
  open,
  onOpenChange,
  documentId,
}: PDFPreviewModalProps) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId) {
      setPdfBlobUrl(null);
      setLoading(false);
      return;
    }

    async function generatePreview() {
      try {
        setLoading(true);
        setError(null);

        // Obtener el documento con rawText
        const documentData = await getDocument(documentId);
        const rawText = documentData.document?.lastVersion?.rawText;
        const documentType = documentData.document?.type || "DOCUMENTO";

        if (!rawText) {
          setError("No hay contenido para generar el PDF");
          setLoading(false);
          return;
        }

        // Generar PDF con jsPDF
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

        // Generar blob URL para el iframe
        const pdfBlob = pdfDoc.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(blobUrl);
        setLoading(false);
      } catch (err: any) {
        console.error("[PDFPreviewModal] Error generating PDF:", err);
        setError(err.message || "Error al generar la vista previa");
        setLoading(false);
      }
    }

    generatePreview();

    // Cleanup: revocar el blob URL cuando el componente se desmonte o se cierre
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        Vista previa del documento
      </DialogHeader>
      <DialogContent className="p-0">
        <div className="w-full h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-neutral-400">Cargando vista previa...</div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-400">{error}</div>
            </div>
          )}
          {pdfBlobUrl && !loading && !error && (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full border-0"
              title="Vista previa del PDF"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
