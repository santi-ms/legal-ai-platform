/**
 * DocuLex ESTRATEGA — Análisis de escritos de la parte contraria
 *
 * POST /estrategia/upload    — sube PDF, extrae texto, inicia análisis async
 * GET  /estrategia           — lista análisis del tenant
 * GET  /estrategia/:id       — obtiene análisis completo (polling hasta done)
 * DELETE /estrategia/:id     — borrado suave
 */

import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { extractTextFromPdf } from "./modules/documents/services/pdf-extractor.js";
import { checkMonthlyLimit, planLimitExceededResponse } from "./services/plan-limits.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EstrategiaResult {
  resumen:              string;
  tipoEscritoDetectado: string;
  parteContraria:       string;

  pretensiones: Array<{
    pretension: string;
    fundamento:  string;
    fortaleza:   "alta" | "media" | "baja";
  }>;

  puntosDebiles: Array<{
    punto:       string;
    explicacion: string;
    severidad:   "alta" | "media" | "baja";
  }>;

  defensasSugeridas: Array<{
    defensa:             string;
    fundamento:          string;
    normativa:           string;  // art., ley, etc. — sin inventar expedientes
    riesgo:              "alto" | "medio" | "bajo";
    probabilidadExito:   number;  // 0-100
    factoresFavorables:  string;  // qué apoya esta defensa
    factoresDesfavorables: string; // qué puede dificultar esta defensa
  }>;

  plazosCriticos: Array<{
    descripcion:   string;
    diasHabiles:   number;
    urgencia:      "urgente" | "normal";
  }>;

  estrategia:   string;   // párrafo de recomendación táctica general

  documentosRecomendados: Array<{
    tipo:          string;  // ej: "contestacion_demanda"
    justificacion: string;
  }>;

  nivelRiesgo:         "alto" | "medio" | "bajo";
  probabilidadGlobal:  number;  // 0-100 — probabilidad de éxito global del caso
  confianzaAnalisis:   "alta" | "media" | "baja"; // nivel de confianza del análisis
  resumenProbabilidad: string;  // 1-2 oraciones explicando el % global
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sos un abogado litigante argentino con 20 años de experiencia.
Analizás escritos presentados por la parte contraria y generás estrategias de defensa.

REGLAS ABSOLUTAS:
1. Respondé ÚNICAMENTE con el objeto JSON pedido, sin texto adicional, sin markdown, sin bloques de código.
2. NO inventes expedientes, tomos, folios ni números de fallo reales. Si citás normativa, usá solo artículos y leyes reales (CCCN, CPCyC, CP, etc.).
3. Sé concreto: "no acompañó el contrato que fundamenta la obligación" es mejor que "falta prueba".
4. Usá español rioplatense claro y profesional.
5. Si el escrito está mal escaneado o el texto es ininteligible, indicalo en "resumen" y devolvé arrays vacíos.`;

function buildPrompt(pdfText: string, tipoEscrito: string, materia: string, provincia: string): string {
  const truncated = pdfText.length > 45000
    ? pdfText.slice(0, 45000) + "\n\n[... texto truncado ...]"
    : pdfText;

  return `Analizá el siguiente escrito judicial presentado por la parte contraria.

Contexto:
- Tipo de escrito: ${tipoEscrito}
- Materia: ${materia || "no especificada"}
- Jurisdicción: ${provincia || "no especificada"}

INSTRUCCIONES PARA PROBABILIDADES:
Para cada defensa sugerida, estimá probabilidad de éxito (0-100) basándote en:
  - Solidez jurídica del argumento frente al texto analizado
  - Debilidades concretas detectadas en el escrito contrario
  - Complejidad probatoria que requeriría sostener la defensa
  - Normativa y doctrina aplicable
La "probabilidadGlobal" es la probabilidad ponderada de obtener un resultado favorable si se adopta la estrategia recomendada.
Sé honesto: si el escrito contrario es sólido, reflejalo con porcentajes más bajos.

Devolvé EXACTAMENTE este JSON (sin nada más):

{
  "resumen": "Resumen del escrito en 3-5 oraciones. Quién demanda, qué pide, en qué se basa.",
  "tipoEscritoDetectado": "Tipo de escrito identificado (puede diferir del informado)",
  "parteContraria": "Nombre/identificación de la parte contraria si surge del texto",
  "pretensiones": [
    {
      "pretension": "Qué pide concretamente",
      "fundamento": "En qué basa esa pretensión",
      "fortaleza": "alta"
    }
  ],
  "puntosDebiles": [
    {
      "punto": "Descripción concreta del punto débil del escrito contrario",
      "explicacion": "Por qué es débil o atacable",
      "severidad": "alta"
    }
  ],
  "defensasSugeridas": [
    {
      "defensa": "Defensa o argumento concreto",
      "fundamento": "Base fáctica y/o jurídica",
      "normativa": "Art. X del CCCN / Ley XXXXX (solo normativa real, sin inventar fallos)",
      "riesgo": "bajo",
      "probabilidadExito": 75,
      "factoresFavorables": "Qué elementos del caso apoyan esta defensa",
      "factoresDesfavorables": "Qué puede dificultar o debilitar esta defensa"
    }
  ],
  "plazosCriticos": [
    {
      "descripcion": "Plazo para contestar demanda / interponer recurso / etc.",
      "diasHabiles": 15,
      "urgencia": "urgente"
    }
  ],
  "estrategia": "Párrafo con la recomendación táctica general: qué postura tomar, qué priorizar, qué riesgos anticipar.",
  "documentosRecomendados": [
    {
      "tipo": "contestacion_demanda",
      "justificacion": "Por qué conviene presentar este escrito"
    }
  ],
  "nivelRiesgo": "medio",
  "probabilidadGlobal": 65,
  "confianzaAnalisis": "alta",
  "resumenProbabilidad": "1-2 oraciones explicando el porcentaje global: qué factores lo elevan o reducen."
}

ESCRITO A ANALIZAR:
---
${truncated}
---

Respondé SOLO con el JSON.`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerEstrategiaRoutes(app: FastifyInstance) {

  // ── POST /estrategia/upload ───────────────────────────────────────────────
  app.post("/estrategia/upload", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const data = await (request as any).file();
    if (!data) return reply.status(400).send({ ok: false, error: "NO_FILE" });
    if (!data.mimetype?.includes("pdf")) {
      return reply.status(400).send({ ok: false, error: "INVALID_TYPE", message: "Solo se aceptan PDFs" });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > 10 * 1024 * 1024) {
      return reply.status(400).send({ ok: false, error: "FILE_TOO_LARGE", message: "Máximo 10 MB" });
    }

    // Chequeo de límite mensual del plan
    const limitCheck = await checkMonthlyLimit({
      tenantId: user.tenantId,
      limitKey: "strategiesPerMonth",
      fallbackLimit: 2,
      resourceLabel: "análisis de escritos",
      countQuery: (start, end) =>
        prisma.escritoAnalisis.count({
          where: { tenantId: user.tenantId!, createdAt: { gte: start, lte: end } },
        }),
    });
    if (!limitCheck.ok) return reply.status(429).send(planLimitExceededResponse(limitCheck));

    // Extraer texto
    const pdfText = await extractTextFromPdf(buffer);
    if (!pdfText || pdfText.trim().length < 50) {
      return reply.status(400).send({
        ok: false,
        error: "TEXT_EXTRACTION_FAILED",
        message: "No se pudo extraer texto del PDF. Verificá que no sea una imagen escaneada.",
      });
    }

    // Subir al PDF service
    const id = randomUUID();
    const fileName = `escrito-${id}.pdf`;
    const pdfServiceUrl = process.env.PDF_SERVICE_URL || "http://localhost:4100";

    let storageUrl = "";
    try {
      const formData = new FormData();
      formData.append("file", new Blob([buffer], { type: "application/pdf" }), fileName);
      formData.append("fileName", fileName);
      const upRes = await fetch(`${pdfServiceUrl}/pdf/upload-reference`, { method: "POST", body: formData });
      if (upRes.ok) storageUrl = `${pdfServiceUrl}/pdf/reference/${fileName}`;
    } catch { /* no bloquear si storage falla */ }

    // Metadatos del form
    const tipoEscrito = (data.fields?.tipoEscrito?.value ?? "otro") as string;
    const materia     = (data.fields?.materia?.value ?? "") as string;
    const provincia   = (data.fields?.provincia?.value ?? "") as string;
    const expedienteId = (data.fields?.expedienteId?.value ?? null) as string | null;

    // Validar expediente si se pasó
    if (expedienteId) {
      const exp = await prisma.expediente.findFirst({ where: { id: expedienteId, tenantId: user.tenantId } });
      if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });
    }

    // Crear registro
    const record = await prisma.escritoAnalisis.create({
      data: {
        id,
        tenantId:     user.tenantId,
        uploadedById: user.userId,
        expedienteId: expedienteId || null,
        originalName: data.filename as string,
        fileName,
        fileSize:     buffer.length,
        storageUrl,
        pdfText,
        tipoEscrito,
        materia:   materia || null,
        provincia: provincia || null,
        status:    "processing",
        updatedAt: new Date(),
      },
    });

    // Responder inmediatamente
    reply.status(202).send({ ok: true, id: record.id, status: "processing" });

    // Análisis async en background
    setImmediate(async () => {
      try {
        const response = await anthropic.messages.create({
          model:      "claude-sonnet-4-6",
          max_tokens: 4000,
          temperature: 0,
          system:     SYSTEM_PROMPT,
          messages:   [{ role: "user", content: buildPrompt(pdfText, tipoEscrito, materia, provincia) }],
        });

        const rawText = response.content
          .filter((b) => b.type === "text")
          .map((b) => (b as any).text)
          .join("");

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Claude no devolvió JSON válido");

        const result: EstrategiaResult = JSON.parse(jsonMatch[0]);

        await prisma.escritoAnalisis.update({
          where: { id },
          data: { status: "done", result: result as any, updatedAt: new Date() },
        });
      } catch (err: any) {
        await prisma.escritoAnalisis.update({
          where: { id },
          data: { status: "error", errorMessage: err?.message ?? "Error desconocido", updatedAt: new Date() },
        });
      }
    });
  });

  // ── GET /estrategia ───────────────────────────────────────────────────────
  app.get("/estrategia", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const q = request.query as { page?: string; pageSize?: string; expedienteId?: string };
    const page     = Math.max(1, parseInt(q.page     ?? "1"));
    const pageSize = Math.min(50, parseInt(q.pageSize ?? "20"));

    const where: any = { tenantId: user.tenantId, deletedAt: null };
    if (q.expedienteId) where.expedienteId = q.expedienteId;

    const [total, items] = await Promise.all([
      prisma.escritoAnalisis.count({ where }),
      prisma.escritoAnalisis.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, originalName: true, tipoEscrito: true, materia: true,
          provincia: true, status: true,
          createdAt: true, expedienteId: true,
          expediente: { select: { id: true, title: true, number: true } },
          result: true,
        },
      }),
    ]);

    // Extraer nivelRiesgo del result JSON para mostrar en lista
    const enriched = items.map((item) => ({
      ...item,
      nivelRiesgo: (item.result as any)?.nivelRiesgo ?? null,
    }));

    return reply.send({ ok: true, items: enriched, total, page, pageSize });
  });

  // ── GET /estrategia/:id ───────────────────────────────────────────────────
  app.get("/estrategia/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };

    const item = await prisma.escritoAnalisis.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        expediente: { select: { id: true, title: true, number: true, matter: true } },
      },
    });

    if (!item) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
    return reply.send({ ok: true, item });
  });

  // ── DELETE /estrategia/:id ────────────────────────────────────────────────
  app.delete("/estrategia/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const result = await prisma.escritoAnalisis.updateMany({
      where: { id, tenantId: user.tenantId },
      data:  { deletedAt: new Date() },
    });
    if (result.count === 0) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
    return reply.send({ ok: true });
  });
}
