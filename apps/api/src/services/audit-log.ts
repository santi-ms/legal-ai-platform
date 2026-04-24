/**
 * Audit log — registro append-only de acciones sensibles.
 *
 * Pensado para compliance básico: "¿quién hizo qué con los datos del tenant?".
 * Escrituras son fire-and-forget: si falla el log, NO rompemos la operación
 * principal (sería peor perder el delete que no loggearlo).
 *
 * Convenciones para `action`:
 *   <resource>.<verb>  →  "client.archive", "document.delete", "billing.checkout"
 *
 * Usos típicos:
 *   await auditLog({
 *     tenantId: user.tenantId,
 *     userId: user.userId,
 *     action: "client.archive",
 *     resourceType: "Client",
 *     resourceId: id,
 *     request,
 *   });
 */

import type { FastifyRequest } from "fastify";
import { prisma } from "../db.js";
import { logger } from "../utils/logger.js";

export interface AuditLogInput {
  tenantId: string;
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Si se pasa, se extraen ipAddress y userAgent automáticamente */
  request?: FastifyRequest;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function auditLog(input: AuditLogInput): Promise<void> {
  try {
    const ipAddress =
      input.ipAddress ??
      input.request?.ip ??
      (input.request?.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      null;
    const userAgent =
      input.userAgent ??
      (input.request?.headers["user-agent"] as string | undefined) ??
      null;

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        action: input.action,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        metadata: (input.metadata ?? null) as any,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    // Nunca romper el flujo principal por un fallo del audit log.
    // Pero sí loggear el error para saber que el registro se perdió.
    logger.error("[audit] Falló el registro de auditoría", {
      err,
      action: input.action,
      tenantId: input.tenantId,
    });
  }
}
