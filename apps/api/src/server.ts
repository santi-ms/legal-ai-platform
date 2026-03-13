import "dotenv/config"; // carga .env ANTES de usar process.env
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { registerDocumentRoutes } from "./routes.documents.js";
import { registerAuthRoutes } from "./routes.auth.js";
import { initializeDocumentRegistry } from "./modules/documents/domain/document-registry.js";
import { execSync, exec } from "child_process";
import { promisify } from "util";
import { logger } from "./utils/logger.js";

const execAsync = promisify(exec);
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
    logger.info("[migrate] ⏭️  Omitiendo migraciones (desarrollo sin DATABASE_URL)");
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
        logger.info("[migrate] 📋 Usando schema del monorepo (desarrollo local)");
        execSync(`npx prisma migrate deploy --schema "${monorepoSchema}"`, {
          stdio: "inherit",
          env: process.env,
        });
        logger.info("[migrate] ✅ Migraciones aplicadas correctamente");
        return;
      }
      logger.warn("[migrate] ⚠️ No se encontró schema.prisma en prisma/schema.prisma");
      logger.warn("[migrate] ⚠️ Omitiendo migraciones automáticas");
      return;
    }

    logger.info("[migrate] 🔄 Ejecutando migraciones de Prisma...");
    logger.info("[migrate] 📋 Schema:", { schemaPath });
    
    // Para Supabase, si hay una URL de migración directa, usarla
    // De lo contrario, usar DATABASE_URL normal
    const migrationEnv = { ...process.env };
    if (process.env.DATABASE_MIGRATION_URL) {
      logger.info("[migrate] 🔗 Usando DATABASE_MIGRATION_URL para migraciones");
      migrationEnv.DATABASE_URL = process.env.DATABASE_MIGRATION_URL;
    } else if (process.env.DATABASE_URL?.includes("pooler.supabase.com")) {
      logger.warn("[migrate] ⚠️ Detectado pooler de Supabase - las migraciones pueden fallar");
      logger.info("[migrate] 💡 Sugerencia: Configurá DATABASE_MIGRATION_URL con la conexión directa de Supabase");
      logger.info("[migrate] 💡 La conexión directa usa el puerto 6543 o la URL directa sin pooler");
    }
    
    // Ejecutar migraciones con timeout para evitar que se cuelgue
    // Usar execAsync en lugar de execSync para que no bloquee
    return Promise.race([
      execAsync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
        env: migrationEnv,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      }).then((result) => {
        if (result.stdout) logger.info("[migrate] stdout:", { stdout: result.stdout });
        if (result.stderr && !result.stderr.includes("No pending migrations")) {
          logger.info("[migrate] stderr:", { stderr: result.stderr });
        }
        logger.info("[migrate] ✅ Migraciones aplicadas correctamente");
      }),
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Timeout: Las migraciones tardaron más de 60 segundos"));
        }, 60000); // 60 segundos de timeout (aumentado de 30s)
      }),
    ]);
  } catch (error: any) {
    logger.error("[migrate] ❌ Error ejecutando migraciones", error, { message: error.message });
    
    // Verificar si es un error de conexión
    if (error.message?.includes("FATAL") || error.message?.includes("not found")) {
      logger.error("[migrate] ⚠️ Error de conexión a la base de datos", error, {
        message: "El error 'Tenant or user not found' generalmente significa:",
        reasons: [
          "Las credenciales (usuario/contraseña) son incorrectas",
          "El usuario no existe en la base de datos",
          "El usuario no tiene permisos para acceder",
        ],
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      });
      if (process.env.DATABASE_URL) {
        // Mostrar solo el host para diagnóstico (sin credenciales)
        try {
          const url = new URL(process.env.DATABASE_URL);
          logger.error("[migrate] ⚠️ Información de conexión", undefined, {
            host: url.hostname,
            port: url.port,
            database: url.pathname,
            user: url.username ? `${url.username.substring(0, 10)}...` : "no especificado",
          });
        } catch (e) {
          logger.error("[migrate] ⚠️ DATABASE_URL no es una URL válida", e);
        }
      }
      logger.error("[migrate] 💡 SOLUCIÓN", undefined, {
        solution: "Verificá en Railway que la variable DATABASE_URL tenga:",
        requirements: [
          "El usuario correcto (postgres.xxxxx)",
          "La contraseña correcta",
          "El host correcto",
          "El nombre de la base de datos correcto (generalmente 'postgres')",
        ],
      });
    }
    
    // No fallar el servidor si las migraciones fallan, pero loguear el error
    logger.warn("[migrate] ⚠️ Continuando sin aplicar migraciones - el servidor iniciará pero puede haber errores de BD");
  }
}

// Verificar y aplicar migración de campos de usuario si es necesario
async function ensureUserProfileFields() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    
    // Verificar si las columnas existen
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('bio', 'notificationPreferences');
    `);

    const existingColumns = result.map(r => r.column_name);
    const missingColumns = ['bio', 'notificationPreferences'].filter(
      col => !existingColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      logger.info(`[migrate] 🔧 Aplicando migración para campos: ${missingColumns.join(', ')}`);
      
      // Aplicar cada columna por separado (IF NOT EXISTS requiere sentencias separadas)
      if (missingColumns.includes('bio')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;`);
      }
      if (missingColumns.includes('notificationPreferences')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;`);
      }

      logger.info("[migrate] ✅ Campos de usuario agregados exitosamente");
    } else {
      logger.info("[migrate] ✅ Campos de usuario ya existen");
    }

    await prisma.$disconnect();
  } catch (error: any) {
    // Si falla, solo loguear el error pero no bloquear el servidor
    logger.warn("[migrate] ⚠️ No se pudieron verificar/aplicar campos de usuario:", error.message);
    logger.warn("[migrate] 💡 Asegurate de que las columnas bio y notificationPreferences existan en la tabla User");
  }
}

async function buildServer() {
  // Initialize document registry
  initializeDocumentRegistry();
  logger.info("[server] Document registry initialized");
  
  // Verificar y aplicar migración de campos de usuario
  await ensureUserProfileFields();
  
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

  // Función para verificar si un origen está permitido
  const isOriginAllowed = (origin: string | undefined): boolean => {
    // Permitir requests sin origin (no-browser, Postman, etc.)
    if (!origin) {
      return true;
    }
    
    // Verificar si está en la whitelist
    if (allowedSet.has(origin)) {
      return true;
    }
    
    // Permitir cualquier dominio de Vercel
    if (origin.includes(".vercel.app")) {
      return true;
    }
    
    return false;
  };

  await app.register(fastifyCors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    origin: isDev ? true : (origin, cb) => {
      if (isOriginAllowed(origin)) {
        cb(null, true);
      } else {
        logger.warn("[CORS] Rejected origin", { origin });
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

  // registrar endpoints /api/user/*
  const { registerUserRoutes } = await import("./routes.user.js");
  await registerUserRoutes(app);

  return app;
}

// Ejecutar migraciones antes de iniciar el servidor (solo en producción)
// Ejecutar de forma asíncrona para no bloquear el inicio del servidor
// El servidor iniciará aunque las migraciones fallen
runMigrations().catch((err) => {
  logger.error("[migrate] ⚠️ Error en migraciones (no bloqueante)", err, {
    message: "El servidor iniciará pero las tablas pueden no existir",
    solution: "Ejecutá el script SQL manualmente en Supabase",
  });
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
