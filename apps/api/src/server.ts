import "dotenv/config"; // carga .env ANTES de usar process.env
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { registerDocumentRoutes } from "./routes.documents.js";
import { registerAuthRoutes } from "./routes.auth.js";

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // CORS: DEBE ir antes de las rutas y antes de helmet
  const isDev = process.env.NODE_ENV !== "production";
  
  // Lista de orígenes permitidos con type guard
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
  ].filter((v): v is string => Boolean(v));
  
  const allowedSet = new Set<string>(allowedOrigins);

  await app.register(fastifyCors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: isDev ? true : (origin, cb) => {
      // permitir no-browser requests (origin null) y los de la whitelist
      if (!origin || allowedSet.has(origin)) {
        cb(null, true);
      } else {
        cb(new Error("CORS not allowed"), false);
      }
    },
  });

  // Seguridad (después de CORS)
  await app.register(helmet, {
    contentSecurityPolicy: false, // Desactivar CSP para Next.js
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  // Rate limiting para protección contra abuso
  await app.register(rateLimit, {
    max: 100, // máximo 100 requests
    timeWindow: 60000, // por minuto (60 segundos)
    errorResponseBuilder: (request, context) => ({
      ok: false,
      error: "too_many_requests",
      message: "Demasiadas solicitudes. Por favor, intentá de nuevo en unos momentos.",
    }),
  });

  // Healthcheck endpoint (sin rate limiting para monitoreo)
  app.get("/healthz", async (request, reply) => {
    const startTime = process.uptime();
    return reply.send({
      ok: true,
      uptime: Math.floor(startTime),
      timestamp: new Date().toISOString(),
    });
  });

  // registrar endpoints /documents/*
  await registerDocumentRoutes(app);

  // registrar endpoints /api/auth/*
  await registerAuthRoutes(app);

  return app;
}

// inicializamos y escuchamos
const app = await buildServer();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

try {
  await app.listen({
    port: PORT,
    host: "0.0.0.0",
  });

  app.log.info(`[api] listening on ${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
