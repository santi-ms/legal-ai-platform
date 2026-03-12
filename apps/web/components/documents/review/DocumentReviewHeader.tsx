"use client";

import Link from "next/link";
import { FileEdit, Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { generatePdfFromText } from "@/app/lib/pdfGenerator";
import { getDocument } from "@/app/lib/webApi";

interface DocumentReviewHeaderProps {
  documentId: string;
  documentTitle?: string;
  onFinalize?: () => void;
}

export function DocumentReviewHeader({
  documentId,
  documentTitle = "Documento",
  onFinalize,
}: DocumentReviewHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const handleDownload = async () => {
    try {
      const doc = await getDocument(documentId);
      const rawText = doc.document?.lastVersion?.rawText;
      const docType = doc.document?.type || "DOCUMENTO";

      if (!rawText) {
        alert("Error: No hay contenido para generar el PDF");
        return;
      }

      generatePdfFromText(docType, rawText, `${documentId}.pdf`);
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Error al descargar el documento");
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="size-8 text-primary flex items-center justify-center">
          <FileEdit className="w-6 h-6" />
        </div>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
          LegalTech AR Premium
        </h2>
      </div>

      <div className="flex flex-1 justify-end gap-6 items-center">
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/documents"
            className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Mis Documentos
          </Link>
          <Link
            href="#"
            className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Plantillas
          </Link>
          <Link
            href="#"
            className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors"
          >
            Equipo
          </Link>
        </nav>

        <div className="flex gap-2 items-center">
          <Button
            onClick={onFinalize || handleDownload}
            className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <span className="truncate">Finalizar y Descargar</span>
          </Button>
          <button
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
          <Link
            href="/profile"
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "Usuario"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

