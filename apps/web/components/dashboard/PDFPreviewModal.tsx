"use client";

import { Dialog, DialogHeader, DialogContent } from "@/components/ui/dialog";
import { getPdfUrl } from "@/app/lib/webApi";

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
  const pdfUrl = getPdfUrl(documentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        Vista previa del documento
      </DialogHeader>
      <DialogContent className="p-0">
        <div className="w-full h-[calc(90vh-120px)]">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Vista previa del PDF"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
