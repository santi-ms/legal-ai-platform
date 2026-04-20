"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Punto de entrada para la creación de documentos.
 * Redirige directamente al flujo de Chat con IA (único modo habilitado).
 * Pasa query params (como expedienteId) al destino.
 */
function NewDocumentRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    router.replace(`/documents/new/chat${qs ? `?${qs}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <NewDocumentRedirect />
    </Suspense>
  );
}
