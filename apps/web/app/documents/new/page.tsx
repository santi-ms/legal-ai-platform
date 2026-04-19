"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Punto de entrada para la creación de documentos.
 * Redirige directamente al flujo de Chat con IA (único modo habilitado).
 */
export default function NewDocumentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/documents/new/chat");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}
