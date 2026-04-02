/**
 * Contract Analysis Routes — Análisis de contratos con IA (Claude)
 *
 * POST /analysis/upload   — sube un PDF y lo analiza con Claude
 * GET  /analysis          — lista los análisis del tenant
 * GET  /analysis/:id      — obtiene un análisis completo
 * DELETE /analysis/:id    — elimina un análisis
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { extractTextFromPdf } from "./modules/documents/services/pdf-extractor.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  summary: string;
  contractType: string;
  parties: string[];
  keyDates: Array<{ label: string; date: string }>;
  mainObligations: string[];
  riskyClausesMain: Array<{
    title: string;
    text: string;
    risk: "Alta" | "Media" | "Baja";
    explanation: string;
    recommendation: string;
  }>;
  missingClauses: Array<{
    title: string;
    importance: "Alta" | "Media" | "Baja";
    explanation: string;
  }>;
  generalRecommendations: string[];
  overallRisk: "low" | "medium" | "high";
}

// ─── Claude prompt ────────────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `Sos un abogado experto en análisis de contratos en Argentina.
Tu tarea es analizar el contrato que te provean y devolver un análisis detallado y útil en formato JSON.

CRITERIOS OBJETIVOS PARA CLÁUSULAS RIESGOSAS — solo marcá como riesgosa una cláusula si cumple AL MENOS UNO de estos criterios concretos:
- Renuncia a derechos irrenunciables por ley (ej: renuncia a indemnización laboral, renuncia a cobrar salarios)
- Penalidades desproporcionadas (más del 30% del valor del contrato por incumplimiento menor)
- Plazos de prescripción o caducidad más cortos que los legales (art. 2560 y ss. CCCN)
- Jurisdicción exclusiva en provincia distinta al domicilio del adherente
- Cláusulas de renovación automática sin preaviso razonable (menos de 30 días)
- Indemnizaciones unilaterales (solo una parte paga si rescinde, la otra no)
- Cláusulas de variación unilateral de precio sin límite ni notificación
- Exclusión total de responsabilidad por daños (contraria al art. 1743 CCCN)
- Cesión de derechos sin consentimiento de la otra parte
- Mora automática con tasas superiores al 3% diario
- Confusión de roles o doble representación sin consentimiento informado

IMPORTANTE:
- Respondé ÚNICAMENTE con el objeto JSON, sin texto adicional, sin markdown, sin explicaciones.
- El JSON debe ser válido y parseable.
- Si algún campo no aplica, usá un array vacío o string vacío, NUNCA null.
- Usá lenguaje claro y profesional en español rioplatense.
- Sé CONSISTENTE: los mismos hechos objetivos siempre deben producir el mismo resultado.`;

function buildAnalysisPrompt(pdfText: string): string {
  const truncated = pdfText.length > 15000
    ? pdfText.slice(0, 15000) + "\n\n[... texto truncado por longitud ...]"
    : pdfText;

  return `Analizá el siguiente contrato y devolvé un objeto JSON con exactamente esta estructura:

{
  "summary": "Resumen ejecutivo del contrato (2-4 oraciones)",
  "contractType": "Tipo de contrato identificado (ej: Contrato de Locación, Contrato de Servicios, etc.)",
  "parties": ["Parte A (rol)", "Parte B (rol)"],
  "keyDates": [
    { "label": "Fecha de inicio", "date": "DD/MM/AAAA o descripción si no hay fecha específica" }
  ],
  "mainObligations": [
    "Obligación principal 1",
    "Obligación principal 2"
  ],
  "riskyClausesMain": [
    {
      "title": "Nombre de la cláusula",
      "text": "Fragmento textual de la cláusula o descripción de su contenido",
      "risk": "Alta",
      "explanation": "Por qué esta cláusula representa un riesgo",
      "recommendation": "Qué se debería cambiar o negociar"
    }
  ],
  "missingClauses": [
    {
      "title": "Nombre de la cláusula faltante",
      "importance": "Alta",
      "explanation": "Por qué esta cláusula es importante y debería incluirse"
    }
  ],
  "generalRecommendations": [
    "Recomendación general 1",
    "Recomendación general 2"
  ],
  "overallRisk": "low"
}

Notas:
- "overallRisk" debe ser exactamente "low", "medium" o "high"
- "risk" e "importance" deben ser exactamente "Alta", "Media" o "Baja"
- Si no encontrás cláusulas riesgosas, devolvé un array vacío en "riskyClausesMain"
- Si no faltan cláusulas importantes, devolvé un array vacío en "missingClauses"
- Sé específico y accionable, no genérico

CONTRATO A ANALIZAR:
---
${truncated}
---

Respondé SOLO con el JSON, sin texto adicional.`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerAnalysisRoutes(app: FastifyInstance) {

  // ── POST /analysis/upload ─────────────────────────────────────────────────
  app.post("/analysis/upload", async (request, reply) => {
    let analysisId: string | null = null;

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

      const buffer = await data.toBuffer();
      if (buffer.length > 10 * 1024 * 1024) {
        return reply.status(400).send({ ok: false, error: "FILE_TOO_LARGE", message: "El archivo no puede superar 10 MB" });
      }

      const originalName = data.filename as string;
      const id = randomUUID();
      const fileName = `analysis-${id}.pdf`;
      const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";

      // 1. Extraer texto
      const pdfText = await extractTextFromPdf(buffer);
      if (!pdfText || pdfText.trim().length < 50) {
        return reply.status(400).send({
          ok: false,
          error: "TEXT_EXTRACTION_FAILED",
          message: "No se pudo extraer texto del PDF. Asegurate de que no sea una imagen escaneada.",
        });
      }

      // 2. Subir al PDF service
      const formData = new FormData();
      const blob = new Blob([buffer], { type: "application/pdf" });
      formData.append("file", blob, fileName);
      formData.append("fileName", fileName);

      const uploadRes = await fetch(`${pdfServiceUrl}/pdf/upload-reference`, {
        method: "POST",
        body: formData,
      });
      const storageUrl = uploadRes.ok
        ? `${pdfServiceUrl}/pdf/reference/${fileName}`
        : "";

      // 3. Crear registro en BD con status "processing"
      const record = await prisma.contractAnalysis.create({
        data: {
          id,
          tenantId: user.tenantId,
          uploadedById: user.userId,
          originalName,
          fileName,
          fileSize: buffer.length,
          storageUrl,
          pdfText,
          status: "processing",
          updatedAt: new Date(),
        },
      });
      analysisId = record.id;

      // 4. Llamar a Claude para el análisis
      let result: AnalysisResult | null = null;
      let parseError: string | null = null;

      try {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 4000,
          temperature: 0,
          system: ANALYSIS_SYSTEM_PROMPT,
          messages: [
            { role: "user", content: buildAnalysisPrompt(pdfText) },
          ],
        });

        const rawText = response.content
          .filter((b) => b.type === "text")
          .map((b) => (b as { type: "text"; text: string }).text)
          .join("");

        // Extraer JSON (puede venir envuelto en backticks)
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]) as AnalysisResult;
        } else {
          parseError = "La IA no devolvió JSON válido";
        }
      } catch (aiErr: any) {
        parseError = aiErr?.message ?? "Error en el análisis de IA";
        app.log.error({ aiErr }, "[analysis] Claude error");
      }

      // 5. Actualizar registro con resultado
      if (result) {
        await prisma.contractAnalysis.update({
          where: { id: record.id },
          data: { status: "done", result: result as any, updatedAt: new Date() },
        });
      } else {
        await prisma.contractAnalysis.update({
          where: { id: record.id },
          data: { status: "error", errorMessage: parseError, updatedAt: new Date() },
        });
        return reply.status(500).send({
          ok: false,
          error: "ANALYSIS_FAILED",
          message: parseError ?? "Error en el análisis de IA",
          analysisId: record.id,
        });
      }

      return reply.status(201).send({
        ok: true,
        analysis: {
          id: record.id,
          originalName,
          status: "done",
          result,
          createdAt: record.createdAt,
        },
      });

    } catch (err: any) {
      request.log.error({ err }, "POST /analysis/upload error");
      // Si ya creamos el registro, marcarlo como error
      if (analysisId) {
        await prisma.contractAnalysis.update({
          where: { id: analysisId },
          data: { status: "error", errorMessage: err?.message ?? "Error inesperado", updatedAt: new Date() },
        }).catch(() => {});
      }
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR", message: err?.message });
    }
  });

  // ── GET /analysis ─────────────────────────────────────────────────────────
  app.get("/analysis", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const QuerySchema = z.object({
        page:     z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(50).default(20),
      });
      const q = QuerySchema.safeParse(request.query);
      const { page, pageSize } = q.success ? q.data : { page: 1, pageSize: 20 };

      const [total, analyses] = await Promise.all([
        prisma.contractAnalysis.count({ where: { tenantId: user.tenantId } }),
        prisma.contractAnalysis.findMany({
          where: { tenantId: user.tenantId },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            originalName: true,
            fileSize: true,
            status: true,
            result: true,
            createdAt: true,
            uploadedBy: { select: { firstName: true, lastName: true, email: true } },
          },
        }),
      ]);

      return reply.send({ ok: true, analyses, total, page, pageSize });
    } catch (err: any) {
      request.log.error({ err }, "GET /analysis error");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ── GET /analysis/:id ─────────────────────────────────────────────────────
  app.get("/analysis/:id", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const { id } = request.params as { id: string };

      const analysis = await prisma.contractAnalysis.findFirst({
        where: { id, tenantId: user.tenantId },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true, email: true } },
        },
      });

      if (!analysis) {
        return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
      }

      return reply.send({ ok: true, analysis });
    } catch (err: any) {
      request.log.error({ err }, "GET /analysis/:id error");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });

  // ── DELETE /analysis/:id ──────────────────────────────────────────────────
  app.delete("/analysis/:id", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const { id } = request.params as { id: string };

      const analysis = await prisma.contractAnalysis.findFirst({
        where: { id, tenantId: user.tenantId },
      });

      if (!analysis) {
        return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
      }

      await prisma.contractAnalysis.delete({ where: { id } });

      // Intentar eliminar el archivo del PDF service (no crítico)
      const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";
      fetch(`${pdfServiceUrl}/pdf/reference/${analysis.fileName}`, { method: "DELETE" }).catch(() => {});

      return reply.send({ ok: true });
    } catch (err: any) {
      request.log.error({ err }, "DELETE /analysis/:id error");
      return reply.status(500).send({ ok: false, error: "INTERNAL_ERROR" });
    }
  });
}
