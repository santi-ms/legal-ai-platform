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

// Ejecutar migraciones automáticamente al iniciar el servidor
async function runMigrations() {
  // Ejecutar migraciones si:
  // 1. Estamos en producción, O
  // 2. Estamos en desarrollo pero DATABASE_URL está configurada (para facilitar desarrollo local)
  const shouldRunMigrations = 
    process.env.NODE_ENV === "production" || 
    (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL);
  
  if (!shouldRunMigrations) {
    console.log("[migrate] ⏭️  Omitiendo migraciones (desarrollo sin DATABASE_URL)");
    return;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Usar schema local (prisma/schema.prisma) - Railway usa este repo solo
    const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
    
    if (!existsSync(schemaPath)) {
      // Fallback: intentar schema del monorepo (solo para desarrollo local)
      const monorepoSchema = path.resolve(__dirname, "../../../packages/db/prisma/schema.prisma");
      if (existsSync(monorepoSchema)) {
        console.log("[migrate] 📋 Usando schema del monorepo (desarrollo local)");
        execSync(`npx prisma migrate deploy --schema "${monorepoSchema}"`, {
          stdio: "inherit",
          env: process.env,
        });
        console.log("[migrate] ✅ Migraciones aplicadas correctamente");
        return;
      }
      console.warn("[migrate] ⚠️ No se encontró schema.prisma en prisma/schema.prisma");
      console.warn("[migrate] ⚠️ Omitiendo migraciones automáticas");
      return;
    }

    console.log("[migrate] 🔄 Ejecutando migraciones de Prisma...");
    console.log("[migrate] 📋 Schema:", schemaPath);
    
    // Para Supabase, si hay una URL de migración directa, usarla
    // De lo contrario, usar DATABASE_URL normal
    const migrationEnv = { ...process.env };
    if (process.env.DATABASE_MIGRATION_URL) {
      console.log("[migrate] 🔗 Usando DATABASE_MIGRATION_URL para migraciones");
      migrationEnv.DATABASE_URL = process.env.DATABASE_MIGRATION_URL;
    } else if (process.env.DATABASE_URL?.includes("pooler.supabase.com")) {
      console.log("[migrate] ⚠️ Detectado pooler de Supabase - las migraciones pueden fallar");
      console.log("[migrate] 💡 Sugerencia: Configurá DATABASE_MIGRATION_URL con la conexión directa de Supabase");
      console.log("[migrate] 💡 La conexión directa usa el puerto 6543 o la URL directa sin pooler");
    }
    
    // Ejecutar migraciones con timeout para evitar que se cuelgue
    return new Promise<void>((resolve, reject) => {
      try {
        execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
          stdio: "inherit",
          env: migrationEnv,
          timeout: 30000, // 30 segundos de timeout
        });
        console.log("[migrate] ✅ Migraciones aplicadas correctamente");
        resolve();
      } catch (error: any) {
        reject(error);
      }
    });
  } catch (error: any) {
    console.error("[migrate] ❌ Error ejecutando migraciones:", error.message);
    console.error("[migrate] ❌ Stack:", error.stack);
    
    // Verificar si es un error de conexión
    if (error.message?.includes("FATAL") || error.message?.includes("not found")) {
      console.error("[migrate] ⚠️ Error de conexión a la base de datos");
      console.error("[migrate] ⚠️ El error 'Tenant or user not found' generalmente significa:");
      console.error("[migrate] ⚠️ 1. Las credenciales (usuario/contraseña) son incorrectas");
      console.error("[migrate] ⚠️ 2. El usuario no existe en la base de datos");
      console.error("[migrate] ⚠️ 3. El usuario no tiene permisos para acceder");
      console.error("[migrate] ⚠️ Verificá que DATABASE_URL esté configurada correctamente en Railway");
      console.error("[migrate] ⚠️ DATABASE_URL presente:", !!process.env.DATABASE_URL);
      if (process.env.DATABASE_URL) {
        // Mostrar solo el host para diagnóstico (sin credenciales)
        try {
          const url = new URL(process.env.DATABASE_URL);
          console.error("[migrate] ⚠️ Host:", url.hostname);
          console.error("[migrate] ⚠️ Puerto:", url.port);
          console.error("[migrate] ⚠️ Database:", url.pathname);
          console.error("[migrate] ⚠️ Usuario:", url.username ? `${url.username.substring(0, 10)}...` : "no especificado");
        } catch (e) {
          console.error("[migrate] ⚠️ DATABASE_URL no es una URL válida");
        }
      }
      console.error("[migrate] 💡 SOLUCIÓN: Verificá en Railway que la variable DATABASE_URL tenga:");
      console.error("[migrate] 💡 - El usuario correcto (postgres.xxxxx)");
      console.error("[migrate] 💡 - La contraseña correcta");
      console.error("[migrate] 💡 - El host correcto");
      console.error("[migrate] 💡 - El nombre de la base de datos correcto (generalmente 'postgres')");
    }
    
    // No fallar el servidor si las migraciones fallan, pero loguear el error
    console.warn("[migrate] ⚠️ Continuando sin aplicar migraciones - el servidor iniciará pero puede haber errores de BD");
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
// Ejecutar de forma asíncrona para no bloquear el inicio del servidor
// El servidor iniciará aunque las migraciones fallen
runMigrations().catch((err) => {
  console.error("[migrate] ⚠️ Error en migraciones (no bloqueante):", err.message);
  console.error("[migrate] ⚠️ El servidor iniciará pero las tablas pueden no existir");
  console.error("[migrate] ⚠️ Solución: Ejecutá el script SQL manualmente en Supabase");
});

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
