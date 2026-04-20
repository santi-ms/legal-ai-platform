/**
 * Portal Sync Service — orquesta el scraping de portales judiciales y actualiza la BD.
 *
 * Portales soportados:
 *   "justi_misiones"  → JUSTI (Angular/Ionic PWA, Misiones)
 *   "iurix_corrientes"→ IURIX Online (Corrientes)
 *   "mev_scba"        → MEV SCBA (Buenos Aires)
 *   "pjn"             → PJN federal / CABA
 *
 * API:
 *   syncTenant(tenantId, portal?, trigger)  — sync de un tenant, un portal específico o todos
 *   syncAllTenants(trigger)                 — sync de todos los tenants/portales activos (cron)
 */

import { prisma } from "../db.js";
import { decrypt } from "../utils/encryption.js";
import { logger } from "../utils/logger.js";
import { randomUUID } from "node:crypto";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PortalId = "justi_misiones" | "iurix_corrientes" | "mev_scba" | "pjn";

export interface PortalSyncResult {
  logId:              string;
  tenantId:           string;
  portal:             string;
  status:             "success" | "error";
  expedientesChecked: number;
  expedientesUpdated: number;
  errorMessage?:      string;
  durationMs:         number;
}

// ─── Router de scrapers ───────────────────────────────────────────────────────

type ScrapeFunction = (
  username: string,
  password: string
) => Promise<{ data: Map<string, any>; error?: string }>;

type TestFunction = (
  username: string,
  password: string
) => Promise<{ valid: boolean; error?: string }>;

interface PortalDriver {
  scrape: ScrapeFunction;
  test:   TestFunction;
  label:  string;
}

async function getPortalDriver(portal: string): Promise<PortalDriver> {
  switch (portal) {
    case "justi_misiones":
    case "mev_misiones": {  // alias legacy
      const m = await import("./mev-scraper.js");
      return { scrape: m.runScrape, test: m.testCredentials, label: "JUSTI Misiones" };
    }
    case "iurix_corrientes": {
      const m = await import("./corrientes-scraper.js");
      return { scrape: m.runScrape, test: m.testCredentials, label: "IURIX Corrientes" };
    }
    case "mev_scba": {
      const m = await import("./scba-scraper.js");
      return { scrape: m.runScrape, test: m.testCredentials, label: "MEV SCBA" };
    }
    case "pjn": {
      const m = await import("./pjn-scraper.js");
      return { scrape: m.runScrape, test: m.testCredentials, label: "PJN" };
    }
    default:
      throw new Error(`Portal desconocido: "${portal}". Portales válidos: justi_misiones, iurix_corrientes, mev_scba, pjn`);
  }
}

// ─── Función auxiliar de normalización ───────────────────────────────────────

function normalizeNumber(num: string): string {
  return num.trim().replace(/\s+/g, "").replace(/^0+/, "").toLowerCase();
}

// ─── Sync de un tenant + portal ──────────────────────────────────────────────

/**
 * Sincroniza un tenant con UN portal específico.
 */
export async function syncTenantPortal(
  tenantId: string,
  portal:   string,
  trigger:  "cron" | "manual" = "cron"
): Promise<PortalSyncResult> {
  const start = Date.now();
  const logId = randomUUID();

  await prisma.portalSyncLog.create({
    data: { id: logId, tenantId, portal, status: "running", trigger, startedAt: new Date() },
  });

  try {
    // Obtener credencial
    const cred = await prisma.portalCredential.findUnique({
      where: { tenantId_portal: { tenantId, portal } },
    });
    if (!cred || !cred.isActive) {
      throw new Error(`Sin credenciales activas para portal "${portal}".`);
    }

    await prisma.portalSyncLog.update({ where: { id: logId }, data: { credentialId: cred.id } });

    // Expedientes habilitados
    const expedientes = await prisma.expediente.findMany({
      where:  { tenantId, portalSyncEnabled: true },
      select: { id: true, number: true, court: true, portalLastMovimiento: true },
    });

    if (expedientes.length === 0) {
      await finishLog(logId, "success", 0, 0);
      return { logId, tenantId, portal, status: "success", expedientesChecked: 0, expedientesUpdated: 0, durationMs: Date.now() - start };
    }

    // Descifrar contraseña
    let password: string | null = null;
    try {
      password = decrypt(cred.passwordEnc);
    } catch {
      throw new Error("No se pudo descifrar las credenciales. Reconfigurar en Ajustes del Portal.");
    }

    // Obtener driver del portal y scrapear
    const driver = await getPortalDriver(portal);
    logger.info(`[portal-sync] Iniciando scraping ${driver.label}`, { tenantId, portal, expedientes: expedientes.length });

    let portalMap: Map<string, any> = new Map();
    let scrapeError: string | undefined;
    try {
      const result = await driver.scrape(cred.username, password);
      portalMap = result.data;
      scrapeError = result.error;
    } finally {
      // Limpiar credencial de memoria
      password = null;
    }

    if (scrapeError && portalMap.size === 0) {
      await prisma.portalCredential.update({
        where: { id: cred.id },
        data:  { lastError: scrapeError },
      });
      throw new Error(scrapeError);
    }

    // Credencial válida
    await prisma.portalCredential.update({
      where: { id: cred.id },
      data:  { lastValidAt: new Date(), lastError: null },
    });

    // Cruzar datos portal ↔ BD local
    let updated = 0;
    const now   = new Date();

    for (const exp of expedientes) {
      if (!exp.number) continue;
      const normalizedLocal = normalizeNumber(exp.number);

      let portalData = portalMap.get(normalizedLocal);
      if (!portalData) {
        // Búsqueda parcial (sub-número)
        for (const [k, v] of portalMap.entries()) {
          if (k.includes(normalizedLocal) || normalizedLocal.includes(k)) {
            portalData = v;
            break;
          }
        }
      }

      if (!portalData) continue;

      const prevMovimiento = exp.portalLastMovimiento;
      const newMovimiento  = portalData.ultimoMovimiento?.descripcion ?? null;
      const hasNewActivity = Boolean(newMovimiento && prevMovimiento && newMovimiento !== prevMovimiento);

      const dataToUpdate: any = {
        portalId:             portalData.portalId,
        portalStatus:         portalData.estado || null,
        portalLastSync:       now,
        portalLastMovimiento: newMovimiento,
        portalMovimientoAt:   portalData.ultimoMovimiento?.fecha ?? null,
      };
      if (hasNewActivity)          dataToUpdate.portalNewActivity = true;
      if (!exp.court && portalData.juzgado) dataToUpdate.court = portalData.juzgado;

      await prisma.expediente.update({ where: { id: exp.id }, data: dataToUpdate });
      updated++;
    }

    logger.info(`[portal-sync] ${driver.label} sync OK`, { tenantId, checked: expedientes.length, updated });
    await finishLog(logId, "success", expedientes.length, updated);
    return {
      logId, tenantId, portal, status: "success",
      expedientesChecked: expedientes.length,
      expedientesUpdated: updated,
      durationMs: Date.now() - start,
    };

  } catch (err: any) {
    const msg = err?.message ?? "Error desconocido";
    logger.error(`[portal-sync] Error en sync portal ${portal}`, { tenantId, error: msg });
    await finishLog(logId, "error", 0, 0, msg);
    return {
      logId, tenantId, portal, status: "error",
      expedientesChecked: 0, expedientesUpdated: 0,
      errorMessage: msg, durationMs: Date.now() - start,
    };
  }
}

/**
 * Sincroniza un tenant en todos sus portales activos.
 * Llamado desde routes.portal.ts en sync manual.
 */
export async function syncTenant(
  tenantId: string,
  trigger:  "cron" | "manual" = "cron"
): Promise<PortalSyncResult[]> {
  // Obtener todos los portales activos del tenant
  const creds = await prisma.portalCredential.findMany({
    where:  { tenantId, isActive: true },
    select: { portal: true },
  });

  if (creds.length === 0) {
    logger.info("[portal-sync] Sin credenciales activas", { tenantId });
    return [];
  }

  const results: PortalSyncResult[] = [];
  for (const { portal } of creds) {
    const r = await syncTenantPortal(tenantId, portal, trigger);
    results.push(r);
  }
  return results;
}

/**
 * Sincroniza TODOS los tenants con credenciales activas.
 * Llamado por el cron job 3x/día.
 */
export async function syncAllTenants(trigger: "cron" | "manual" = "cron"): Promise<void> {
  const creds = await prisma.portalCredential.findMany({
    where:  { isActive: true },
    select: { tenantId: true, portal: true },
    distinct: ["tenantId", "portal"],
  });

  if (creds.length === 0) {
    logger.info("[portal-sync] Sin credenciales activas para sync masivo");
    return;
  }

  logger.info("[portal-sync] Iniciando sync masivo", { credenciales: creds.length });

  for (const { tenantId, portal } of creds) {
    try {
      await syncTenantPortal(tenantId, portal, trigger);
    } catch (err: any) {
      logger.error("[portal-sync] Error sync tenant/portal", { tenantId, portal, error: err?.message });
    }
    // Pausa entre requests para no sobrecargar portales
    await new Promise(r => setTimeout(r, 5_000));
  }

  logger.info("[portal-sync] Sync masivo finalizado");
}

// ─── Test de credenciales (sin sync) ─────────────────────────────────────────

/**
 * Verifica credenciales sin guardar ni actualizar nada.
 * Usada por routes.portal.ts en POST /portal/config/test
 */
export async function testPortalCredentials(
  portal:   string,
  username: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const driver = await getPortalDriver(portal);
    return driver.test(username, password);
  } catch (err: any) {
    return { valid: false, error: err?.message };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function finishLog(
  id:           string,
  status:       "success" | "error",
  checked:      number,
  updated:      number,
  errorMessage?: string
) {
  await prisma.portalSyncLog.update({
    where: { id },
    data: {
      status,
      finishedAt:         new Date(),
      expedientesChecked: checked,
      expedientesUpdated: updated,
      ...(errorMessage ? { errorMessage } : {}),
    },
  });
}
