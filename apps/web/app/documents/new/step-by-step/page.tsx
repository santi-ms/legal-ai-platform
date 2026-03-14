"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Ruta de compatibilidad.
 * El flujo de creación por pasos fue reemplazado por el flujo guiado.
 * Esta página redirige automáticamente a /documents/new/guided.
 */
export default function StepByStepRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/documents/new/guided");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}
