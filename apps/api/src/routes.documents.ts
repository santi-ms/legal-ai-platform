import { FastifyInstance } from "fastify";
import { GenerateDocumentSchema } from "./types.js";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getUserFromRequest, requireAuth } from "./utils/auth.js";

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema para query params de GET /documents
const DocumentsQuerySchema = z.object({
  query: z.string().optional(), // búsqueda de texto
  type: z.string().optional(),
  jurisdiccion: z.string().optional(),
  from: z.string().datetime().optional(), // ISO date
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["createdAt:asc", "createdAt:desc"]).default("createdAt:desc"),
});

export async function registerDocumentRoutes(app: FastifyInstance) {
  // ==========================================
  // GET /documents - Paginado con filtros
  // ==========================================
  app.get("/documents", async (request, reply) => {
    try {
      // Extraer usuario (si hay token)
      const user = getUserFromRequest(request);

      // Parsear query params
      const queryParams = DocumentsQuerySchema.safeParse(request.query);
      if (!queryParams.success) {
        return reply.status(400).send({
          ok: false,
          error: "INVALID_QUERY_PARAMS",
          details: queryParams.error.format(),
        });
      }

      const { query, type, jurisdiccion, from, to, page, pageSize, sort } =
        queryParams.data;

      // Construir filtros
      const where: any = {};

      // Multi-tenant: solo documentos del tenant del usuario
      if (user) {
        where.tenantId = user.tenantId;
      } else {
        // Sin autenticación, no mostrar documentos (o devolver 401)
        return reply.status(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida",
        });
      }

      // Filtro por tipo
      if (type) {
        where.type = type;
      }

      // Filtro por jurisdicción
      if (jurisdiccion) {
        where.jurisdiccion = jurisdiccion;
      }

      // Filtro por rango de fechas
      if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
      }

      // Búsqueda de texto (en type, jurisdiccion)
      if (query) {
        where.OR = [
          { type: { contains: query, mode: "insensitive" } },
          { jurisdiccion: { contains: query, mode: "insensitive" } },
        ];
      }

      // Orden
      const [sortField, sortDirection] = sort.split(":");
      const orderBy: any = {};
      orderBy[sortField] = sortDirection;

      // Contar total (antes de paginar)
      const total = await prisma.document.count({ where });

      // Obtener documentos paginados
      const skip = (page - 1) * pageSize;
      const documents = await prisma.document.findMany({
        where,
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              rawText: true,
              pdfUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      });

      return reply.send({
        ok: true,
        items: documents.map((doc) => ({
          id: doc.id,
          type: doc.type,
          jurisdiccion: doc.jurisdiccion,
          tono: doc.tono,
          estado: doc.estado,
          costUsd: doc.costUsd,
          createdAt: doc.createdAt.toISOString(),
          lastVersion: doc.versions[0] ?? null,
        })),
        total,
        page,
        pageSize,
      });
    } catch (err) {
      request.log?.error({ err }, "documents route error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // POST /documents/generate
  // ==========================================
  app.post("/documents/generate", async (request, reply) => {
    try {
      // 1️⃣ Validar body contra Zod
      const parsed = GenerateDocumentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          ok: false,
          error: "invalid_body",
          details: parsed.error.format(),
        });
      }

      const data = parsed.data;

      // 2️⃣ Construir prompt legal mejorado
      const systemMessage = `Eres un abogado senior argentino especializado en derecho comercial con 20 años de experiencia. Generas documentos legales válidos, profesionales y completos según la normativa argentina vigente.`;

      const prompt = `GENERA UN ${data.type.toUpperCase()} PROFESIONAL

ESPECIFICACIONES LEGALES:
- Jurisdicción/Fuero: ${data.jurisdiccion}
- Legislación: Código de Comercio Argentino, Código Civil y Comercial
- Jurisdicción competente: ${data.jurisdiccion} (renuncia expresa a cualquier otro fuero)

PARTES CONTRATANTES:

PROVEEDOR:
- Nombre/Razón Social: ${data.proveedor_nombre}
- Documento/CUIT: ${data.proveedor_doc}
- Domicilio: ${data.proveedor_domicilio}

CLIENTE:
- Nombre/Razón Social: ${data.cliente_nombre}
- Documento/CUIT: ${data.cliente_doc}
- Domicilio: ${data.cliente_domicilio}

OBJETO Y CONDICIONES:
- Servicio/Objeto del contrato: ${data.descripcion_servicio}
- Monto mensual: ${data.monto_mensual}
- Forma de pago: ${data.forma_pago}
- Inicio de vigencia: ${data.inicio_vigencia}
- Plazo mínimo: ${data.plazo_minimo_meses} meses
- Penalización por rescisión anticipada: ${data.penalizacion_rescision ? "SÍ" : "NO"}${data.penalizacion_rescision && data.penalizacion_monto ? ` - Monto de penalización: ${data.penalizacion_monto}` : ""}
- Modalidad facturación: ${data.preferencias_fiscales}

INSTRUCCIONES DE REDACCIÓN:
1. TONO: ${data.tono === "formal" ? "Formal y técnico legal. Usar terminología jurídica precisa y cláusulas técnicas." : "Comercial y claro. Lenguaje entendible para PyMEs sin sacrificar validez legal."}
2. ESTRUCTURA: Encabezado con datos completos de partes, luego cláusulas numeradas (PRIMERA, SEGUNDA, etc.)
3. MÍNIMOS LEGALES: Incluir cláusulas obligatorias según tipo de contrato y normativa argentina
4. VALIDEZ: El documento debe ser legalmente válido y ejecutable en Argentina
5. ESPECIFICIDAD: Usar los datos concretos proporcionados (montos, fechas, domicilios)

CLÁUSULAS OBLIGATORIAS A INCLUIR:
- Identificación completa de partes con CUIT/documento
- Domicilio constituido en ${data.jurisdiccion}
- Foro de competencia exclusivo en ${data.jurisdiccion}
- Ley aplicable (leyes argentinas)
- Medios de resolución de disputas
- Plazo de vigencia y condiciones de rescisión
- Modalidades de pago y facturación
- Objeto del contrato claramente definido

FORMATO DE SALIDA:
- SOLO el texto del contrato legal
- SIN explicaciones, comentarios o contexto adicional
- Numeración de cláusulas en mayúsculas (PRIMERA, SEGUNDA, etc.)
- Sección final para FIRMAS con espacios en blanco:
  * Firma y aclaración del Proveedor
  * Firma y aclaración del Cliente
  * Lugar y fecha

IMPORTANTE: Responde ÚNICAMENTE con el texto del contrato.`;

      // 3️⃣ Generar contrato con IA (con fallback)
      let contratoRaw = "";
      let contrato = "";

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4000,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        });

        contratoRaw = completion.choices?.[0]?.message?.content ?? "";
        contrato = contratoRaw.trim();
      } catch (primaryError) {
        // Fallback a GPT-3.5 si falla
        request.log.warn(
          primaryError,
          "Primary model failed, falling back to GPT-3.5",
        );

        const fallbackCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        });

        contratoRaw = fallbackCompletion.choices?.[0]?.message?.content ?? "";
        contrato = contratoRaw.trim();
      }

      // 4️⃣ Autenticación
      const user = getUserFromRequest(request);

      // Si no hay usuario autenticado, usar demo (compatibilidad temporal)
      const tenantId = user?.tenantId || "demo-tenant";
      const userId = user?.userId || "demo-user";

      // 5️⃣ Guardar documento y versión en la base
      const { documentRecord, versionRecord } = await prisma.$transaction(
        async (tx) => {
          // Aseguramos tenant (o usar el existente si hay usuario)
          let tenant;
          if (user?.tenantId) {
            tenant = await tx.tenant.findUnique({
              where: { id: user.tenantId },
            });
            if (!tenant) {
              throw new Error("Tenant no encontrado");
            }
          } else {
            // Modo demo
            tenant = await tx.tenant.upsert({
              where: { id: tenantId },
              update: {},
              create: { id: tenantId, name: "Demo Tenant" },
            });
          }

          // Si hay usuario autenticado, usar ese usuario
          let finalUser;
          if (user?.userId) {
            finalUser = await tx.user.findUnique({
              where: { id: user.userId },
            });
            if (!finalUser) {
              throw new Error("Usuario no encontrado");
            }
          } else {
            // Modo demo
            finalUser = await tx.user.upsert({
              where: { id: userId },
              update: {},
              create: {
                id: userId,
                email: "demo@example.com",
                passwordHash: "dev-placeholder",
                role: "owner",
                tenantId: tenant.id,
                emailVerified: null,
              },
            });
          }

          // Creamos el documento
          const doc = await tx.document.create({
            data: {
              tenantId: tenant.id,
              createdById: finalUser.id,
              type: data.type,
              jurisdiccion: data.jurisdiccion,
              tono: data.tono,
              estado: "GENERATED", // <-- importante para UI verde
              costUsd: 0,
            },
          });

          // Creamos la versión inicial
          const ver = await tx.documentVersion.create({
            data: {
              documentId: doc.id,
              versionNumber: 1,
              rawText: contrato,
              generatedBy: "gpt-5",
            },
          });

          return { documentRecord: doc, versionRecord: ver };
        },
      );

      // 6️⃣ Definir fileName único basado en versionId
      const fileName = `${versionRecord.id}.pdf`;
      app.log.info(`[api] Generating PDF with fileName: ${fileName}`);

      // 7️⃣ Llamar microservicio PDF
      let pdfGenerated = false;
      try {
        const pdfServiceUrl =
          process.env.PDF_SERVICE_URL || "http://localhost:4100";
        const pdfResponse = await fetch(`${pdfServiceUrl}/pdf/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.type.toUpperCase(),
            rawText: contrato,
            fileName: fileName,
          }),
        });

        if (pdfResponse.ok) {
          const pdfJson = await pdfResponse.json();
          if (pdfJson.ok && pdfJson.fileName === fileName) {
            pdfGenerated = true;
            app.log.info(`[api] PDF generated successfully: ${fileName}`);
          }
        }
      } catch (err) {
        app.log.error(err, "Error al llamar al pdf-service");
      }

      // 8️⃣ Guardar fileName en DB
      if (pdfGenerated) {
        await prisma.documentVersion.update({
          where: { id: versionRecord.id },
          data: { pdfUrl: fileName },
        });
      }

      // 9️⃣ Responder al cliente
      return reply.status(200).send({
        ok: true,
        documentId: documentRecord.id,
        contrato,
        pdfUrl: pdfGenerated ? fileName : null,
      });
    } catch (err) {
      request.log?.error({ err }, "documents route error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // POST /documents/:id/duplicate
  // ==========================================
  app.post("/documents/:id/duplicate", async (request, reply) => {
    try {
      const user = requireAuth(request);

      const ParamsSchema = z.object({ id: z.string().uuid() });
      const parsed = ParamsSchema.safeParse(request.params);

      if (!parsed.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_ID" });
      }

      const { id } = parsed.data;

      // Obtener documento original
      const original = await prisma.document.findFirst({
        where: {
          id,
          tenantId: user.tenantId, // Verificar tenant
        },
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!original) {
        return reply.status(404).send({
          ok: false,
          error: "DOCUMENT_NOT_FOUND",
        });
      }

      // Crear duplicado
      const duplicated = await prisma.$transaction(async (tx) => {
        // Crear nuevo documento
        const newDoc = await tx.document.create({
          data: {
            tenantId: user.tenantId,
            createdById: user.userId,
            type: original.type,
            jurisdiccion: original.jurisdiccion,
            tono: original.tono,
            estado: "generated_text",
            costUsd: null,
          },
        });

        // Copiar última versión si existe
        if (original.versions[0]) {
          await tx.documentVersion.create({
            data: {
              documentId: newDoc.id,
              versionNumber: 1,
              rawText: original.versions[0].rawText,
              pdfUrl: null, // PDF no se duplica, se debe regenerar
              generatedBy: original.versions[0].generatedBy,
            },
          });
        }

        return newDoc;
      });

      return reply.status(201).send({
        ok: true,
        message: "Documento duplicado exitosamente",
        data: {
          id: duplicated.id,
        },
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return reply.status(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida",
        });
      }
      request.log?.error({ err }, "documents route error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // DELETE /documents/:id
  // ==========================================
  app.delete("/documents/:id", async (request, reply) => {
    try {
      const user = requireAuth(request);

      const ParamsSchema = z.object({ id: z.string().uuid() });
      const parsed = ParamsSchema.safeParse(request.params);

      if (!parsed.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_ID" });
      }

      const { id } = parsed.data;

      // Verificar que el documento existe y pertenece al tenant
      const document = await prisma.document.findFirst({
        where: {
          id,
          tenantId: user.tenantId,
        },
      });

      if (!document) {
        return reply.status(404).send({
          ok: false,
          error: "DOCUMENT_NOT_FOUND",
        });
      }

      // Verificar RBAC: solo admin puede eliminar
      if (user.role !== "admin" && user.role !== "owner") {
        return reply.status(403).send({
          ok: false,
          error: "FORBIDDEN",
          message: "No tienes permiso para eliminar documentos",
        });
      }

      // Eliminar (cascade elimina versiones)
      await prisma.document.delete({
        where: { id },
      });

      return reply.status(200).send({
        ok: true,
        message: "Documento eliminado exitosamente",
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return reply.status(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida",
        });
      }
      request.log?.error({ err }, "documents route error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // PATCH /documents/:id
  // ==========================================
  app.patch("/documents/:id", async (request, reply) => {
    try {
      const user = requireAuth(request);

      const ParamsSchema = z.object({ id: z.string().uuid() });
      const BodySchema = z.object({
        type: z.string().optional(),
        jurisdiccion: z.string().optional(),
        tono: z.string().optional(),
      });

      const paramsParsed = ParamsSchema.safeParse(request.params);
      const bodyParsed = BodySchema.safeParse(request.body);

      if (!paramsParsed.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_ID" });
      }

      if (!bodyParsed.success) {
        return reply.status(400).send({
          ok: false,
          error: "INVALID_BODY",
          details: bodyParsed.error.format(),
        });
      }

      const { id } = paramsParsed.data;
      const updateData = bodyParsed.data;

      // Verificar que el documento existe y pertenece al tenant
      const document = await prisma.document.findFirst({
        where: {
          id,
          tenantId: user.tenantId,
        },
      });

      if (!document) {
        return reply.status(404).send({
          ok: false,
          error: "DOCUMENT_NOT_FOUND",
        });
      }

      // Actualizar
      const updated = await prisma.document.update({
        where: { id },
        data: updateData,
      });

      return reply.status(200).send({
        ok: true,
        message: "Documento actualizado exitosamente",
        data: {
          id: updated.id,
          type: updated.type,
          jurisdiccion: updated.jurisdiccion,
          tono: updated.tono,
        },
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return reply.status(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida",
        });
      }
      request.log?.error({ err }, "documents route error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // GET /documents/:id
  // ==========================================
  app.get("/documents/:id", async (request, reply) => {
    const ParamsSchema = z.object({ id: z.string().uuid() });
    const parsed = ParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_ID" });
    }

    const { id } = parsed.data;

    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              rawText: true,
              pdfUrl: true,
              createdAt: true,
            },
          },
        },
      });

      if (!document) {
        return reply
          .status(404)
          .send({ ok: false, error: "DOCUMENT_NOT_FOUND" });
      }

      const lastVersion = document.versions[0] ?? null;

      return reply.send({
        ok: true,
        document: {
          id: document.id,
          type: document.type,
          jurisdiccion: document.jurisdiccion,
          tono: document.tono,
          estado: document.estado,
          costUsd: document.costUsd,
          lastVersion,
        },
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return reply.status(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida",
        });
      }
      request.log?.error({ err }, "documents route error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // GET /documents/:id/pdf
  // ==========================================
  app.get("/documents/:id/pdf", async (request, reply) => {
    try {
      const user = requireAuth(request);

      const ParamsSchema = z.object({ id: z.string().uuid() });
      const parsed = ParamsSchema.safeParse(request.params);

      if (!parsed.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_ID" });
      }

      const { id } = parsed.data;

      // 1️⃣ Buscar documento para obtener el fileName del PDF (solo del tenant)
      const document = await prisma.document.findFirst({
        where: {
          id,
          tenantId: user.tenantId,
        },
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { pdfUrl: true },
          },
        },
      });

      if (!document) {
        return reply
          .status(404)
          .send({ ok: false, error: "DOCUMENT_NOT_FOUND" });
      }

      const fileName = document.versions[0]?.pdfUrl;

      if (!fileName) {
        return reply.status(404).send({ ok: false, error: "PDF_NOT_FOUND" });
      }

      app.log.info(`[api] Fetching PDF with fileName: ${fileName}`);

      // 2️⃣ Hacer proxy al PDF service
      try {
        const PDF_BASE = process.env.PDF_SERVICE_URL || "http://localhost:4100";
        const pdfUrl = `${PDF_BASE}/pdf/${encodeURIComponent(fileName)}`;
        app.log.info(`[api] PDF service URL: ${pdfUrl}`);
        const pdfResponse = await fetch(pdfUrl);

        if (!pdfResponse.ok) {
          return reply
            .status(pdfResponse.status)
            .send({ ok: false, error: "PDF_NOT_FOUND" });
        }

        // 3️⃣ Stream el PDF al cliente
        const arrayBuffer = await pdfResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        reply.header("Content-Type", "application/pdf");
        reply.header(
          "Content-Disposition",
          `attachment; filename="${fileName}"`,
        );
        return reply.send(buffer);
      } catch (err: any) {
        request.log?.error({ err }, "Error fetching PDF from service");
        return reply.status(500).send({ ok: false, message: "Internal error" });
      }
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return reply.status(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida",
        });
      }
      request.log?.error({ err }, "documents route error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });
}
