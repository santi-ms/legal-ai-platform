import "dotenv/config";
import * as Sentry from "@sentry/node";
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
import { registerHonorarioRoutes } from "./routes.honorarios.js";
import { registerImportRoutes } from "./routes.imports.js";
import { registerEstrategiaRoutes } from "./routes.estrategia.js";
import { registerReferenceRoutes } from "./routes.references.js";
import { registerBillingRoutes } from "./routes.billing.js";
import { registerTeamRoutes } from "./routes.team.js";
import { registerCalendarRoutes } from "./routes.calendar.js";
import { registerAnalysisRoutes } from "./routes.analysis.js";
import { registerAssistantRoutes } from "./routes.assistant.js";
import { registerSharingRoutes } from "./routes.sharing.js";
import { registerPromptRoutes } from "./routes.prompts.js";
import { registerJurisRoutes } from "./routes.juris.js";
import { registerVencimientosRoutes } from "./routes.vencimientos.js";
import { registerActuacionesRoutes } from "./routes.actuaciones.js";
import { registerSearchRoutes } from "./routes.search.js";
import { registerStatsRoutes } from "./routes.stats.js";
import { registerSuperAdminRoutes } from "./routes.superadmin.js";
import { registerPortalRoutes } from "./routes.portal.js";
import { registerClientPortalRoutes } from "./routes.client-portal.js";
import { registerTenantRoutes } from "./routes.tenant.js";
import { initializeDocumentRegistry } from "./modules/documents/domain/document-registry.js";
import { runDeadlineNotifier } from "./services/deadline-notifier.js";
import { runVencimientoNotifier } from "./services/vencimiento-notifier.js";
import { runPortalActivityNotifier } from "./services/portal-activity-notifier.js";
import { syncAllTenants } from "./services/portal-sync-service.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./db.js";
import { AppError } from "./utils/errors.js";

// Initialize Sentry (only in production)
if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions for performance
    beforeSend(event) {
      // Strip sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

// In-memory per-tenant AI rate limit state
const aiRequestCounts = new Map<string, { count: number; resetAt: number }>();

// Cleanup every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiRequestCounts.entries()) {
    if (now > entry.resetAt) aiRequestCounts.delete(key);
  }
}, 5 * 60 * 1000);

async function buildServer() {
  initializeDocumentRegistry();
  logger.info("[server] Document registry initialized");

  const app = Fastify({ logger: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(multipart as any, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

  await app.register(fastifyCors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    origin: (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000").split(","),
  });

  await app.register(helmet, {
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

  // API Documentation (only in non-production or with explicit flag)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
    await app.register(import('@fastify/swagger'), {
      openapi: {
        info: {
          title: 'Doculex API',
          description: 'API del sistema de gestión legal Doculex',
          version: '1.0.0',
        },
        servers: [
          { url: process.env.API_URL || 'http://localhost:4001', description: 'API Server' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    });

    await app.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });
  }

  // CSRF protection: reject cross-origin form submissions
  app.addHook('preHandler', async (request, reply) => {
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const xRequestedWith = request.headers['x-requested-with'];
      const contentType = request.headers['content-type'] || '';
      // Solo verificar si no es JSON (JSON APIs son seguras por sí solas)
      // y no es multipart (file uploads)
      if (!contentType.includes('application/json') &&
          !contentType.includes('multipart/form-data') &&
          !request.url.includes('/webhooks/')) {
        if (!xRequestedWith) {
          return reply.code(403).send({ error: 'CSRF check failed' });
        }
      }
    }
  });

  // Global error handler with Sentry capture
  app.setErrorHandler((error, request, reply) => {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: {
          url: request.url,
          method: request.method,
          tenantId: (request as any).user?.tenantId,
        }
      });
    }

    // Known application errors
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        ok: false,
        error: error.message,
        code: error.code,
      });
    }

    // Fastify validation errors (Zod/JSON schema)
    if ((error as any).validation) {
      return reply.code(400).send({
        ok: false,
        error: 'Datos inválidos',
        details: (error as any).validation,
      });
    }

    // Prisma errors
    if ((error as any).code === 'P2025') {
      return reply.code(404).send({ ok: false, error: 'Recurso no encontrado' });
    }
    if ((error as any).code === 'P2002') {
      return reply.code(409).send({ ok: false, error: 'Ya existe un registro con esos datos' });
    }

    // Unknown errors
    logger.error('Unhandled error', { error: error.message, stack: error.stack, url: request.url });
    return reply.code(500).send({
      ok: false,
      error: 'Error interno del servidor',
    });
  });

  // AI-specific rate limit: 30 requests per minute per USER (in-memory).
  // Antes era por tenant: en un estudio de N personas, una sola podía
  // copar la cuota y bloquear a los demás.
  app.addHook('preHandler', async (request, reply) => {
    const aiPaths = ['/documents/generate', '/chat', '/analysis', '/estrategia', '/juris'];
    const isAiPath = aiPaths.some(p => request.url.includes(p));
    if (!isAiPath) return;

    const user = (request as any).user;
    if (!user?.id) return; // unauthenticated — other middleware handles it

    const key = `ai:${user.id}`;
    const now = Date.now();
    const window = 60 * 1000; // 1 minute

    if (!aiRequestCounts.has(key)) {
      aiRequestCounts.set(key, { count: 1, resetAt: now + window });
      return;
    }

    const entry = aiRequestCounts.get(key)!;
    if (now > entry.resetAt) {
      entry.count = 1;
      entry.resetAt = now + window;
      return;
    }

    entry.count++;
    if (entry.count > 30) {
      return reply.code(429).send({
        ok: false,
        error: 'Demasiadas solicitudes al asistente IA. Esperá un momento.',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }
  });

  app.get("/healthz", async () => ({
    ok: true,
    uptime: process.uptime(),
    ts: Date.now(),
  }));

  // Health check endpoint - used by Railway for uptime monitoring
  app.get('/health', async (request, reply) => {
    // Check DB connection
    let dbStatus = 'ok';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch (err) {
      dbStatus = 'error';
    }

    const status = dbStatus === 'ok' ? 'ok' : 'degraded';
    const statusCode = status === 'ok' ? 200 : 503;

    return reply.code(statusCode).send({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: { status: dbStatus, latencyMs: dbLatency },
        ai: { status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing' },
        email: { status: process.env.RESEND_API_KEY ? 'configured' : 'fallback' },
      }
    });
  });

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
  await registerHonorarioRoutes(app);
  await registerImportRoutes(app);
  await registerEstrategiaRoutes(app);
  await registerReferenceRoutes(app);
  await registerBillingRoutes(app);
  await registerTeamRoutes(app);
  await registerCalendarRoutes(app);
  await registerAnalysisRoutes(app);
  await registerAssistantRoutes(app);
  await registerSharingRoutes(app);
  await registerPromptRoutes(app);
  await registerSuperAdminRoutes(app);
  await registerPortalRoutes(app);
  await registerClientPortalRoutes(app);
  await registerTenantRoutes(app);
  await registerJurisRoutes(app);
  await registerVencimientosRoutes(app);
  await registerActuacionesRoutes(app);
  await registerSearchRoutes(app);
  await registerStatsRoutes(app);

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
cron.schedule(
  "0 8 * * *",
  async () => {
    logger.info("[cron] Ejecutando notificador de vencimientos...");
    await runDeadlineNotifier();
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Notificador de vencimientos programado: todos los días a las 8:00 AM (AR)");

// Notificaciones del módulo Vencimientos — diariamente a las 8:15 AM (AR)
// (ligeramente después del de expedientes para no saturar el servidor)
cron.schedule(
  "15 8 * * *",
  async () => {
    logger.info("[cron] Ejecutando notificador de vencimientos (módulo Vencimientos)...");
    await runVencimientoNotifier();
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Notificador Vencimientos programado: todos los días a las 8:15 AM (AR)");

// Sincronización portal MEV Misiones — 3 veces por día en horario laboral (7, 13, 19 hs AR)
cron.schedule(
  "0 7,13,19 * * 1-5",
  async () => {
    logger.info("[cron] Ejecutando sync portal MEV Misiones...");
    await syncAllTenants("cron");
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Portal sync MEV programado: L-V a las 7:00, 13:00 y 19:00 hs (AR)");

// Notificaciones de actividad del portal — 30 min después de cada sync (7:30, 13:30, 19:30 AR)
cron.schedule(
  "30 7,13,19 * * 1-5",
  async () => {
    logger.info("[cron] Ejecutando notificador de actividad de portal...");
    await runPortalActivityNotifier();
  },
  { timezone: "America/Argentina/Buenos_Aires" }
);
logger.info("[cron] Notificador portal programado: L-V a las 7:30, 13:30 y 19:30 hs (AR)");
