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

        // Generar PDF blob usando función reutilizable
        const { generatePdfBlobFromText } = await import("@/app/lib/pdfGenerator");
        const blobUrl = generatePdfBlobFromText(documentType, rawText);
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
