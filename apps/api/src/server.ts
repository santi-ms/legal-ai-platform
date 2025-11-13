import "dotenv/config"; // carga .env ANTES de usar process.env
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { registerDocumentRoutes } from "./routes.documents.js";
import { registerAuthRoutes } from "./routes.auth.js";
import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Ejecutar migraciones automáticamente al iniciar el servidor (solo en producción)
function runMigrations() {
  if (process.env.NODE_ENV !== "production") {
    return; // En desarrollo, las migraciones se ejecutan manualmente
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Usar siempre el schema compartido del monorepo
    const schemaPath = path.resolve(__dirname, "../../../packages/db/prisma/schema.prisma");
    
    if (!existsSync(schemaPath)) {
      console.warn("[migrate] ⚠️ No se encontró schema.prisma en packages/db/prisma/schema.prisma");
      console.warn("[migrate] ⚠️ Omitiendo migraciones automáticas");
      return;
    }

    console.log("[migrate] 🔄 Ejecutando migraciones de Prisma...");
    console.log("[migrate] 📋 Schema:", schemaPath);
    execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
      stdio: "inherit",
      env: process.env,
    });
    console.log("[migrate] ✅ Migraciones aplicadas correctamente");
  } catch (error: any) {
    console.error("[migrate] ❌ Error ejecutando migraciones:", error.message);
    // No fallar el servidor si las migraciones fallan, pero loguear el error
    console.warn("[migrate] ⚠️ Continuando sin aplicar migraciones");
  }
}

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
  app.get("/healthz", async () => ({
    ok: true,
    uptime: process.uptime(),
    ts: Date.now(),
  }));

  // Raíz simple para diagnóstico rápido
  app.get("/", async () => ({ ok: true, message: "API up" }));

  // Listado de rutas registradas
  app.get("/_routes", (request, reply) => {
    const routes = app.printRoutes();
    return reply.type("text/plain").send(routes);
  });

  // registrar endpoints /documents/*
  await registerDocumentRoutes(app);

  // registrar endpoints /api/auth/*
  await registerAuthRoutes(app);

  return app;
}

// Ejecutar migraciones antes de iniciar el servidor (solo en producción)
runMigrations();

// inicializamos y escuchamos
const app = await buildServer();

await app.ready();
app.log.info({ event: "routes", routes: app.printRoutes() });

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
