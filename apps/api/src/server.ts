import "dotenv/config";
import cron from "node-cron";
import { buildServer } from "./app.js";
import { runDeadlineNotifier } from "./services/deadline-notifier.js";
import { runVencimientoNotifier } from "./services/vencimiento-notifier.js";
import { runPortalActivityNotifier } from "./services/portal-activity-notifier.js";
import { syncAllTenants } from "./services/portal-sync-service.js";
import { logger } from "./utils/logger.js";

// Initialize Sentry (only in production, lazy-import to avoid mandatory dep).
if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
        return event;
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[sentry] DSN set but @sentry/node not installed — skipping init");
  }
}

const app = await buildServer();
await app.ready();
app.log.info({ event: "routes", routes: app.printRoutes() });

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`[api] listening on ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// ─── Cron jobs ────────────────────────────────────────────────────────────────

cron.schedule(
  "0 8 * * *",
  async () => {
    logger.info("[cron] Ejecutando notificador de vencimientos...");
    await runDeadlineNotifier();
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Notificador de vencimientos programado: todos los días a las 8:00 AM (AR)");

cron.schedule(
  "15 8 * * *",
  async () => {
    logger.info("[cron] Ejecutando notificador de vencimientos (módulo Vencimientos)...");
    await runVencimientoNotifier();
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Notificador Vencimientos programado: todos los días a las 8:15 AM (AR)");

cron.schedule(
  "0 7,13,19 * * 1-5",
  async () => {
    logger.info("[cron] Ejecutando sync portal MEV Misiones...");
    await syncAllTenants("cron");
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Portal sync MEV programado: L-V a las 7:00, 13:00 y 19:00 hs (AR)");

cron.schedule(
  "30 7,13,19 * * 1-5",
  async () => {
    logger.info("[cron] Ejecutando notificador de actividad de portal...");
    await runPortalActivityNotifier();
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Notificador portal programado: L-V a las 7:30, 13:30 y 19:30 hs (AR)");
