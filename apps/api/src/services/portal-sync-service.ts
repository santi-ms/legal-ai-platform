/**
 * Portal Sync Service — orchestrates MEV scraping and DB updates.
 *
 * runPortalSync(tenantId?, trigger)
 *   - If tenantId given: sync only that tenant
 *   - Otherwise: sync ALL tenants with active credentials
 */

import { prisma } from "../db.js";
import { decrypt } from "../utils/encryption.js";
import { runScrape, normalizeNumber } from "./mev-scraper.js";
import { logger } from "../utils/logger.js";
import { randomUUID } from "node:crypto";

export interface PortalSyncResult {
  logId:              string;
  tenantId:           string;
  status:             "success" | "error";
  expedientesChecked: number;
  expedientesUpdated: number;
  errorMessage?:      string;
  durationMs:         number;
}

/**
 * Sincroniza un tenant específico con el portal MEV.
 */
export async function syncTenant(
  tenantId: string,
  trigger: "cron" | "manual" = "cron"
): Promise<PortalSyncResult> {
  const start = Date.now();
  const logId = randomUUID();

  // Crear log como "running"
  await prisma.portalSyncLog.create({
    data: {
      id:           logId,
      tenantId,
      portal:       "mev_misiones",
      status:       "running",
      trigger,
      startedAt:    new Date(),
    },
  });

  try {
    // Obtener credencial activa
    const cred = await prisma.portalCredential.findUnique({
      where: { tenantId_portal: { tenantId, portal: "mev_misiones" } },
    });
    if (!cred || !cred.isActive) {
      throw new Error("No hay credenciales activas para este tenant.");
    }

    // Actualizar log con credentialId
    await prisma.portalSyncLog.update({
      where: { id: logId },
      data:  { credentialId: cred.id },
    });

    // Obtener expedientes habilitados para sync
    const expedientes = await prisma.expediente.findMany({
      where:  { tenantId, portalSyncEnabled: true },
      select: { id: true, number: true, court: true, portalLastMovimiento: true },
    });

    if (expedientes.length === 0) {
      logger.info("[portal-sync] Sin expedientes habilitados para sync", { tenantId });
      await finishLog(logId, "success", 0, 0);
      return { logId, tenantId, status: "success", expedientesChecked: 0, expedientesUpdated: 0, durationMs: Date.now() - start };
    }

    // Descifrar contraseña
    let password: string;
    try {
      password = decrypt(cred.passwordEnc);
    } catch {
      throw new Error("No se pudo descifrar las credenciales del portal. Reconfigurar en Ajustes.");
    }

    // Scrapear portal
    logger.info("[portal-sync] Iniciando scraping MEV", { tenantId, expedientes: expedientes.length });
    const { data: portalMap, error: scrapeError } = await runScrape(cred.username, password);

    if (scrapeError && portalMap.size === 0) {
      // Error total (login fallo, etc.)
      await prisma.portalCredential.update({
        where: { id: cred.id },
        data:  { lastError: scrapeError },
      });
      throw new Error(scrapeError);
    }

    // Marcar credencial como válida
    await prisma.portalCredential.update({
      where: { id: cred.id },
      data:  { lastValidAt: new Date(), lastError: null },
    });

    // Cruzar datos del portal con expedientes locales
    let updated = 0;
    const now = new Date();

    for (const exp of expedientes) {
      if (!exp.number) continue;
      const normalizedLocal = normalizeNumber(exp.number);

      // Buscar coincidencia en el portal (por número normalizado)
      let portalData = portalMap.get(normalizedLocal);

      // Fallback: buscar parcialmente (el número local puede ser un sub-número)
      if (!portalData) {
        for (const [k, v] of portalMap.entries()) {
          if (k.includes(normalizedLocal) || normalizedLocal.includes(k)) {
            portalData = v;
            break;
          }
        }
      }

      if (!portalData) continue; // No encontrado en portal para este expediente

      // Detectar actividad nueva
      const prevMovimiento = exp.portalLastMovimiento;
      const newMovimiento  = portalData.ultimoMovimiento?.descripcion ?? null;
      const hasNewActivity = Boolean(
        newMovimiento &&
        prevMovimiento &&
        newMovimiento !== prevMovimiento
      );

      const dataToUpdate: any = {
        portalId:             portalData.portalId,
        portalStatus:         portalData.estado || null,
        portalLastSync:       now,
        portalLastMovimiento: newMovimiento,
        portalMovimientoAt:   portalData.ultimoMovimiento?.fecha ?? null,
      };

      if (hasNewActivity) dataToUpdate.portalNewActivity = true;
      if (!exp.court && portalData.juzgado) dataToUpdate.court = portalData.juzgado;

      await prisma.expediente.update({
        where: { id: exp.id },
        data:  dataToUpdate,
      });

      updated++;
    }

    logger.info("[portal-sync] Sync completado", { tenantId, checked: expedientes.length, updated });
    await finishLog(logId, "success", expedientes.length, updated);
    return {
      logId, tenantId, status: "success",
      expedientesChecked: expedientes.length,
      expedientesUpdated: updated,
      durationMs: Date.now() - start,
    };

  } catch (err: any) {
    const msg = err?.message ?? "Error desconocido";
    logger.error("[portal-sync] Error en sync", { tenantId, error: msg });
    await finishLog(logId, "error", 0, 0, msg);
    return {
      logId, tenantId, status: "error",
      expedientesChecked: 0, expedientesUpdated: 0,
      errorMessage: msg, durationMs: Date.now() - start,
    };
  }
}

/**
 * Sincroniza TODOS los tenants con credenciales activas.
 * Llamado por el cron job.
 */
export async function syncAllTenants(trigger: "cron" | "manual" = "cron"): Promise<void> {
  const creds = await prisma.portalCredential.findMany({
    where: { isActive: true, portal: "mev_misiones" },
    select: { tenantId: true },
  });

  if (creds.length === 0) {
    logger.info("[portal-sync] Sin credenciales activas para sync masivo");
    return;
  }

  logger.info("[portal-sync] Iniciando sync masivo", { tenants: creds.length });

  for (const { tenantId } of creds) {
    try {
      await syncTenant(tenantId, trigger);
    } catch (err: any) {
      logger.error("[portal-sync] Error en sync de tenant", { tenantId, error: err?.message });
      // Continuar con el siguiente tenant
    }
    // Pausa entre tenants para no sobrecargar el portal
    await new Promise((r) => setTimeout(r, 5_000));
  }

  logger.info("[portal-sync] Sync masivo finalizado");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function finishLog(
  id: string,
  status: "success" | "error",
  checked: number,
  updated: number,
  errorMessage?: string
) {
  await prisma.portalSyncLog.update({
    where: { id },
    data: {
      status,
      finishedAt:          new Date(),
      expedientesChecked:  checked,
      expedientesUpdated:  updated,
      ...(errorMessage ? { errorMessage } : {}),
    },
  });
}
