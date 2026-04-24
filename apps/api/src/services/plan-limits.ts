/**
 * Enforcement de límites mensuales por plan.
 *
 * Centraliza el chequeo de "¿este tenant ya consumió su cuota este mes?"
 * para los distintos recursos (documentos, análisis, estrategias, juris).
 *
 * Los límites viven en `Plan.limits` (JSON) y se siembran en
 * `scripts/seed-plans.ts`. Valor `-1` = ilimitado.
 */

import { getPlanForTenant } from "../routes.billing.js";

export type PlanLimitKey =
  | "docsPerMonth"
  | "analysesPerMonth"
  | "strategiesPerMonth"
  | "jurisMessagesPerMonth";

export type LimitCountQuery = (startOfMonth: Date, endOfMonth: Date) => Promise<number>;

export interface PlanLimitResult {
  /** true = seguir; false = cortar con PLAN_LIMIT_EXCEEDED */
  ok: boolean;
  limit: number;
  used: number;
  /** Nombre legible para el mensaje de error (ej. "consultas a Doku Juris") */
  resource: string;
}

function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Chequea si el tenant puede seguir usando el recurso este mes.
 * - Lee el límite del plan activo (default: valor de fallback si el plan no lo define).
 * - Si es -1 (ilimitado), devuelve ok=true sin contar.
 * - Si no, corre la query de conteo provista y compara.
 */
export async function checkMonthlyLimit(params: {
  tenantId: string;
  limitKey: PlanLimitKey;
  countQuery: LimitCountQuery;
  /** Valor usado si el plan no define el límite (plan viejo, seed incompleto, etc.) */
  fallbackLimit: number;
  /** Texto legible para el mensaje al usuario */
  resourceLabel: string;
}): Promise<PlanLimitResult> {
  const { plan } = await getPlanForTenant(params.tenantId);
  const limits = (plan as { limits?: Record<string, unknown> } | null)?.limits ?? {};
  const raw = limits[params.limitKey];
  const limit: number = typeof raw === "number" ? raw : params.fallbackLimit;

  if (limit === -1) {
    return { ok: true, limit: -1, used: 0, resource: params.resourceLabel };
  }

  const { start, end } = currentMonthRange();
  const used = await params.countQuery(start, end);

  return {
    ok: used < limit,
    limit,
    used,
    resource: params.resourceLabel,
  };
}

/**
 * Helper para construir la respuesta HTTP 429 estándar cuando se excede el límite.
 */
export function planLimitExceededResponse(result: PlanLimitResult) {
  return {
    ok: false as const,
    error: "PLAN_LIMIT_EXCEEDED" as const,
    message: `Alcanzaste el límite de ${result.limit} ${result.resource} este mes. Actualizá tu plan para continuar.`,
    limit: result.limit,
    used: result.used,
  };
}
