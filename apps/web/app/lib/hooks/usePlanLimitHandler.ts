"use client";

/**
 * Hook para manejar errores de API de forma uniforme, con atención especial
 * a los 429 PLAN_LIMIT_EXCEEDED — estos se muestran con un CTA "Ver planes"
 * que lleva a /settings/billing.
 *
 * Uso típico:
 *   const handleError = usePlanLimitHandler();
 *   try { await uploadEscrito(file, opts); }
 *   catch (err) { handleError(err); }
 *
 * Si el error es otro tipo, cae al toast de error normal con `err.message`.
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { isPlanLimitError } from "@/app/lib/webApi";

export function usePlanLimitHandler() {
  const router = useRouter();
  const { error: showError } = useToast();

  return useCallback(
    (err: unknown, fallbackMessage = "Ocurrió un error") => {
      if (isPlanLimitError(err)) {
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
