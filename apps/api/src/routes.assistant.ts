/**
 * Floating Assistant Routes — Bot IA personal del abogado
 *
 * POST /assistant/chat
 *   Body: { messages: [{role, content}][], timezone?: string }
 *   Responde con { reply: string }
 *
 * Tiene acceso en tiempo real a:
 *   - Expedientes activos del tenant (con deadlines)
 *   - Documentos recientes generados
 *   - Clientes activos
 *   - Análisis de contratos recientes
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,
  maxRetries: 2,
});

// ─── Schema ───────────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  timezone: z.string().optional().default("America/Argentina/Buenos_Aires"),
});

// ─── Context builder ──────────────────────────────────────────────────────────

async function buildContext(tenantId: string): Promise<string> {
  const now = new Date();
  const in7days  = new Date(now.getTime() + 7  * 86_400_000);
  const in30days = new Date(now.getTime() + 30 * 86_400_000);

  const [
    urgentExpedientes,
    activeExpedientes,
    recentDocuments,
    activeClients,
    recentAnalyses,
  ] = await Promise.all([

    // Expedientes con deadline en los próximos 7 días o vencidos
    prisma.expediente.findMany({
      where: {
        tenantId,
        status: "activo",
        deadline: { not: null, lte: in7days },
      },
      orderBy: { deadline: "asc" },
      take: 10,
      select: {
        id: true, number: true, title: true, matter: true,
        deadline: true, court: true,
        client: { select: { name: true } },
      },
    }),

    // Expedientes activos recientes (sin deadline urgente)
    prisma.expediente.findMany({
      where: {
        tenantId,
        status: "activo",
        OR: [
          { deadline: null },
          { deadline: { gt: in7days } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true, number: true, title: true, matter: true,
        deadline: true, status: true,
        client: { select: { name: true } },
      },
    }),

    // Documentos recientes
    prisma.document.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, type: true, estado: true, createdAt: true,
        client: { select: { name: true } },
        expediente: { select: { title: true, number: true } },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
      },
    }),

    // Clientes activos (no archivados)
    prisma.client.findMany({
      where: { tenantId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, type: true, email: true, phone: true,
      },
    }),

    // Análisis de contratos recientes
    prisma.contractAnalysis.findMany({
      where: { tenantId, status: "done" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, originalName: true, createdAt: true,
        result: true,
      },
    }),
  ]);

  const fmt = (d: Date | null) => d
    ? d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    : "sin fecha";

  const matterLabel: Record<string, string> = {
    civil: "Civil", penal: "Penal", laboral: "Laboral",
    familia: "Familia", comercial: "Comercial",
    administrativo: "Administrativo", constitucional: "Constitucional",
    tributario: "Tributario", otro: "Otro",
  };

  const docTypeLabel: Record<string, string> = {
    service_contract:   "Contrato de Servicios",
    nda:                "NDA",
    legal_notice:       "Carta Documento",
    lease:              "Contrato de Locación",
    debt_recognition:   "Reconocimiento de Deuda",
    simple_authorization: "Autorización Simple",
  };

  let ctx = `FECHA Y HORA ACTUAL: ${now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n\n`;

  // Vencimientos urgentes
  if (urgentExpedientes.length > 0) {
    ctx += `⚠️ VENCIMIENTOS URGENTES (próximos 7 días o vencidos):\n`;
    for (const exp of urgentExpedientes) {
      const dl = exp.deadline!;
      const isOverdue = dl < now;
      const prefix = isOverdue ? "❌ VENCIDO" : "⏰ Vence";
      ctx += `  - [${exp.number ?? "S/N"}] "${exp.title}" (${matterLabel[exp.matter] ?? exp.matter})`;
      ctx += ` → ${prefix}: ${fmt(dl)}`;
      if (exp.client) ctx += ` | Cliente: ${exp.client.name}`;
      if (exp.court) ctx += ` | Juzgado: ${exp.court}`;
      ctx += `\n`;
    }
    ctx += "\n";
  }

  // Expedientes activos
  if (activeExpedientes.length > 0) {
    ctx += `📁 EXPEDIENTES ACTIVOS (${activeExpedientes.length}):\n`;
    for (const exp of activeExpedientes) {
      ctx += `  - [${exp.number ?? "S/N"}] "${exp.title}" (${matterLabel[exp.matter] ?? exp.matter})`;
      if (exp.deadline) ctx += ` | Vence: ${fmt(exp.deadline)}`;
      if (exp.client)   ctx += ` | Cliente: ${exp.client.name}`;
      ctx += `\n`;
    }
    ctx += "\n";
  }

  // Clientes
  if (activeClients.length > 0) {
    ctx += `👤 CLIENTES ACTIVOS (${activeClients.length}):\n`;
    for (const c of activeClients) {
      ctx += `  - "${c.name}" (${c.type === "persona_fisica" ? "Persona Física" : "Persona Jurídica"})`;
      if (c.email) ctx += ` | ${c.email}`;
      if (c.phone) ctx += ` | Tel: ${c.phone}`;
      ctx += `\n`;
    }
    ctx += "\n";
  }

  // Documentos recientes
  if (recentDocuments.length > 0) {
    ctx += `📄 DOCUMENTOS GENERADOS RECIENTEMENTE (${recentDocuments.length}):\n`;
    for (const doc of recentDocuments) {
      const status = doc.versions[0]?.status ?? doc.estado;
      ctx += `  - "${docTypeLabel[doc.type] ?? doc.type}" | Estado: ${status}`;
      if (doc.client)     ctx += ` | Cliente: ${doc.client.name}`;
      if (doc.expediente) ctx += ` | Expediente: ${doc.expediente.title}`;
      ctx += ` | Creado: ${fmt(doc.createdAt)}\n`;
    }
    ctx += "\n";
  }

  // Análisis recientes
  if (recentAnalyses.length > 0) {
    ctx += `🔍 ANÁLISIS DE CONTRATOS RECIENTES:\n`;
    for (const a of recentAnalyses) {
      const res = a.result as any;
      ctx += `  - "${a.originalName}"`;
      if (res?.contractType)  ctx += ` (${res.contractType})`;
      if (res?.overallRisk)   ctx += ` | Riesgo: ${res.overallRisk === "high" ? "Alto" : res.overallRisk === "medium" ? "Medio" : "Bajo"}`;
      ctx += ` | Analizado: ${fmt(a.createdAt)}\n`;
    }
    ctx += "\n";
  }

  if (!urgentExpedientes.length && !activeExpedientes.length && !activeClients.length) {
    ctx += "El estudio no tiene expedientes ni clientes registrados todavía.\n";
  }

  return ctx;
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(context: string): string {
  return `Sos Doku, el asistente personal IA de un estudio jurídico argentino que usa DocuLex.
Tenés acceso en tiempo real a los datos del estudio: expedientes, clientes, documentos generados y análisis de contratos.

━━━ TU ROL ━━━
- Respondés preguntas sobre expedientes, clientes, vencimientos, documentos
- Ayudás a recordar datos, fechas límite y prioridades
- Sos conciso pero completo: respondés con lo que el abogado necesita saber
- No generás documentos legales desde acá (para eso está el flujo de generación)
- Podés hacer cálculos de fechas, plazos, prioridades
- Usás lenguaje profesional pero directo, en español rioplatense
- Si alguien pregunta quién sos, respondés que sos Doku, el asistente IA de DocuLex

━━━ DATOS ACTUALES DEL ESTUDIO ━━━
${context}
━━━ FIN DE DATOS ━━━

IMPORTANTE:
- Si el abogado pregunta por datos que no están en el contexto, avisale que no encontrás esa info.
- Si hay vencimientos urgentes o vencidos, destacalos.
- Respondé siempre en español rioplatense.
- Usá formato con saltos de línea para listas, pero evitá markdown excesivo.`;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function registerAssistantRoutes(app: FastifyInstance) {

  app.post("/assistant/chat", async (request, reply) => {
    try {
      const user = requireAuth(request);
      if (!user.tenantId) {
        return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      }

      const parsed = BodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ ok: false, error: "INVALID_BODY", details: parsed.error.format() });
      }

      const { messages } = parsed.data;

      // Build real-time context from DB
      const context = await buildContext(user.tenantId);
      const systemPrompt = buildSystemPrompt(context);

      // Call Claude
      const response = await anthropic.messages.create({
        model:      "claude-haiku-4-5",
        max_tokens: 1024,
        temperature: 0.4,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role:    m.role,
          content: m.content,
        })),
      });

      const reply_text = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("")
        .trim();

      return reply.send({ ok: true, reply: reply_text });

    } catch (err: any) {
      request.log.error({ err }, "POST /assistant/chat error");
      return reply.status(500).send({
        ok: false,
        error: "INTERNAL_ERROR",
        message: err?.message ?? "Error inesperado",
      });
    }
  });
}
