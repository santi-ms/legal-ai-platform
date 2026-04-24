"use client";

/**
 * Hook para manejar errores de API de forma uniforme. Detecta los 2 casos
 * donde la respuesta correcta es "mostrale al usuario los planes":
 *   - 429 PLAN_LIMIT_EXCEEDED  — superó la cuota mensual/total del plan
 *   - 403 PLAN_FEATURE_UNAVAILABLE — la feature no está incluida en el plan
 *
 * En ambos: toast persistente con CTA "Ver planes" que lleva a
 * /settings/billing. Cualquier otro error cae a un toast de error normal.
 *
 * Uso:
 *   const handleError = usePlanLimitHandler();
 *   try { await uploadEscrito(file, opts); }
 *   catch (err) { handleError(err); }
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { isPlanUpsellError } from "@/app/lib/webApi";

export function usePlanLimitHandler() {
  const router = useRouter();
  const { error: showError } = useToast();

  return useCallback(
    (err: unknown, fallbackMessage = "Ocurrió un error") => {
      if (isPlanUpsellError(err)) {
        // Toast persistente (duration 0 = no auto-dismiss) con CTA a billing
        showError(err.message, 0, {
          label: "Ver planes",
          onClick: () => router.push("/settings/billing"),
        });
        return;
      }
      const message = err instanceof Error ? err.message : fallbackMessage;
      showError(message);
    },
    [router, showError],
  );
}
