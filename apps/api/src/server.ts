import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import cron from "node-cron";
import { registerDocumentRoutes } from "./routes.documents.js";
import { registerAuthRoutes } from "./routes.auth.js";
import { registerChatRoutes } from "./routes.chat.js";
import { registerClientRoutes } from "./routes.clients.js";
import { registerExpedienteRoutes } from "./routes.expedientes.js";
import { registerReferenceRoutes } from "./routes.references.js";
import { registerBillingRoutes } from "./routes.billing.js";
import { registerTeamRoutes } from "./routes.team.js";
import { registerCalendarRoutes } from "./routes.calendar.js";
import { registerAnalysisRoutes } from "./routes.analysis.js";
import { registerAssistantRoutes } from "./routes.assistant.js";
import { registerSharingRoutes } from "./routes.sharing.js";
import { registerPromptRoutes } from "./routes.prompts.js";
import { registerSuperAdminRoutes } from "./routes.superadmin.js";
import { initializeDocumentRegistry } from "./modules/documents/domain/document-registry.js";
import { runDeadlineNotifier } from "./services/deadline-notifier.js";
import { logger } from "./utils/logger.js";

async function buildServer() {
  initializeDocumentRegistry();
  logger.info("[server] Document registry initialized");

  const app = Fastify({ logger: true });

  const isDev = process.env.NODE_ENV !== "production";

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
  ].filter((v): v is string => Boolean(v));

  const allowedSet = new Set<string>(allowedOrigins);

  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true;
    if (allowedSet.has(origin)) return true;
    if (origin.includes(".vercel.app")) return true;
    return false;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(multipart as any, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

  await app.register(fastifyCors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: isDev
      ? true
      : (origin, cb) => {
          if (isOriginAllowed(origin)) {
            cb(null, true);
          } else {
            logger.warn("[CORS] Rejected origin", { origin });
            cb(new Error("CORS not allowed"), false);
          }
        },
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: 60000,
    errorResponseBuilder: () => ({
      ok: false,
      error: "too_many_requests",
      message: "Demasiadas solicitudes. Por favor, intentá de nuevo en unos momentos.",
    }),
  });

  app.get("/healthz", async () => ({
    ok: true,
    uptime: process.uptime(),
    ts: Date.now(),
  }));

  app.get("/", async () => ({ ok: true, message: "API up" }));

  app.get("/_routes", (request, reply) => {
    const routes = app.printRoutes();
    return reply.type("text/plain").send(routes);
  });

  await registerDocumentRoutes(app);
  await registerAuthRoutes(app);
  await registerChatRoutes(app);
  await registerClientRoutes(app);
  await registerExpedienteRoutes(app);
  await registerReferenceRoutes(app);
  await registerBillingRoutes(app);
  await registerTeamRoutes(app);
  await registerCalendarRoutes(app);
  await registerAnalysisRoutes(app);
  await registerAssistantRoutes(app);
  await registerSharingRoutes(app);
  await registerPromptRoutes(app);
  await registerSuperAdminRoutes(app);

  const { registerUserRoutes } = await import("./routes.user.js");
  await registerUserRoutes(app);

  return app;
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
// Notificaciones de vencimientos de expedientes — todos los días a las 8:00 AM (hora AR)
// Timezone: America/Argentina/Buenos_Aires (UTC-3)
cron.schedule(
  "0 8 * * *",
  async () => {
    logger.info("[cron] Ejecutando notificador de vencimientos...");
    await runDeadlineNotifier();
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Notificador de vencimientos programado: todos los días a las 8:00 AM (AR)");
