/**
 * Doku Juris — Research jurisprudencial conversacional
 *
 * Permite a los abogados hacer consultas legales en lenguaje natural y recibir
 * respuestas fundamentadas con citas a artículos del CCCN, CPCCN, códigos
 * provinciales y legislación argentina.
 *
 * Arquitectura (3 capas):
 *   Capa 1 — Claude con conocimiento propio del derecho argentino
 *   Capa 2 — Búsqueda web opcional via Brave Search API (jurisprudencia reciente)
 *   Capa 3 — RAG con pgvector (códigos indexados) — próxima fase
 *
 * POST /juris/consultas               — crear consulta nueva + primer mensaje
 * POST /juris/consultas/:id/mensajes  — continuar consulta existente
 * GET  /juris/consultas               — listar consultas del tenant
 * GET  /juris/consultas/:id           — obtener consulta con todos sus mensajes
 * DELETE /juris/consultas/:id         — borrar consulta (soft)
 */

import { FastifyInstance } from "fastify";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { logger } from "./utils/logger.js";
import { randomUUID } from "node:crypto";
import { findRelevantArticles, formatRagContext } from "./services/rag-service.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_CONTEXT_MESSAGES = 20; // Máximo de mensajes a incluir en el contexto
const MAX_TOKENS           = 3000;

// ─── System Prompt ────────────────────────────────────────────────────────────

const JURIS_SYSTEM_PROMPT = `Sos un asistente legal argentino especializado en investigación jurídica y jurisprudencia.
Actuás como un abogado senior con profundo conocimiento del derecho argentino: civil, comercial, laboral, penal, procesal civil y administrativo.

━━━ JURISDICCIONES QUE CONOCÉS ━━━
• Nacional/Federal: CCCN (Código Civil y Comercial), CPCCN, Ley 24.522 (concursos), LCT, CP, CPPN
• Buenos Aires: CPCyC PBA (CPCC Bs.As.), CPPPBA
• CABA: CPC CABA, CPP CABA
• Córdoba: CPCC Córdoba, CPP Córdoba
• Corrientes: CPCC Corrientes
• Misiones: CPCC Misiones, Ley 4178 y modificatorias

━━━ CÓMO RESPONDÉS ━━━
1. Respondé en español rioplatense claro y profesional
2. Siempre citá la fuente normativa exacta: "Art. 725 CCCN", "Art. 330 CPCCN", etc.
3. Si conocés jurisprudencia relevante de la CSJN o cámaras provinciales, mencioná el tribunal y año (sin inventar números de fallos ni tomos)
4. Usá este formato en tus respuestas:

**Respuesta:**
[Respuesta directa a la consulta]

**Fundamento normativo:**
- Art. XX [Código] — [breve descripción del artículo]
- Ley XXXXX — [aspecto relevante]

**Jurisprudencia orientativa:**
- [Tribunal, año] — [doctrina aplicable] (solo si conocés el caso con certeza)

**Consideraciones prácticas:**
[Aspectos tácticos o procedimentales relevantes]

5. Si no estás seguro de algo, decílo explícitamente: "Te recomiendo verificar esto en [fuente]"
6. NO inventes números de expedientes, tomos, folios, ni datos de fallos específicos
7. Si la consulta requiere análisis de documentos propios del usuario, indicale que use Doku Consulta o Doku Analiza

━━━ MATERIAS DE ESPECIALIZACIÓN ━━━
Civil · Comercial · Laboral · Penal · Administrativo · Familia · Sucesiones · Contratos · Daños · Insolvencia`;

// ─── Helpers ───────────────────────────────��──────────────────────────────────

/**
 * Busca jurisprudencia en web usando Brave Search API (si está configurado).
 * Retorna snippets relevantes para enriquecer la respuesta de Claude.
 */
async function searchWeb(query: string): Promise<string[]> {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!braveKey) return [];

  try {
    const searchQuery = encodeURIComponent(`${query} jurisprudencia argentina site:saij.gob.ar OR site:csjn.gov.ar OR site:infojus.gob.ar OR site:infoleg.gob.ar`);
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${searchQuery}&count=5&lang=es&country=AR`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": braveKey,
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json() as any;
    return (data.web?.results ?? []).map((r: any) => `${r.title}: ${r.description}`).slice(0, 4);
  } catch (err) {
    logger.warn("[juris] Brave Search falló", { err });
    return [];
  }
}

/**
 * Genera el título de una consulta a partir del primer mensaje del usuario.
 * Usa Claude mini para que sea rápido y barato.
 */
async function generateTitle(firstMessage: string): Promise<string> {
  try {
    const res = await anthropic.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 60,
      messages: [{
        role: "user",
        content: `Resumí en máximo 8 palabras (sin punto final, sin comillas) la siguiente consulta legal:\n\n"${firstMessage.substring(0, 300)}"`,
      }],
    });
    const text = res.content.filter(b => b.type === "text").map(b => (b as any).text).join("").trim();
    return text.substring(0, 100) || "Consulta jurídica";
  } catch {
    return firstMessage.substring(0, 80) || "Consulta jurídica";
  }
}

/**
 * Decide si la consulta se beneficiaría de una búsqueda web.
 * Busca términos como "reciente", "2024", "jurisprudencia", "fallo".
 */
function needsWebSearch(message: string): boolean {
  const triggers = [
    /jurisprudencia reciente/i,
    /\b202[3-9]\b/,
    /último fallo/i,
    /novedades/i,
    /reform/i,
    /nueva ley/i,
    /decreto \d+\/\d{4}/i,
  ];
  return triggers.some(r => r.test(message));
}

// ─── Routes ────────────────────────────────────────────────────────���──────────

export async function registerJurisRoutes(app: FastifyInstance) {

  // ══════════════════��═══════════════════════════════════════════════════════
  // POST /juris/consultas — Iniciar nueva consulta + enviar primer mensaje
  // ══════════════════════════════════════════════════════════════════════════
  app.post("/juris/consultas", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const BodySchema = z.object({
      mensaje:     z.string().min(5).max(4000),
      provincia:   z.string().optional(),
      materia:     z.string().optional(),
      expedienteId: z.string().optional(),
    });

    const body = BodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_BODY", details: body.error.flatten() });
    }

    const { mensaje, provincia, materia, expedienteId } = body.data;

    // Verificar expediente si se pasó
    if (expedienteId) {
      const exp = await prisma.expediente.findFirst({ where: { id: expedienteId, tenantId: user.tenantId } });
      if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });
    }

    // Enriquecer con contexto del expediente si aplica
    let expedienteContext = "";
    if (expedienteId) {
      const exp = await prisma.expediente.findUnique({
        where: { id: expedienteId },
        select: { title: true, number: true, matter: true, court: true },
      });
      if (exp) {
        expedienteContext = `\n\n[CONTEXTO DEL EXPEDIENTE: "${exp.title}"${exp.number ? ` (Nro. ${exp.number})` : ""}, materia: ${exp.matter ?? "no especificada"}, juzgado: ${exp.court ?? "no especificado"}]`;
      }
    }

    // Capa 2: Búsqueda web si la consulta lo amerita
    const webResults: string[] = needsWebSearch(mensaje) ? await searchWeb(mensaje) : [];
    const webContext = webResults.length > 0
      ? `\n\n[BÚSQUEDA WEB - resultados recientes relevantes:\n${webResults.map((r, i) => `${i + 1}. ${r}`).join("\n")}]`
      : "";

    // Capa 3: RAG — artículos relevantes de los códigos locales
    // Prioriza el código procesal de la provincia si está especificada
    const ragJurisdiction = provincia
      ? (["misiones", "corrientes"].includes(provincia.toLowerCase())
          ? provincia.toLowerCase()
          : undefined)
      : undefined;
    const ragResults = await findRelevantArticles(mensaje, {
      jurisdiction: ragJurisdiction,
      limit: 5,
    });
    const ragContext = formatRagContext(ragResults);

    if (ragResults.length > 0) {
      logger.debug(`[juris] RAG: ${ragResults.length} artículos encontrados para "${mensaje.substring(0, 60)}"`);
    }

    // Preparar mensaje con todos los contextos enriquecidos
    const enrichedMessage = `${mensaje}${expedienteContext}${ragContext}${webContext}`;

    // Construir system prompt con contexto de provincia
    const systemWithContext = provincia
      ? `${JURIS_SYSTEM_PROMPT}\n\nJURISDICCIÓN ACTIVA: ${provincia}. Priorizá normas y jurisprudencia de ${provincia} cuando sea relevante.`
      : JURIS_SYSTEM_PROMPT;

    // Llamar a Claude
    let responseText = "";
    let inputTokens  = 0;
    let outputTokens = 0;

    try {
      const claudeRes = await anthropic.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: MAX_TOKENS,
        system:     systemWithContext,
        messages:   [{ role: "user", content: enrichedMessage }],
      });

      responseText = claudeRes.content
        .filter(b => b.type === "text")
        .map(b => (b as any).text)
        .join("");
      inputTokens  = claudeRes.usage.input_tokens;
      outputTokens = claudeRes.usage.output_tokens;
    } catch (err: any) {
      logger.error("[juris] Error Claude", { err });
      return reply.status(502).send({ ok: false, error: "AI_ERROR", message: err?.message });
    }

    // Extraer citas del response (formato "Art. X CÓDIGO")
    const citasMatches = responseText.matchAll(/Art[s]?\.\s*(\d+[\w\s]*?)\s+(CCCN|CPCCN|CPCC|CPCyC|LCT|CP|CPPN|Ley\s+[\d.]+)/gi);
    const citas = Array.from(citasMatches).map(m => ({
      articulo: `Art. ${m[1].trim()}`,
      codigo:   m[2].trim(),
      descripcion: "",
    })).slice(0, 10);

    // Generar título
    const titulo = await generateTitle(mensaje);

    // Guardar en BD
    const consultaId = randomUUID();
    const totalTokens = inputTokens + outputTokens;

    const consulta = await prisma.jurisConsulta.create({
      data: {
        id:          consultaId,
        tenantId:    user.tenantId,
        userId:      user.userId,
        expedienteId: expedienteId || null,
        titulo,
        provincia:   provincia || null,
        materia:     materia   || null,
        tokensUsed:  totalTokens,
        updatedAt:   new Date(),
        mensajes: {
          create: [
            {
              id:        randomUUID(),
              role:      "user",
              content:   mensaje,  // Guardamos el mensaje original, no el enriquecido
              tokensUsed: inputTokens,
            },
            {
              id:         randomUUID(),
              role:       "assistant",
              content:    responseText,
              citas:      citas.length > 0 ? citas : undefined,
              webSearches: webResults.length > 0 ? [{ query: mensaje, results: webResults }] : undefined,
              tokensUsed: outputTokens,
            },
          ],
        },
      },
      include: {
        mensajes: { orderBy: { createdAt: "asc" } },
        expediente: { select: { id: true, title: true, number: true } },
      },
    });

    return reply.status(201).send({ ok: true, consulta });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // POST /juris/consultas/:id/mensajes — Continuar consulta existente
  // ═════════════════════════════════════════════════════════════════��════════
  app.post("/juris/consultas/:id/mensajes", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };

    const BodySchema = z.object({
      mensaje: z.string().min(2).max(4000),
    });
    const body = BodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_BODY" });
    }

    // Cargar consulta con historial
    const consulta = await prisma.jurisConsulta.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        mensajes: {
          orderBy: { createdAt: "asc" },
          take: MAX_CONTEXT_MESSAGES,
        },
      },
    });
    if (!consulta) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    const { mensaje } = body.data;

    // Capa 2: búsqueda web
    const webResults: string[] = needsWebSearch(mensaje) ? await searchWeb(mensaje) : [];
    const webContext = webResults.length > 0
      ? `\n\n[BÚSQUEDA WEB:\n${webResults.map((r, i) => `${i + 1}. ${r}`).join("\n")}]`
      : "";

    // Capa 3: RAG
    const ragJurisdiction2 = consulta.provincia
      ? (["misiones", "corrientes"].includes(consulta.provincia.toLowerCase())
          ? consulta.provincia.toLowerCase()
          : undefined)
      : undefined;
    const ragResults2 = await findRelevantArticles(mensaje, { jurisdiction: ragJurisdiction2, limit: 4 });
    const ragContext2  = formatRagContext(ragResults2);

    const enrichedMessage = `${mensaje}${ragContext2}${webContext}`;

    // Construir historial de mensajes para Claude
    const historial: { role: "user" | "assistant"; content: string }[] =
      consulta.mensajes.map(m => ({
        role:    m.role as "user" | "assistant",
        content: m.content,
      }));
    historial.push({ role: "user", content: enrichedMessage });

    // System prompt con jurisdicción
    const systemWithContext = consulta.provincia
      ? `${JURIS_SYSTEM_PROMPT}\n\nJURISDICCIÓN ACTIVA: ${consulta.provincia}.`
      : JURIS_SYSTEM_PROMPT;

    // Llamar a Claude con historial completo
    let responseText = "";
    let inputTokens  = 0;
    let outputTokens = 0;

    try {
      const claudeRes = await anthropic.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: MAX_TOKENS,
        system:     systemWithContext,
        messages:   historial,
      });

      responseText = claudeRes.content
        .filter(b => b.type === "text")
        .map(b => (b as any).text)
        .join("");
      inputTokens  = claudeRes.usage.input_tokens;
      outputTokens = claudeRes.usage.output_tokens;
    } catch (err: any) {
      return reply.status(502).send({ ok: false, error: "AI_ERROR", message: err?.message });
    }

    // Extraer citas
    const citasMatches = responseText.matchAll(/Art[s]?\.\s*(\d+[\w\s]*?)\s+(CCCN|CPCCN|CPCC|CPCyC|LCT|CP|CPPN|Ley\s+[\d.]+)/gi);
    const citas = Array.from(citasMatches).map(m => ({
      articulo: `Art. ${m[1].trim()}`,
      codigo:   m[2].trim(),
      descripcion: "",
    })).slice(0, 10);

    const totalTokens = inputTokens + outputTokens;

    // Guardar mensajes y actualizar tokens
    const [msgUser, msgAssistant] = await prisma.$transaction([
      prisma.jurisMensaje.create({
        data: {
          id:         randomUUID(),
          consultaId: id,
          role:       "user",
          content:    mensaje,
          tokensUsed: inputTokens,
        },
      }),
      prisma.jurisMensaje.create({
        data: {
          id:         randomUUID(),
          consultaId: id,
          role:       "assistant",
          content:    responseText,
          citas:      citas.length > 0 ? citas : undefined,
          webSearches: webResults.length > 0 ? [{ query: mensaje, results: webResults }] : undefined,
          tokensUsed: outputTokens,
        },
      }),
      prisma.jurisConsulta.update({
        where: { id },
        data: {
          tokensUsed: { increment: totalTokens },
          updatedAt: new Date(),
        },
      }),
    ]);

    return reply.send({
      ok: true,
      mensajes: [msgUser, msgAssistant],
    });
  });

  // ══════════════════════════════════════��═══════════════════════���═══════════
  // GET /juris/consultas — Listar consultas del tenant
  // ══════════════════════════════════════════════════════════════════════════
  app.get("/juris/consultas", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const q = request.query as { page?: string; pageSize?: string; materia?: string; provincia?: string };
    const page     = Math.max(1, parseInt(q.page     ?? "1"));
    const pageSize = Math.min(50, parseInt(q.pageSize ?? "20"));

    const where: any = { tenantId: user.tenantId, deletedAt: null };
    if (q.materia)   where.materia   = q.materia;
    if (q.provincia) where.provincia = q.provincia;

    const [total, consultas] = await Promise.all([
      prisma.jurisConsulta.count({ where }),
      prisma.jurisConsulta.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, titulo: true, provincia: true, materia: true,
          tokensUsed: true, createdAt: true, updatedAt: true,
          expediente: { select: { id: true, title: true, number: true } },
          _count: { select: { mensajes: true } },
        },
      }),
    ]);

    return reply.send({ ok: true, consultas, total, page, pageSize });
  });

  // ═════════════════════════════════════════════��═══════════════════��════════
  // GET /juris/consultas/:id — Obtener consulta completa con mensajes
  // ══════════════════════════════════════════════════════════════════════════
  app.get("/juris/consultas/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };

    const consulta = await prisma.jurisConsulta.findFirst({
      where: { id, tenantId: user.tenantId, deletedAt: null },
      include: {
        mensajes: { orderBy: { createdAt: "asc" } },
        expediente: { select: { id: true, title: true, number: true } },
      },
    });

    if (!consulta) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
    return reply.send({ ok: true, consulta });
  });

  // ═════════════════════════════════════════════════════��════════════════════
  // DELETE /juris/consultas/:id — Borrar consulta (soft delete)
  // ═════════════════════════════════════════���════════════════════════════════
  app.delete("/juris/consultas/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const consulta = await prisma.jurisConsulta.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!consulta) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.jurisConsulta.update({ where: { id }, data: { deletedAt: new Date() } });
    return reply.send({ ok: true });
  });
}
