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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function callWithRetry(fn: () => Promise<Anthropic.Message>, retries = 2): Promise<Anthropic.Message> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err: any) {
      lastErr = err;
      if (i === retries || (err?.status >= 400 && err?.status < 500 && err?.status !== 429)) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

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
  const truncated = pdfText.length > 40000
    ? pdfText.slice(0, 40000) + "\n\n[... texto truncado por longitud ...]"
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
  // Flujo async: responde inmediatamente con analysisId, procesa en background.
  // El cliente hace polling a GET /analysis/:id hasta que status === "done".
  app.post("/analysis/upload", async (request, reply) => {
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

      // Verificar límite de análisis por mes según plan
      const { getPlanForTenant } = await import("./routes.billing.js");
      const { plan } = await getPlanForTenant(user.tenantId);
      const limits = (plan as any)?.limits ?? {};
      const analysesPerMonth: number = typeof limits.analysesPerMonth === "number" ? limits.analysesPerMonth : 2;

      if (analysesPerMonth !== -1) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const usedThisMonth = await prisma.contractAnalysis.count({
          where: { tenantId: user.tenantId, createdAt: { gte: startOfMonth, lte: endOfMonth } },
        });
        if (usedThisMonth >= analysesPerMonth) {
          return reply.status(429).send({
            ok: false,
            error: "PLAN_LIMIT_EXCEEDED",
            message: `Alcanzaste el límite de ${analysesPerMonth} análisis este mes. Actualizá tu plan para continuar.`,
            limit: analysesPerMonth,
            used: usedThisMonth,
          });
        }
      }

      const originalName = data.filename as string;
      const id = randomUUID();
      const fileName = `analysis-${id}.pdf`;
      const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";

      // 1. Extraer texto (sincrónico — necesario para validar antes de crear el registro)
      const pdfText = await extractTextFromPdf(buffer);
      if (!pdfText || pdfText.trim().length < 50) {
        return reply.status(400).send({
          ok: false,
          error: "TEXT_EXTRACTION_FAILED",
          message: "No se pudo extraer texto del PDF. Asegurate de que no sea una imagen escaneada.",
        });
      }

      // 2. Subir al PDF service (sincrónico)
      const formData = new FormData();
      const blob = new Blob([buffer], { type: "application/pdf" });
      formData.append("file", blob, fileName);
      formData.append("fileName", fileName);

      const uploadRes = await fetch(`${pdfServiceUrl}/pdf/upload-reference`, {
        method: "POST",
        body: formData,
      });
      const storageUrl = uploadRes.ok ? `${pdfServiceUrl}/pdf/reference/${fileName}` : "";

      // 3. Crear registro con status "processing"
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

      // 4. Responder inmediatamente — no esperar a Claude
      reply.status(202).send({
        ok: true,
        analysisId: record.id,
        status: "processing",
        message: "Análisis iniciado. Consultá el estado en GET /analysis/:id",
      });

      // 5. Procesar con Claude en background (no bloquea el HTTP response)
      setImmediate(async () => {
        let result: AnalysisResult | null = null;
        let parseError: string | null = null;

        try {
          const response = await callWithRetry(() => anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4000,
            temperature: 0,
            system: ANALYSIS_SYSTEM_PROMPT,
            messages: [{ role: "user", content: buildAnalysisPrompt(pdfText) }],
          }));

          const rawText = response.content
            .filter((b) => b.type === "text")
            .map((b) => (b as { type: "text"; text: string }).text)
            .join("");

          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]) as AnalysisResult;
          } else {
            parseError = "La IA no devolvió JSON válido";
          }
        } catch (aiErr: any) {
          parseError = aiErr?.message ?? "Error en el análisis de IA";
          app.log.error({ aiErr }, `[analysis:${id}] Claude error`);
        }

        if (result) {
          await prisma.contractAnalysis.update({
            where: { id },
            data: { status: "done", result: result as any, updatedAt: new Date() },
          });
          app.log.info(`[analysis:${id}] ✅ Completado`);
        } else {
          await prisma.contractAnalysis.update({
            where: { id },
            data: { status: "error", errorMessage: parseError, updatedAt: new Date() },
          });
          app.log.error(`[analysis:${id}] ❌ Error: ${parseError}`);
        }
      });

      return; // ya respondimos con reply.send() arriba

    } catch (err: any) {
      request.log.error({ err }, "POST /analysis/upload error");
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

  // ── POST /analysis/:id/ask ────────────────────────────────────────────────
  // Preguntas de seguimiento sobre un contrato ya analizado.
  app.post("/analysis/:id/ask", {
    config: {
      rateLimit: { max: 30, timeWindow: 60 * 1000 },
    },
  }, async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

      const { id } = request.params as { id: string };
      const { question } = (request.body as any) ?? {};

      if (!question || typeof question !== "string" || question.trim().length < 3) {
        return reply.status(400).send({ ok: false, error: "INVALID_QUESTION", message: "La pregunta es demasiado corta." });
      }

      const analysis = await prisma.contractAnalysis.findFirst({
        where: { id, tenantId: user.tenantId },
      });

      if (!analysis) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
      if (analysis.status !== "done") {
        return reply.status(400).send({ ok: false, error: "ANALYSIS_NOT_DONE", message: "El análisis todavía no está completo." });
      }

      const result = analysis.result as any;
      const contractText = (analysis.pdfText ?? "").slice(0, 10000);

      const systemPrompt = `Sos un abogado experto en derecho argentino. Ya analizaste el siguiente contrato y tenés el análisis completo.
El usuario tiene preguntas sobre este contrato. Respondé en forma clara, precisa y en español rioplatense.
Si la respuesta no está en el contrato, decilo. No inventes información legal.

TIPO DE CONTRATO: ${result?.contractType ?? "desconocido"}
RESUMEN: ${result?.summary ?? ""}
RIESGO GENERAL: ${result?.overallRisk ?? ""}

TEXTO DEL CONTRATO:
${contractText}`;

      const aiResponse = await callWithRetry(() => anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: question.trim() }],
      }));

      const answer = aiResponse.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");

      return reply.send({ ok: true, answer });
    } catch (err: any) {
      request.log.error({ err }, "POST /analysis/:id/ask error");
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

      const result = await prisma.contractAnalysis.deleteMany({
        where: { id, tenantId: user.tenantId },
      });
      if (result.count === 0) {
        return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
      }

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
