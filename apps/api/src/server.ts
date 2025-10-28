import "dotenv/config"; // carga .env ANTES de usar process.env
import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerDocumentRoutes } from "./routes.documents.js";

async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // permitir que Next.js (puerto 3000) llame a la API (puerto 4001)
  await app.register(cors, {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
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
