import { FastifyInstance } from "fastify";
import { z } from "zod";
// Usar Puppeteer en lugar de PDFKit (más confiable)
import { generatePdfFromContract } from "./pdfGeneratorPuppeteer.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// ESM safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar el mismo OUTPUT_DIR que pdfGenerator.ts
const OUTPUT_DIR = process.env.PDF_OUTPUT_DIR || path.resolve(__dirname, "../generated");

const BodySchema = z.object({
  title: z.string().min(1),
  rawText: z.string().min(1),
  fileName: z.string().optional(), // opcional: si viene, validar formato
  logoDataUri: z.string().optional(), // base64 data URI del logo del estudio
});

// Directorio para referencias subidas (separado de los PDFs generados)
const REFERENCES_DIR = process.env.PDF_REFERENCES_DIR || path.resolve(__dirname, "../references");

export async function registerPdfRoutes(app: FastifyInstance) {
  // Asegurar que el directorio de referencias exista
  await fs.promises.mkdir(REFERENCES_DIR, { recursive: true });

  // POST /pdf/upload-reference - Guardar un PDF de referencia subido por el usuario
  app.post("/pdf/upload-reference", async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ ok: false, error: "no_file", message: "No se recibió ningún archivo" });
      }
      if (!data.mimetype.includes("pdf")) {
        return reply.status(400).send({ ok: false, error: "invalid_type", message: "Solo se aceptan archivos PDF" });
      }

      const fileName = (data.fields as any)?.fileName?.value as string | undefined;
      if (!fileName || !/^[a-zA-Z0-9._-]+\.pdf$/.test(fileName)) {
        return reply.status(400).send({ ok: false, error: "invalid_file_name", message: "fileName inválido" });
      }

      const filePath = path.join(REFERENCES_DIR, fileName);
      const buffer = await data.toBuffer();
      await fs.promises.writeFile(filePath, buffer);

      app.log.info(`[pdf] Reference uploaded: ${fileName}`);
      return reply.send({ ok: true, fileName });
    } catch (err) {
      app.log.error(err, "[pdf] Error uploading reference");
      return reply.status(500).send({ ok: false, error: "upload_failed" });
    }
  });

  // GET /pdf/reference/:fileName - Descargar un PDF de referencia
  app.get("/pdf/reference/:fileName", async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    if (fileName.includes("..") || fileName.includes("/")) {
      return reply.status(400).send({ ok: false, error: "invalid_file_name" });
    }
    const filePath = path.join(REFERENCES_DIR, fileName);
    try {
      await fs.promises.access(filePath);
      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `attachment; filename="${fileName}"`);
      return reply.send(fs.createReadStream(filePath));
    } catch {
      return reply.status(404).send({ ok: false, error: "REFERENCE_NOT_FOUND" });
    }
  });

  // DELETE /pdf/reference/:fileName - Eliminar un PDF de referencia
  app.delete("/pdf/reference/:fileName", async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    if (fileName.includes("..") || fileName.includes("/")) {
      return reply.status(400).send({ ok: false, error: "invalid_file_name" });
    }
    const filePath = path.join(REFERENCES_DIR, fileName);
    try {
      await fs.promises.unlink(filePath);
      return reply.send({ ok: true });
    } catch {
      return reply.status(404).send({ ok: false, error: "REFERENCE_NOT_FOUND" });
    }
  });

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

    const { title, rawText, fileName, logoDataUri } = parsed.data;

    app.log.info(`[pdf] Generating PDF with fileName: ${fileName || "auto-generated"}`);
    app.log.info(`[pdf] Title: ${title}, Text length: ${rawText.length}, Logo: ${logoDataUri ? "yes" : "no"}`);

    // Validar fileName si viene (debe ser alfanumérico con punto, guión o underscore)
    if (fileName && !/^[a-zA-Z0-9._-]+\.pdf$/.test(fileName)) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_file_name",
        message: "fileName debe terminar en .pdf y contener solo caracteres alfanuméricos, puntos, guiones o underscores"
      });
    }

    // Validar que rawText no esté vacío
    if (!rawText || rawText.trim().length === 0) {
      app.log.warn(`[pdf] WARNING: rawText is empty!`);
      return reply.status(400).send({
        ok: false,
        error: "empty_text",
        message: "rawText cannot be empty"
      });
    }

    try {
      const result = await generatePdfFromContract({ title, rawText, fileName, logoDataUri });

      app.log.info(`[pdf] PDF generated successfully: ${result.fileName}`);
      
      return reply.send({
        ok: true,
        filePath: result.filePath,
        fileName: result.fileName
      });
    } catch (err) {
      request.log.error(err, `[pdf] Error generating PDF: ${err instanceof Error ? err.message : "Unknown error"}`);
      return reply.status(500).send({
        ok: false,
        error: "PDF_GENERATION_FAILED",
        message: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });
}
