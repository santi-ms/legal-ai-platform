import { FastifyInstance } from "fastify";
import { z } from "zod";
import { generatePdfFromContract } from "./pdfGenerator.js";
import fs from "node:fs";
import path from "node:path";

const BodySchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(1),
  fileName: z.string().optional(), // opcional: si viene, validar formato
});

export async function registerPdfRoutes(app: FastifyInstance) {
  // GET /pdf/:fileName - Descargar PDF por nombre
  app.get("/pdf/:fileName", async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    
    // Sanitizar fileName para evitar path traversal
    if (fileName.includes("..") || fileName.includes("/")) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_file_name"
      });
    }

    const OUTPUT_DIR = process.env.PDF_OUTPUT_DIR || path.resolve(process.cwd(), "generated");
    const filePath = path.join(OUTPUT_DIR, fileName);
    
    app.log.info(`[pdf] Reading PDF with fileName: ${fileName}`);
    app.log.info(`[pdf] File path: ${filePath}`);

    try {
      await fs.promises.access(filePath);
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${fileName}"`);
      return reply.send(fs.createReadStream(filePath));
    } catch {
      app.log.warn(`[pdf] File not found: ${filePath}`);
      return reply.status(404).send({
        ok: false,
        error: "PDF_NOT_FOUND"
      });
    }
  });

  app.post("/pdf/generate", async (request, reply) => {
    const parsed = BodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_body",
        details: parsed.error.format()
      });
    }

    const { title, rawText, fileName } = parsed.data;

    // Validar fileName si viene (debe ser alfanumérico con punto, guión o underscore)
    if (fileName && !/^[a-zA-Z0-9._-]+\.pdf$/.test(fileName)) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_file_name",
        message: "fileName debe terminar en .pdf y contener solo caracteres alfanuméricos, puntos, guiones o underscores"
      });
    }

    try {
      const result = await generatePdfFromContract({ title, rawText, fileName });

      return reply.send({
        ok: true,
        filePath: result.filePath,
        fileName: result.fileName
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        ok: false,
        error: "PDF_GENERATION_FAILED"
      });
    }
  });
}
