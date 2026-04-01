import { FastifyInstance } from "fastify";
import { GenerateDocumentSchema } from "./types.js";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getUserFromRequest, requireAuth } from "./utils/auth.js";
import bcrypt from "bcryptjs";
import { sanitizeObject } from "./utils/sanitize.js";
import { prisma } from "./db.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tipo para documentos con versión incluida (usado en GET /documents)
interface DocumentWithVersion {
  id: string;
  type: string | null;
  jurisdiccion: string | null;
  tono: string | null;
  estado: string | null;
  costUsd: number | null;
  tenantId: string;
  clientId: string | null;
  client: { id: string; name: string; type: string } | null;
  createdAt: Date;
  updatedAt: Date;
  versions: Array<{
    id: string;
    rawText: string;
    pdfUrl: string | null;
    status: string | null;
    outputWarnings: unknown;
    createdAt: Date;
  }>;
}

// Schema para query params de GET /documents
const DocumentsQuerySchema = z.object({
  query: z.string().optional(), // búsqueda de texto
  type: z.string().optional(),
  jurisdiccion: z.string().optional(),
  clientId: z.string().uuid().optional(), // filtrar por cliente
  expedienteId: z.string().uuid().optional(), // filtrar por expediente
  from: z.string().datetime().optional(), // ISO date
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["createdAt:asc", "createdAt:desc"]).default("createdAt:desc"),
});

export async function registerDocumentRoutes(app: FastifyInstance) {
  // ==========================================
  // GET /documents/stats - Totales por estado
  // IMPORTANTE: debe estar antes de /documents/:id
  // ==========================================
  app.get("/documents/stats", async (request, reply) => {
    try {
      const user = getUserFromRequest(request);
      if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
      if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

      const tenantId = user.tenantId;

      const now = new Date();
      const urgentCutoff = new Date(now.getTime() + 3 * 86_400_000); // now + 3 days
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Last 6 months window
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const [allDocs, allDocsWithMeta, totalClients, newClientsThisMonth, expedientesActivos, vencimientosUrgentes, expedientesByMateria, activeShares, totalAnalyses] = await Promise.all([
        prisma.document.findMany({
          where: { tenantId },
          select: {
            versions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { status: true },
            },
          },
        }),
        prisma.document.findMany({
          where: { tenantId },
          select: {
            type: true,
            createdAt: true,
          },
        }),
        // Only active (non-archived) clients
        prisma.client.count({ where: { tenantId, archivedAt: null } }),
        // New active clients created this calendar month
        prisma.client.count({ where: { tenantId, archivedAt: null, createdAt: { gte: startOfThisMonth } } }),
        // Active expedientes
        prisma.expediente.count({ where: { tenantId, status: "activo" } }),
        // Overdue + critical (deadline ≤ now+3d) active expedientes
        prisma.expediente.count({
          where: {
            tenantId,
            status: "activo",
            deadline: { not: null, lte: urgentCutoff },
          },
        }),
        // Expedientes grouped by matter type
        prisma.expediente.groupBy({
          by: ["matter"],
          where: { tenantId },
          _count: { matter: true },
          orderBy: { _count: { matter: "desc" } },
        }),
        // Active (non-expired, non-revoked) document shares
        prisma.documentShare.count({
          where: {
            tenantId,
            status: "active",
            expiresAt: { gt: now },
          },
        }),
        // Total contract analyses
        prisma.contractAnalysis.count({ where: { tenantId } }),
      ]);

      const byStatus: Record<string, number> = {
        generated: 0,
        needs_review: 0,
        draft: 0,
        reviewed: 0,
        final: 0,
      };

      for (const doc of allDocs) {
        const status = doc.versions[0]?.status ?? "draft";
        if (status in byStatus) {
          byStatus[status]++;
        } else {
          byStatus["draft"]++;
        }
      }

      // Documents by type
      const byType: Record<string, number> = {};
      for (const doc of allDocsWithMeta) {
        const t = doc.type || "other";
        byType[t] = (byType[t] ?? 0) + 1;
      }

      // Documents per month — last 6 months
      const monthMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = 0;
      }
      for (const doc of allDocsWithMeta) {
        const d = new Date(doc.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key in monthMap) monthMap[key]++;
      }
      const byMonth = Object.entries(monthMap).map(([month, count]) => ({ month, count }));

      // Documents created this calendar month
      const docsThisMonth = allDocsWithMeta.filter(
        (d) => new Date(d.createdAt) >= startOfThisMonth
      ).length;

      // Expedientes by matter as a plain record
      const byMateria: Record<string, number> = {};
      for (const row of expedientesByMateria) {
        byMateria[row.matter] = row._count.matter;
      }

      return reply.send({
        ok: true,
        total: allDocs.length,
        docsThisMonth,
        totalClients,
        newClientsThisMonth,
        byStatus,
        byType,
        byMonth,
        byMateria,
        expedientesActivos,
        vencimientosUrgentes,
        activeShares,
        totalAnalyses,
      });
    } catch (err) {
      request.log?.error({ err }, "documents/stats error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

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

      const { query, type, jurisdiccion, clientId, expedienteId, from, to, page, pageSize, sort } =
        queryParams.data;

      // Construir filtros
      const where: any = {};

      // Multi-tenant: solo documentos del tenant del usuario
      if (user) {
        if (!user.tenantId) {
          return reply.status(403).send({
            ok: false,
            error: "TENANT_REQUIRED",
            message: "El usuario no tiene un tenant asignado. Contactá al administrador.",
          });
        }
        where.tenantId = user.tenantId;
      } else {
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

      // Filtro por cliente
      if (clientId) {
        where.clientId = clientId;
      }

      // Filtro por expediente
      if (expedienteId) {
        where.expedienteId = expedienteId;
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
              status: true,
              outputWarnings: true,
              createdAt: true,
            },
          },
          client: {
            select: { id: true, name: true, type: true },
          },
          expediente: {
            select: { id: true, title: true, number: true, matter: true, status: true },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      });

      return reply.send({
        ok: true,
        items: documents.map((doc: DocumentWithVersion) => ({
          id: doc.id,
          type: doc.type,
          jurisdiccion: doc.jurisdiccion,
          tono: doc.tono,
          estado: doc.estado,
          costUsd: doc.costUsd,
          tenantId: doc.tenantId,
          clientId: doc.clientId ?? null,
          client: doc.client ?? null,
          expedienteId: (doc as any).expedienteId ?? null,
          expediente: (doc as any).expediente ?? null,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
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
      // 1️⃣ Normalizar request (acepta nuevo formato DTO o formato antiguo)
      const { normalizeDocumentRequest } = await import("./modules/documents/services/document-mapper.js");
      const normalized = await normalizeDocumentRequest(request.body);
      
      if (!normalized.success) {
        return reply.status(400).send({
          ok: false,
          error: "invalid_body",
          message: normalized.error,
        });
      }

      const { documentType, jurisdiction, tone, structuredData } = normalized;

      // 1.5️⃣ Sanitizar inputs para prevenir XSS
      const sanitizedData = sanitizeObject(structuredData, false) as typeof structuredData;

      // 1.6️⃣ Extraer referenceDocumentId y expedienteId (opcionales) del body original
      const rawBody = request.body as Record<string, unknown>;
      const referenceDocumentId: string | null =
        typeof rawBody?.referenceDocumentId === "string" && rawBody.referenceDocumentId.trim()
          ? rawBody.referenceDocumentId.trim()
          : null;
      const incomingExpedienteId: string | null =
        typeof rawBody?.expedienteId === "string" && rawBody.expedienteId.trim()
          ? rawBody.expedienteId.trim()
          : null;

      // 2️⃣ Autenticación — requerida en producción, fallback demo solo en dev/test
      const user = getUserFromRequest(request);

      if (!user && process.env.NODE_ENV === "production") {
        return reply.status(401).send({
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida para generar documentos",
        });
      }

      // Si el usuario está autenticado pero no tiene tenant asignado, es un error
      // de configuración de cuenta — no usar demo-tenant como fallback silencioso.
      if (user && !user.tenantId) {
        return reply.status(403).send({
          ok: false,
          error: "TENANT_REQUIRED",
          message: "El usuario no tiene un tenant asignado. Contactá al administrador.",
        });
      }

      const tenantId = user?.tenantId || "demo-tenant";
      const userId   = user?.userId   || "demo-user";

      // 2.5️⃣ Enforcement de límites del plan
      if (tenantId !== "demo-tenant") {
        const { getPlanForTenant } = await import("./routes.billing.js");
        const { plan } = await getPlanForTenant(tenantId);
        const limits = (plan as any)?.limits ?? { docsPerMonth: 5 };

        // Verificar límite de documentos por mes
        const docsPerMonth: number = limits.docsPerMonth ?? 5;
        if (docsPerMonth !== -1) {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          const docsThisMonth = await prisma.document.count({
            where: { tenantId, createdAt: { gte: startOfMonth, lte: endOfMonth } },
          });
          if (docsThisMonth >= docsPerMonth) {
            return reply.status(429).send({
              ok: false,
              error: "PLAN_LIMIT_EXCEEDED",
              message: `Alcanzaste el límite de ${docsPerMonth} documentos este mes. Actualizá tu plan para continuar.`,
              limit: docsPerMonth,
              used: docsThisMonth,
            });
          }
        }

        // Todos los tipos de documento están disponibles en todos los planes
      }

      // 2.7️⃣ Cargar texto del documento de referencia (si se proporcionó)
      let referenceText: string | null = null;
      let resolvedReferenceDocumentId: string | null = null;

      // 2.8️⃣ Validar expedienteId (si se proporcionó)
      let resolvedExpedienteId: string | null = null;
      if (incomingExpedienteId && user?.tenantId) {
        const expDoc = await prisma.expediente.findFirst({
          where: { id: incomingExpedienteId, tenantId: user.tenantId },
          select: { id: true },
        });
        if (expDoc) resolvedExpedienteId = expDoc.id;
      }

      if (referenceDocumentId && user?.tenantId) {
        const refDoc = await prisma.referenceDocument.findFirst({
          where: {
            id: referenceDocumentId,
            tenantId: user.tenantId,
            deletedAt: null,
          },
          select: { id: true, pdfText: true, originalName: true, documentType: true },
        });

        if (refDoc && refDoc.pdfText) {
          referenceText = refDoc.pdfText;
          resolvedReferenceDocumentId = refDoc.id;
          app.log.info(
            `[api] Using reference document "${refDoc.originalName}" (${refDoc.documentType}) for generation`
          );
        } else if (referenceDocumentId) {
          app.log.warn(`[api] Reference document ${referenceDocumentId} not found or has no text — proceeding without reference`);
        }
      }

      // 3️⃣ Generar documento con nueva arquitectura
      const { generateDocumentWithNewArchitecture } = await import("./modules/documents/services/generation-service.js");

      app.log.info(`[api] Generating ${documentType} document with new architecture`);

      const generationResult = await generateDocumentWithNewArchitecture(
        documentType,
        sanitizedData,
        tone,
        referenceText
      );

      const contrato = generationResult.aiEnhancedDraft;

      // 3.5️⃣ Validación post-generación: placeholders, instrucciones meta, contenido incompleto
      const { validateGeneratedDocumentOutput } = await import("./modules/documents/domain/output-validator.js");
      const outputValidation = validateGeneratedDocumentOutput(contrato, documentType);
      const hasOutputErrors = !outputValidation.valid;

      if (hasOutputErrors) {
        app.log.warn(
          { documentType, issueCount: outputValidation.issues.length, issues: outputValidation.issues },
          "[api] Post-generation validation: document has placeholders or incomplete content — PDF will be skipped"
        );
      }

      // 4️⃣ Guardar documento y versión en la base con nueva estructura
      const { documentRecord, versionRecord } = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
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
            // Modo demo - solo para desarrollo/testing
            // En producción, siempre debe haber un usuario autenticado
            const demoPasswordHash = await bcrypt.hash("dev-placeholder", 10);
            finalUser = await tx.user.upsert({
              where: { id: userId },
              update: {},
              create: {
                id: userId,
                email: "demo@example.com",
                passwordHash: demoPasswordHash,
                role: "owner",
                tenantId: tenant.id,
              },
            });
          }

          // Mapear documentType a formato antiguo para compatibilidad
          // Maps canonical type IDs to the legacy Spanish slugs stored in the DB.
          // New types (debt_recognition, simple_authorization) have no legacy alias —
          // they are stored as their canonical English name (|| documentType fallback).
          const typeMap: Record<string, string> = {
            service_contract:     "contrato_servicios",
            supply_contract:      "contrato_suministro",  // legacy — no template
            nda:                  "nda",
            legal_notice:         "carta_documento",
            lease:                "contrato_locacion",
            debt_recognition:     "debt_recognition",     // stored as-is (no legacy alias)
            simple_authorization: "simple_authorization", // stored as-is (no legacy alias)
          };
          
          const oldType = typeMap[documentType] || documentType;
          
          // Mapear tone a formato antiguo
          const toneMap: Record<string, string> = {
            formal_technical: "formal",
            commercial_clear: "comercial_claro",
            balanced_professional: "comercial_claro",
          };
          
          const oldTone = toneMap[tone] || tone;

          // Creamos el documento
          const documentData: Record<string, unknown> = {
            tenantId: tenant.id,
            createdById: finalUser.id,
            type: oldType, // Mantener formato antiguo en DB por compatibilidad
            jurisdiccion: jurisdiction,
            tono: oldTone, // Mantener formato antiguo en DB por compatibilidad
            estado: "generated_text",
            costUsd: generationResult.metadata.aiTokens
              ? (generationResult.metadata.aiTokens.prompt + generationResult.metadata.aiTokens.completion) * 0.000001
              : 0,
            ...(resolvedReferenceDocumentId ? { referenceDocumentId: resolvedReferenceDocumentId } : {}),
            ...(resolvedExpedienteId ? { expedienteId: resolvedExpedienteId } : {}),
          };
          
          request.log?.info({ documentData }, "Intentando crear documento con datos:");
          
          const doc = await tx.document.create({
            data: documentData as any,
          });

          // Creamos la versión inicial con nueva estructura
          const ver = await tx.documentVersion.create({
            data: {
              documentId: doc.id,
              versionNumber: 1,
              rawText: contrato,
              generatedBy: generationResult.metadata.aiModel || "gpt-4o-mini",
              // Nuevos campos estructurados
              structuredData: generationResult.structuredData as any,
              clausePlan: generationResult.clausePlan as any,
              generationWarnings: generationResult.warnings as any,
              outputWarnings: outputValidation.issues.length > 0
                ? outputValidation.issues as any
                : null,
              templateVersion: generationResult.metadata.templateVersion,
              // "needs_review" when post-generation validation detected placeholders
              // or incomplete content — signals the document needs human review
              // before being treated as final.
              status: hasOutputErrors ? "needs_review" : "generated",
            },
          });

          return { documentRecord: doc, versionRecord: ver };
        },
      );

      // 6️⃣ Definir fileName único basado en versionId
      const fileName = `${versionRecord.id}.pdf`;
      app.log.info(`[api] Generating PDF with fileName: ${fileName}`);

      // 7️⃣ Llamar microservicio PDF — solo si el documento pasó la validación de output.
      // Si hasOutputErrors=true, el documento tiene placeholders o contenido incompleto:
      // se omite el PDF para no exportar un documento jurídicamente inválido.
      let pdfGenerated = false;

      if (hasOutputErrors) {
        app.log.info("[api] Skipping PDF generation — document marked as needs_review due to output validation failures");
      } else {
        try {
          const pdfServiceUrl =
            process.env.PDF_SERVICE_URL || "http://localhost:4100";
          
          app.log.info(`[api] Calling PDF service at: ${pdfServiceUrl}/pdf/generate`);
          app.log.info(`[api] PDF generation params: title=${documentType}, fileName=${fileName}, textLength=${contrato.length}`);
          
          const pdfResponse = await fetch(`${pdfServiceUrl}/pdf/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: documentType.toUpperCase(),
              rawText: contrato,
              fileName: fileName,
            }),
          });

          app.log.info(`[api] PDF service response status: ${pdfResponse.status}`);
          
          if (pdfResponse.ok) {
            const pdfJson = await pdfResponse.json();
            app.log.info({ pdfJson }, `[api] PDF service response`);
            if (pdfJson.ok && pdfJson.fileName === fileName) {
              pdfGenerated = true;
              app.log.info(`[api] PDF generated successfully: ${fileName}`);
            } else {
              app.log.warn({ pdfJson }, `[api] PDF generation response invalid`);
            }
          } else {
            const errorText = await pdfResponse.text().catch(() => "Could not read error");
            app.log.error({ status: pdfResponse.status, errorText }, `[api] PDF service error`);
          }
        } catch (err) {
          app.log.error(err, "Error al llamar al pdf-service");
          app.log.error(`[api] PDF service URL was: ${process.env.PDF_SERVICE_URL || "http://localhost:4100"}`);
        }
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
        // Pre-generation warnings (business rules on form data)
        warnings: generationResult.warnings,
        // Post-generation validation: placeholders, incomplete content, etc.
        // incompleteDocument=true means the PDF was NOT generated and the document
        // needs manual review before it can be considered final.
        incompleteDocument: hasOutputErrors,
        outputWarnings: outputValidation.issues,
        metadata: {
          documentType,
          templateVersion: generationResult.metadata.templateVersion,
          generationTimestamp: generationResult.metadata.generationTimestamp,
        },
      });
    } catch (err: any) {
      request.log?.error({ err }, "documents route error");
      
      // Handle validation errors (should return 400, not 500)
      if (err.statusCode === 400 || err.message?.includes("Validation failed") || err.validationErrors) {
        return reply.status(400).send({
          ok: false,
          message: err.message || "Validation failed",
          error: "validation_error",
          details: err.validationErrors || (err.message ? [err.message] : []),
        });
      }
      
      // Log detallado del error de Prisma
      if (err.code === "P2022" || err.message?.includes("P2022")) {
        request.log?.error({
          code: err.code,
          meta: err.meta,
          message: err.message,
        }, "Prisma P2022: Columna no existe en la tabla");
      }
      
      // Mensajes de error más descriptivos
      let errorMessage = "Error al generar el documento";
      let statusCode = 500;
      
      if (err instanceof z.ZodError) {
        errorMessage = "Datos inválidos: " + err.errors.map((e: any) => e.message).join(", ");
        statusCode = 400;
      } else if (err.message?.includes("OPENAI") || err.message?.includes("API key") || err.message?.includes("apiKey")) {
        errorMessage = "Error de configuración: La clave de API de OpenAI no está configurada o es inválida";
      } else if (err.code === "P2022" || err.message?.includes("P2022")) {
        const columnName = err.meta?.column || "desconocida";
        errorMessage = `Error de base de datos: La columna "${columnName}" no existe en la tabla. Es necesario ejecutar migraciones.`;
        request.log?.error({ columnName, meta: err.meta }, "Columna faltante detectada");
      } else if (err.message?.includes("Prisma") || err.message?.includes("database") || err.message?.includes("P2002")) {
        errorMessage = "Error de base de datos: No se pudo guardar el documento";
      } else if (err.message?.includes("Tenant") || err.message?.includes("Usuario")) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      return reply.status(statusCode).send({ 
        ok: false, 
        message: errorMessage,
        error: err.message || "INTERNAL_ERROR",
        code: err.code,
        meta: process.env.NODE_ENV === "development" ? err.meta : undefined,
      });
    }
  });

  // ==========================================
  // POST /documents/:id/duplicate
  // ==========================================
  app.post("/documents/:id/duplicate", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED", message: "El usuario no tiene un tenant asignado. Contactá al administrador." });
      }

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
          tenantId: user.tenantId!, // Verificar tenant
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
      const duplicated = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Crear nuevo documento
          const newDoc = await tx.document.create({
            data: {
              tenantId: user.tenantId!,
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
        },
      );

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
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED", message: "El usuario no tiene un tenant asignado. Contactá al administrador." });
      }

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
          tenantId: user.tenantId!,
        },
      });

      if (!document) {
        return reply.status(404).send({
          ok: false,
          error: "DOCUMENT_NOT_FOUND",
        });
      }

      // Verificar RBAC: admin/owner puede eliminar cualquier documento del tenant;
      // usuarios normales solo pueden eliminar sus propios documentos
      const isAdminOrOwner = user.role === "admin" || user.role === "owner";
      const isCreator = document.createdById === user.userId;
      if (!isAdminOrOwner && !isCreator) {
        return reply.status(403).send({
          ok: false,
          error: "FORBIDDEN",
          message: "No tienes permiso para eliminar este documento",
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
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED", message: "El usuario no tiene un tenant asignado. Contactá al administrador." });
      }

      const ParamsSchema = z.object({ id: z.string().uuid() });
      const BodySchema = z.object({
        type: z.string().optional(),
        jurisdiccion: z.string().optional(),
        tono: z.string().optional(),
        clientId: z.string().uuid().nullable().optional(),
        expedienteId: z.string().uuid().nullable().optional(),
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
          tenantId: user.tenantId!,
        },
      });

      if (!document) {
        return reply.status(404).send({
          ok: false,
          error: "DOCUMENT_NOT_FOUND",
        });
      }

      // Si se envía clientId, verificar que el cliente pertenece al mismo tenant
      if (updateData.clientId) {
        const client = await prisma.client.findFirst({
          where: { id: updateData.clientId, tenantId: user.tenantId! },
        });
        if (!client) {
          return reply.status(404).send({ ok: false, error: "CLIENT_NOT_FOUND" });
        }
      }

      // Si se envía expedienteId, verificar que el expediente pertenece al mismo tenant
      if (updateData.expedienteId) {
        const expediente = await prisma.expediente.findFirst({
          where: { id: updateData.expedienteId, tenantId: user.tenantId! },
        });
        if (!expediente) {
          return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });
        }
      }

      // Actualizar
      const updated = await prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          client: { select: { id: true, name: true, type: true } },
          expediente: { select: { id: true, title: true, number: true, matter: true, status: true } },
        },
      });

      return reply.status(200).send({
        ok: true,
        message: "Documento actualizado exitosamente",
        data: {
          id: updated.id,
          type: updated.type,
          jurisdiccion: updated.jurisdiccion,
          tono: updated.tono,
          clientId: (updated as any).clientId ?? null,
          client: (updated as any).client ?? null,
          expedienteId: (updated as any).expedienteId ?? null,
          expediente: (updated as any).expediente ?? null,
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
  // PATCH /documents/:id/content — Guardar edición manual
  // ==========================================
  app.patch("/documents/:id/content", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED", message: "El usuario no tiene un tenant asignado." });
      }

      const ParamsSchema = z.object({ id: z.string().uuid() });
      const BodySchema = z.object({
        content: z.string().min(1, "El contenido no puede estar vacío").max(500_000, "El contenido supera el límite de 500.000 caracteres"),
      });

      const paramsParsed = ParamsSchema.safeParse(request.params);
      const bodyParsed = BodySchema.safeParse(request.body);

      if (!paramsParsed.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_ID" });
      }
      if (!bodyParsed.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_BODY", details: bodyParsed.error.format() });
      }

      const { id } = paramsParsed.data;
      const { content } = bodyParsed.data;

      // Verificar que el documento existe y pertenece al tenant
      const document = await prisma.document.findFirst({
        where: { id, tenantId: user.tenantId! },
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, rawText: true },
          },
        },
      });

      if (!document) {
        return reply.status(404).send({ ok: false, error: "DOCUMENT_NOT_FOUND" });
      }

      // RBAC: admin/owner puede editar cualquier documento del tenant; el creador puede editar el suyo
      const isAdminOrOwner = user.role === "admin" || user.role === "owner";
      const isCreator = document.createdById === user.userId;
      if (!isAdminOrOwner && !isCreator) {
        return reply.status(403).send({ ok: false, error: "FORBIDDEN", message: "No tienes permiso para editar este documento" });
      }

      const latestVersion = document.versions[0];
      if (!latestVersion) {
        return reply.status(404).send({ ok: false, error: "VERSION_NOT_FOUND", message: "El documento no tiene versiones generadas" });
      }

      // Sanitizar contenido (remover caracteres de control excepto newlines/tabs)
      const sanitizedContent = sanitizeObject({ content }, false) as { content: string };

      // Actualizar editedContent e invalidar PDF previo (forzar regeneración con contenido nuevo)
      await prisma.documentVersion.update({
        where: { id: latestVersion.id },
        data: {
          editedContent: sanitizedContent.content,
          pdfUrl: null, // Invalida el PDF previo; se regenerará desde editedContent al descargar
        },
      });

      return reply.status(200).send({
        ok: true,
        message: "Contenido guardado exitosamente",
        versionId: latestVersion.id,
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return reply.status(401).send({ ok: false, error: "UNAUTHORIZED", message: "Autenticación requerida" });
      }
      request.log?.error({ err }, "PATCH /documents/:id/content error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // PATCH /documents/:id/review-status — Cambiar estado de revisión del workflow
  // Estados válidos: generated → reviewed → final (y vuelta atrás si es necesario)
  // ==========================================
  app.patch("/documents/:id/review-status", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const ParamsSchema = z.object({ id: z.string().uuid() });
      const BodySchema = z.object({
        status: z.enum(["draft", "generated", "needs_review", "reviewed", "final"]),
      });

      const paramsParsed = ParamsSchema.safeParse(request.params);
      const bodyParsed   = BodySchema.safeParse(request.body);

      if (!paramsParsed.success) return reply.status(400).send({ ok: false, error: "INVALID_ID" });
      if (!bodyParsed.success)   return reply.status(400).send({ ok: false, error: "INVALID_BODY" });

      const { id }     = paramsParsed.data;
      const { status } = bodyParsed.data;

      // Verificar que el documento pertenece al tenant
      const document = await prisma.document.findFirst({
        where: { id, tenantId: user.tenantId! },
        include: {
          versions: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true } },
        },
      });

      if (!document) return reply.status(404).send({ ok: false, error: "DOCUMENT_NOT_FOUND" });

      const latestVersion = document.versions[0];
      if (!latestVersion) return reply.status(404).send({ ok: false, error: "VERSION_NOT_FOUND" });

      await prisma.documentVersion.update({
        where: { id: latestVersion.id },
        data:  { status },
      });

      return reply.send({ ok: true, versionId: latestVersion.id, status });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
      }
      request.log?.error({ err }, "PATCH /documents/:id/review-status error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // GET /documents/:id/annotations
  // POST /documents/:id/annotations
  // PATCH /documents/:id/annotations/:annotationId
  // DELETE /documents/:id/annotations/:annotationId
  // ==========================================
  const annotationDocIdSchema = z.object({ id: z.string().uuid() });

  // GET — list all annotations for a document
  app.get("/documents/:id/annotations", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const parsed = annotationDocIdSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ ok: false, error: "INVALID_ID" });

    try {
      const doc = await prisma.document.findFirst({
        where: { id: parsed.data.id, tenantId: user.tenantId! },
        select: { id: true },
      });
      if (!doc) return reply.status(404).send({ ok: false, error: "DOCUMENT_NOT_FOUND" });

      const annotations = await (prisma as any).documentAnnotation.findMany({
        where: { documentId: parsed.data.id, tenantId: user.tenantId },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      return reply.send({ ok: true, annotations });
    } catch (err) {
      request.log?.error({ err }, "GET /documents/:id/annotations error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // POST — create annotation
  app.post("/documents/:id/annotations", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const parsed = annotationDocIdSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ ok: false, error: "INVALID_ID" });

    const bodySchema = z.object({ content: z.string().min(1).max(2000) });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ ok: false, error: "INVALID_BODY" });

    try {
      const doc = await prisma.document.findFirst({
        where: { id: parsed.data.id, tenantId: user.tenantId! },
        select: { id: true },
      });
      if (!doc) return reply.status(404).send({ ok: false, error: "DOCUMENT_NOT_FOUND" });

      const annotation = await (prisma as any).documentAnnotation.create({
        data: {
          documentId: parsed.data.id,
          tenantId:   user.tenantId,
          authorId:   user.userId ?? null,
          content:    body.data.content,
        },
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      return reply.status(201).send({ ok: true, annotation });
    } catch (err) {
      request.log?.error({ err }, "POST /documents/:id/annotations error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // PATCH — resolve/unresolve or edit annotation
  app.patch("/documents/:id/annotations/:annotationId", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const paramsSchema = z.object({ id: z.string().uuid(), annotationId: z.string().uuid() });
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ ok: false, error: "INVALID_PARAMS" });

    const bodySchema = z.object({
      content:  z.string().min(1).max(2000).optional(),
      resolved: z.boolean().optional(),
    });
    const body = bodySchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ ok: false, error: "INVALID_BODY" });

    try {
      const existing = await (prisma as any).documentAnnotation.findFirst({
        where: { id: parsed.data.annotationId, documentId: parsed.data.id, tenantId: user.tenantId },
      });
      if (!existing) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

      const updated = await (prisma as any).documentAnnotation.update({
        where: { id: parsed.data.annotationId },
        data:  body.data,
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      return reply.send({ ok: true, annotation: updated });
    } catch (err) {
      request.log?.error({ err }, "PATCH /documents/:id/annotations/:id error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // DELETE annotation
  app.delete("/documents/:id/annotations/:annotationId", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const paramsSchema = z.object({ id: z.string().uuid(), annotationId: z.string().uuid() });
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ ok: false, error: "INVALID_PARAMS" });

    try {
      const existing = await (prisma as any).documentAnnotation.findFirst({
        where: { id: parsed.data.annotationId, documentId: parsed.data.id, tenantId: user.tenantId },
      });
      if (!existing) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

      await (prisma as any).documentAnnotation.delete({ where: { id: parsed.data.annotationId } });
      return reply.send({ ok: true });
    } catch (err) {
      request.log?.error({ err }, "DELETE /documents/:id/annotations/:id error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // GET /documents/:id
  // ==========================================
  app.get("/documents/:id", async (request, reply) => {
    // Auth required — no unauthenticated access to document details
    const user = getUserFromRequest(request);
    if (!user) {
      return reply.status(401).send({
        ok: false,
        error: "UNAUTHORIZED",
        message: "Autenticación requerida",
      });
    }
    if (!user.tenantId) {
      return reply.status(403).send({
        ok: false,
        error: "TENANT_REQUIRED",
        message: "El usuario no tiene un tenant asignado. Contactá al administrador.",
      });
    }

    const ParamsSchema = z.object({ id: z.string().uuid() });
    const parsed = ParamsSchema.safeParse(request.params);

    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_ID" });
    }

    const { id } = parsed.data;

    try {
      // Tenant-scoped lookup: using findFirst with tenantId ensures a document
      // belonging to a different tenant returns 404 (not 403) — this deliberately
      // avoids leaking whether a document UUID exists in another tenant.
      const document = await prisma.document.findFirst({
        where: { id, tenantId: user.tenantId! },
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              rawText: true,
              editedContent: true,
              pdfUrl: true,
              status: true,
              outputWarnings: true,
              createdAt: true,
            },
          },
          client: {
            select: { id: true, name: true, type: true },
          },
          expediente: {
            select: { id: true, title: true, number: true, matter: true, status: true },
          },
        },
      });

      if (!document) {
        return reply.status(404).send({ ok: false, error: "DOCUMENT_NOT_FOUND" });
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
          tenantId: document.tenantId,
          clientId: (document as any).clientId ?? null,
          client: (document as any).client ?? null,
          expedienteId: (document as any).expedienteId ?? null,
          expediente: (document as any).expediente ?? null,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
          lastVersion,
        },
      });
    } catch (err: any) {
      request.log?.error({ err }, "GET /documents/:id error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // GET /documents/:id/versions — full version history
  // ==========================================
  app.get("/documents/:id/versions", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const ParamsSchema = z.object({ id: z.string().uuid() });
    const parsed = ParamsSchema.safeParse(request.params);
    if (!parsed.success) return reply.status(400).send({ ok: false, error: "INVALID_ID" });

    try {
      const doc = await prisma.document.findFirst({
        where: { id: parsed.data.id, tenantId: user.tenantId! },
        select: { id: true },
      });

      if (!doc) return reply.status(404).send({ ok: false, error: "DOCUMENT_NOT_FOUND" });

      const versions = await prisma.documentVersion.findMany({
        where: { documentId: parsed.data.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          rawText: true,
          editedContent: true,
          pdfUrl: true,
          createdAt: true,
        },
      });

      return reply.send({ ok: true, versions });
    } catch (err) {
      request.log?.error({ err }, "GET /documents/:id/versions error");
      return reply.status(500).send({ ok: false, message: "Internal error" });
    }
  });

  // ==========================================
  // GET /documents/:id/pdf
  // ==========================================
  app.get("/documents/:id/pdf", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED", message: "El usuario no tiene un tenant asignado. Contactá al administrador." });
      }

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
          tenantId: user.tenantId!,
        },
        include: {
          versions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { 
              id: true,
              pdfUrl: true,
              rawText: true,
              editedContent: true,
            },
          },
        },
      });

      if (!document) {
        return reply
          .status(404)
          .send({ ok: false, error: "DOCUMENT_NOT_FOUND" });
      }

      const version = document.versions[0];
      let fileName = version?.pdfUrl;

      // Usar editedContent si existe, de lo contrario rawText
      const contentForPdf = version?.editedContent ?? version?.rawText;

      // Si no hay PDF, intentar regenerarlo automáticamente
      if (!fileName || !contentForPdf) {
        app.log.info(`[api] PDF not found for document ${id}, attempting to regenerate...`);
        
        if (!contentForPdf) {
          return reply.status(404).send({ 
            ok: false, 
            error: "PDF_NOT_FOUND",
            message: "El documento no tiene contenido para generar el PDF" 
          });
        }

        // Regenerar PDF
        const versionId = version.id;
        fileName = `${versionId}.pdf`;
        
        try {
          const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";
          app.log.info(`[api] Regenerating PDF at: ${pdfServiceUrl}/pdf/generate`);
          
          const pdfResponse = await fetch(`${pdfServiceUrl}/pdf/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: document.type.toUpperCase(),
              rawText: contentForPdf,
              fileName: fileName,
            }),
          });

          if (pdfResponse.ok) {
            const pdfJson = await pdfResponse.json();
            if (pdfJson.ok && pdfJson.fileName === fileName) {
              // Guardar el fileName en la base de datos
              await prisma.documentVersion.update({
                where: { id: versionId },
                data: { pdfUrl: fileName },
              });
              app.log.info(`[api] PDF regenerated successfully: ${fileName}`);
            } else {
              app.log.warn({ pdfJson }, `[api] PDF regeneration response invalid`);
              return reply.status(500).send({ 
                ok: false, 
                error: "PDF_GENERATION_FAILED",
                message: "No se pudo regenerar el PDF" 
              });
            }
          } else {
            const errorText = await pdfResponse.text().catch(() => "Could not read error");
            app.log.error({ status: pdfResponse.status, errorText }, `[api] PDF regeneration error`);
            return reply.status(500).send({ 
              ok: false, 
              error: "PDF_GENERATION_FAILED",
              message: "Error al regenerar el PDF" 
            });
          }
        } catch (err) {
          app.log.error(err, "Error al regenerar PDF");
          return reply.status(500).send({ 
            ok: false, 
            error: "PDF_GENERATION_FAILED",
            message: "Error al conectar con el servicio de PDF" 
          });
        }
      }

      app.log.info(`[api] Fetching PDF with fileName: ${fileName}`);

      // 2️⃣ Hacer proxy al PDF service
      try {
        const PDF_BASE = process.env.PDF_SERVICE_URL || "http://localhost:4100";
        const pdfUrl = `${PDF_BASE}/pdf/${encodeURIComponent(fileName)}`;
        app.log.info(`[api] PDF service URL: ${pdfUrl}`);
        const pdfResponse = await fetch(pdfUrl);

        // Si el PDF no existe en el servicio, regenerarlo automáticamente
        if (pdfResponse.status === 404) {
          app.log.warn(`[api] PDF not found in service, attempting to regenerate...`);
          
          const contentForRegen = version?.editedContent ?? version?.rawText;
          if (!contentForRegen) {
            return reply.status(404).send({ 
              ok: false, 
              error: "PDF_NOT_FOUND",
              message: "El documento no tiene contenido para generar el PDF" 
            });
          }

          // Regenerar PDF
          const versionId = version.id;
          const regenerateFileName = `${versionId}.pdf`;
          
          try {
            app.log.info(`[api] Regenerating PDF at: ${PDF_BASE}/pdf/generate`);
            
            const regenerateResponse = await fetch(`${PDF_BASE}/pdf/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: document.type.toUpperCase(),
                rawText: contentForRegen,
                fileName: regenerateFileName,
              }),
            });

            if (regenerateResponse.ok) {
              const regenerateJson = await regenerateResponse.json();
              if (regenerateJson.ok && regenerateJson.fileName === regenerateFileName) {
                // Guardar el fileName en la base de datos si cambió
                if (fileName !== regenerateFileName) {
                  await prisma.documentVersion.update({
                    where: { id: versionId },
                    data: { pdfUrl: regenerateFileName },
                  });
                }
                app.log.info(`[api] PDF regenerated successfully: ${regenerateFileName}`);
                
                // Intentar obtener el PDF regenerado
                const newPdfUrl = `${PDF_BASE}/pdf/${encodeURIComponent(regenerateFileName)}`;
                const newPdfResponse = await fetch(newPdfUrl);
                
                if (newPdfResponse.ok) {
                  const arrayBuffer = await newPdfResponse.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);

                  reply.header("Content-Type", "application/pdf");
                  reply.header(
                    "Content-Disposition",
                    `attachment; filename="${regenerateFileName}"`,
                  );
                  return reply.send(buffer);
                } else {
                  app.log.error(`[api] Failed to fetch regenerated PDF: ${newPdfResponse.status}`);
                }
              } else {
                app.log.warn({ regenerateJson }, `[api] PDF regeneration response invalid`);
              }
            } else {
              const errorText = await regenerateResponse.text().catch(() => "Could not read error");
              app.log.error({ status: regenerateResponse.status, errorText }, `[api] PDF regeneration error`);
            }
          } catch (regenerateErr) {
            app.log.error(regenerateErr, "Error al regenerar PDF");
          }
          
          // Si llegamos aquí, la regeneración falló, devolver error
          return reply.status(404).send({ 
            ok: false, 
            error: "PDF_NOT_FOUND",
            message: "No se pudo generar el PDF" 
          });
        }

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
