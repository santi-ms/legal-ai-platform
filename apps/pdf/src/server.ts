import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { registerPdfRoutes } from "./routes.pdf.js";

async function main() {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });

  // registrar endpoints PDF
  await registerPdfRoutes(fastify);

  const PORT = process.env.PORT
    ? Number(process.env.PORT)
    : 4100;

  try {
    await fastify.listen({
      port: PORT,
      host: "0.0.0.0"
    });

    fastify.log.info(`[pdf-service] listening on ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
