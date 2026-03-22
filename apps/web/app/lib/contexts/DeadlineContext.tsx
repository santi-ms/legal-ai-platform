"use client";

/**
 * DeadlineContext — Provee el conteo de vencimientos urgentes a toda la app.
 *
 * - urgentCount: expedientes vencidos + vencen en ≤ 3 días
 * - overdueCount: expedientes cuyo deadline ya pasó
 * - Se refresca automáticamente cada 5 minutos
 * - Usado por DashboardSidebar (badge) y dashboard page (banner)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listExpedientes } from "@/app/lib/webApi";

interface DeadlineContextValue {
  /** Expedientes vencidos + que vencen en ≤ 3 días */
  urgentCount: number;
  /** Expedientes cuyo deadline ya pasó */
  overdueCount: number;
  isLoading: boolean;
  /** Fuerza un re-fetch inmediato */
  refresh: () => void;
}

const DeadlineContext = createContext<DeadlineContextValue>({
  urgentCount: 0,
  overdueCount: 0,
  isLoading: false,
  refresh: () => {},
});

export function DeadlineProvider({ children }: { children: ReactNode }) {
  const [urgentCount, setUrgentCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    async function fetchCounts() {
      setIsLoading(true);
      try {
        const now = new Date();
        const in3days = new Date(now.getTime() + 3 * 86_400_000).toISOString();
        const nowIso  = now.toISOString();

        // Two lightweight queries (pageSize: 1 — only total matters)
        const [overdueRes, criticalRes] = await Promise.all([
          listExpedientes({
            hasDeadline:    "true",
            status:         "activo",
            deadlineBefore: nowIso,
            pageSize:       1,
          }),
          listExpedientes({
            hasDeadline:    "true",
            status:         "activo",
            deadlineAfter:  nowIso,
            deadlineBefore: in3days,
            pageSize:       1,
          }),
        ]);

        if (cancelledRef.current) return;

        setOverdueCount(overdueRes.total);
        setUrgentCount(overdueRes.total + criticalRes.total);
      } catch {
        // Badge is informational — fail silently
      } finally {
        if (!cancelledRef.current) setIsLoading(false);
      }
    }

    fetchCounts();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return (
    <DeadlineContext.Provider value={{ urgentCount, overdueCount, isLoading, refresh }}>
      {children}
    </DeadlineContext.Provider>
  );
}

export function useDeadlines() {
  return useContext(DeadlineContext);
}
