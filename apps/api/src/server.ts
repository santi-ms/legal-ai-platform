import "dotenv/config"; // carga .env ANTES de usar process.env
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { registerDocumentRoutes } from "./routes.documents.js";

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // Helmet para headers de seguridad
  await app.register(helmet, {
    contentSecurityPolicy: false, // Desactivar CSP para Next.js
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  // permitir que Next.js (puerto 3000) llame a la API (puerto 4000)
  const allowedOrigins = [
    "http://localhost:3000",
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ];
  
  await app.register(cors, {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
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

  // registrar endpoints /documents/*
  await registerDocumentRoutes(app);

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
