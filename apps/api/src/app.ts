/**
 * Construye la app Fastify sin arrancar listen() ni cron jobs.
 *
 * Se usa tanto desde `server.ts` (entry de producción) como desde los
 * integration tests, que hacen `app.inject(...)` o levantan la app contra
 * una DB de test.
 */

import Fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";

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
import { initializeDocumentRegistry } from "./modules/documents/domain/document-registry.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./db.js";
import { AppError } from "./utils/errors.js";

// In-memory per-tenant AI rate limit state (compartido a través del build)
const aiRequestCounts = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of aiRequestCounts.entries()) {
    if (now > entry.resetAt) aiRequestCounts.delete(key);
  }
}, 5 * 60 * 1000);

export interface BuildServerOptions {
  logger?: boolean;
}

export async function buildServer(opts: BuildServerOptions = {}): Promise<FastifyInstance> {
  initializeDocumentRegistry();
  logger.info("[server] Document registry initialized");

  const app = Fastify({ logger: opts.logger ?? true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(multipart as any, { limits: { fileSize: 10 * 1024 * 1024 } });

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

  const swaggerEnabled =
    (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") ||
    process.env.ENABLE_SWAGGER === "true";
  if (swaggerEnabled) {
    try {
      const swagger = await import("@fastify/swagger");
      const swaggerUi = await import("@fastify/swagger-ui");
      await app.register(swagger as any, {
        openapi: {
          info: {
            title: "Doculex API",
            description: "API del sistema de gestión legal Doculex",
            version: "1.0.0",
          },
          servers: [{ url: process.env.API_URL || "http://localhost:4001", description: "API Server" }],
          components: {
            securitySchemes: {
              bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            },
          },
          security: [{ bearerAuth: [] }],
        },
      });
      await app.register(swaggerUi as any, {
        routePrefix: "/docs",
        uiConfig: { docExpansion: "list", deepLinking: false },
      });
    } catch (err) {
      logger.warn("[swagger] no instalado, skipping");
    }
  }

  app.addHook("preHandler", async (request, reply) => {
    const method = request.method.toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const xRequestedWith = request.headers["x-requested-with"];
      const contentType = request.headers["content-type"] || "";
      if (
        !contentType.includes("application/json") &&
        !contentType.includes("multipart/form-data") &&
        !request.url.includes("/webhooks/")
      ) {
        if (!xRequestedWith) {
          return reply.code(403).send({ error: "CSRF check failed" });
        }
      }
    }
  });

  app.setErrorHandler(async (error, request, reply) => {
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = await import("@sentry/node");
        Sentry.captureException(error, {
          extra: {
            url: request.url,
            method: request.method,
            tenantId: (request as any).user?.tenantId,
          },
        });
      } catch {
        // Sentry no instalado / import falló — ignorar.
      }
    }

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        ok: false,
        error: error.message,
        code: error.code,
      });
    }

    if ((error as any).validation) {
      return reply.code(400).send({
        ok: false,
        error: "Datos inválidos",
        details: (error as any).validation,
      });
    }

    if ((error as any).code === "P2025") {
      return reply.code(404).send({ ok: false, error: "Recurso no encontrado" });
    }
    if ((error as any).code === "P2002") {
      return reply.code(409).send({ ok: false, error: "Ya existe un registro con esos datos" });
    }

    logger.error("Unhandled error", { error: error.message, stack: error.stack, url: request.url });
    return reply.code(500).send({ ok: false, error: "Error interno del servidor" });
  });

  app.addHook("preHandler", async (request, reply) => {
    const aiPaths = ["/documents/generate", "/chat", "/analysis", "/estrategia"];
    const isAiPath = aiPaths.some((p) => request.url.includes(p));
    if (!isAiPath) return;

    const user = (request as any).user;
    if (!user?.tenantId) return;

    const key = `ai:${user.tenantId}`;
    const now = Date.now();
    const window = 60 * 1000;

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
        error: "Demasiadas solicitudes al asistente IA. Esperá un momento.",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }
  });

  app.get("/healthz", async () => ({ ok: true, uptime: process.uptime(), ts: Date.now() }));

  app.get("/health", async (_request, reply) => {
    let dbStatus = "ok";
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = "error";
    }

    const status = dbStatus === "ok" ? "ok" : "degraded";
    const statusCode = status === "ok" ? 200 : 503;

    return reply.code(statusCode).send({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      services: {
        database: { status: dbStatus, latencyMs: dbLatency },
        ai: { status: process.env.ANTHROPIC_API_KEY ? "configured" : "missing" },
        email: { status: process.env.POSTMARK_SERVER_TOKEN ? "configured" : "fallback" },
      },
    });
  });

  app.get("/", async () => ({ ok: true, message: "API up" }));

  app.get("/_routes", (_request, reply) => {
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
  await registerJurisRoutes(app);
  await registerVencimientosRoutes(app);
  await registerActuacionesRoutes(app);
  await registerSearchRoutes(app);
  await registerStatsRoutes(app);

  const { registerUserRoutes } = await import("./routes.user.js");
  await registerUserRoutes(app);

  return app;
}
