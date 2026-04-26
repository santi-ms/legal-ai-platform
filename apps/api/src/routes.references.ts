import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { extractTextFromPdf } from "./modules/documents/services/pdf-extractor.js";
import { randomUUID } from "node:crypto";

// Tipos con flujo optimizado (6 predefinidos) + cualquier tipo libre (comodato, poder, etc.)
// Solo validamos que sea un string no vacío con caracteres válidos
const DOCUMENT_TYPE_REGEX = /^[a-z0-9_]{2,80}$/;

/**
 * Sanitiza el nombre de archivo para evitar path traversal y caracteres peligrosos.
 * Preserva letras, números, espacios, guiones, guiones bajos, paréntesis y un punto.
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9.\-_() ]/g, "_") // reemplazar caracteres peligrosos
    .replace(/\.\./g, "_")                  // evitar path traversal
    .substring(0, 255);                     // límite de longitud
}

export async function registerReferenceRoutes(app: FastifyInstance) {
  // ==========================================
  // POST /documents/references/upload
  // ==========================================
  app.post("/documents/references/upload", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const data = await (request as any).file();
      if (!data) {
        return reply.status(400).send({ ok: false, error: "NO_FILE", message: "No se recibió ningún archivo" });
      }

      if (!data.mimetype.includes("pdf")) {
        return reply.status(400).send({ ok: false, error: "INVALID_TYPE", message: "Solo se aceptan archivos PDF" });
      }

      const documentType = (data.fields as any)?.documentType?.value as string | undefined;
      if (!documentType || !DOCUMENT_TYPE_REGEX.test(documentType)) {
        return reply.status(400).send({
          ok: false,
          error: "INVALID_DOCUMENT_TYPE",
          message: "Tipo de documento inválido. Debe contener solo letras minúsculas, números y guiones bajos (2-80 caracteres).",
        });
      }

      // Leer el buffer del archivo
      const buffer = await data.toBuffer();
      const fileSize = buffer.length;
      const originalName = sanitizeFileName(data.filename ?? "archivo.pdf");

      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
      if (fileSize > MAX_FILE_SIZE) {
        return reply.status(400).send({ ok: false, error: "FILE_TOO_LARGE", message: "El archivo supera el límite de 10 MB" });
      }

      // Verificar límite de almacenamiento del plan (suma de fileSize de referenceDocuments)
      const { checkStorageLimit, storageLimitExceededResponse } = await import("./services/plan-limits.js");
      const storage = await checkStorageLimit({ tenantId: user.tenantId, incomingBytes: fileSize });
      if (!storage.ok) {
        return reply.status(429).send(storageLimitExceededResponse(storage));
      }

      // Generar nombre único para el archivo
      const id = randomUUID();
      const fileName = `ref-${id}.pdf`;

      // Extraer texto del PDF
      const pdfText = await extractTextFromPdf(buffer);

      // Subir el archivo al PDF service
      const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";
      const formData = new FormData();
      const blob = new Blob([buffer], { type: "application/pdf" });
      formData.append("file", blob, fileName);
      formData.append("fileName", fileName);

      const uploadResponse = await fetch(`${pdfServiceUrl}/pdf/upload-reference`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.text().catch(() => "");
        app.log.error({ err }, "[references] Error subiendo archivo al PDF service");
        return reply.status(500).send({ ok: false, error: "UPLOAD_FAILED", message: "Error al guardar el archivo" });
      }

      const storageUrl = `${pdfServiceUrl}/pdf/reference/${fileName}`;

      // Guardar en BD
      const referenceDoc = await prisma.referenceDocument.create({
        data: {
          id,
          tenantId: user.tenantId,
          uploadedById: user.userId,
          originalName,
          fileName,
          fileSize,
          fileType: "pdf",
          documentType,
          pdfText,
          storageUrl,
          updatedAt: new Date(),
        },
      });

      const hasText = Boolean(referenceDoc.pdfText && referenceDoc.pdfText.trim().length > 50);

      return reply.status(201).send({
        ok: true,
        warning: !hasText
          ? "El PDF no tiene texto extraíble (puede ser una imagen escaneada). La IA no podrá usarlo como referencia de estilo."
          : null,
        referenceDocument: {
          id: referenceDoc.id,
          originalName: referenceDoc.originalName,
          documentType: referenceDoc.documentType,
          fileSize: referenceDoc.fileSize,
          hasText,
          textPreview: referenceDoc.pdfText ? referenceDoc.pdfText.substring(0, 200) : null,
          storageUrl: referenceDoc.storageUrl,
          createdAt: referenceDoc.createdAt,
        },
      });
    } catch (err) {
      request.log.error({ err }, "POST /documents/references/upload error");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ==========================================
  // GET /documents/references
  // ==========================================
  app.get("/documents/references", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const QuerySchema = z.object({
        documentType: z.string().optional(),
      });
      const query = QuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_QUERY" });
      }

      const references = await prisma.referenceDocument.findMany({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          ...(query.data.documentType ? { documentType: query.data.documentType } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          originalName: true,
          documentType: true,
          fileSize: true,
          storageUrl: true,
          pdfText: true,
          createdAt: true,
          uploadedBy: { select: { firstName: true, lastName: true, email: true } },
        },
      });

      const referencesWithFlags = references.map((r) => ({
        ...r,
        hasText: Boolean(r.pdfText && r.pdfText.trim().length > 50),
        pdfText: undefined, // no exponer el texto completo en el listado
      }));

      return reply.send({ ok: true, references: referencesWithFlags });
    } catch (err) {
      request.log.error({ err }, "GET /documents/references error");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ==========================================
  // DELETE /documents/references/:id
  // ==========================================
  app.delete("/documents/references/:id", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const { id } = request.params as { id: string };

      const reference = await prisma.referenceDocument.findFirst({
        where: { id, tenantId: user.tenantId, deletedAt: null },
      });

      if (!reference) {
        return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
      }

      // Borrado suave
      await prisma.referenceDocument.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Intentar eliminar el archivo del PDF service (no crítico si falla)
      const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";
      fetch(`${pdfServiceUrl}/pdf/reference/${reference.fileName}`, { method: "DELETE" }).catch((err) => {
        app.log.warn({ err }, "[references] No se pudo eliminar el archivo del PDF service");
      });

      return reply.send({ ok: true });
    } catch (err) {
      request.log.error({ err }, "DELETE /documents/references/:id error");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });
}
