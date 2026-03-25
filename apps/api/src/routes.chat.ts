import { FastifyInstance } from "fastify";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireAuth } from "./utils/auth.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── System prompt ────────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `Sos un asistente legal argentino especializado en redacción de documentos legales.
Tu única función es recopilar la información necesaria para generar uno de los siguientes tipos de documentos:

- service_contract      : Contrato de Prestación de Servicios
- nda                   : Acuerdo de Confidencialidad (NDA)
- legal_notice          : Carta Documento / Notificación Legal
- lease                 : Contrato de Locación (Alquiler)
- debt_recognition      : Reconocimiento de Deuda
- simple_authorization  : Autorización Simple

━━━ INSTRUCCIONES ━━━
1. Identificá qué tipo de documento quiere el usuario (puede decirlo con sus palabras).
2. Recolectá la información necesaria con preguntas naturales y amigables.
3. Hacé máximo 2 preguntas por mensaje para no abrumar al usuario.
4. Si el usuario da información incompleta para un campo no crítico, usá un valor razonable y avisale.
5. Para CUIT/DNI: si el usuario no lo tiene a mano, usá "-" y avisale que lo puede actualizar después.
6. Jurisdicción: si no la menciona, usá "caba" por defecto.
7. Tono: usá "commercial_clear" por defecto.
8. Moneda: usá "ARS" por defecto salvo que el usuario diga otra cosa.
9. Respondé siempre en español rioplatense (argentino).

━━━ CAMPOS EXACTOS POR TIPO (estos son los nombres que debés usar en extractedData) ━━━

── service_contract ──
  proveedor_nombre    : nombre completo del proveedor/prestador
  proveedor_doc       : CUIT o "-"
  cliente_nombre      : nombre completo del cliente
  cliente_doc         : CUIT o "-"
  descripcion_servicio: descripción del servicio
  monto               : número entero (ej: 150000)
  moneda              : "ARS" por defecto
  periodicidad        : "mensual" | "unico" | "trimestral"
  forma_pago          : "transferencia_bancaria" | "efectivo" | "cheque"
  plazo_minimo_meses  : número entero de meses

── nda ──
  revelador_nombre      : quien comparte la información
  revelador_doc         : CUIT o "-"
  receptor_nombre       : quien recibe la información
  receptor_doc          : CUIT o "-"
  finalidad_permitida   : para qué se comparte la info confidencial
  plazo_confidencialidad: número entero (años)

── legal_notice ──
  remitente_nombre  : quien envía la carta
  remitente_doc     : CUIT/DNI o "-"
  destinatario_nombre: destinatario
  destinatario_doc  : CUIT/DNI o "-"
  relacion_previa   : contexto de la relación entre las partes
  hechos            : descripción de los hechos que motivan la carta
  incumplimiento    : descripción del incumplimiento específico
  intimacion        : texto de lo que se intima, exige o solicita
  plazo_cumplimiento: plazo para cumplir como string (ej: "5 días hábiles", "10 días corridos")
  apercibimiento    : qué ocurre si no cumple (ej: "se iniciarán acciones legales")

── lease ──
  locador_nombre    : propietario
  locador_doc       : CUIT/DNI o "-"
  locatario_nombre  : inquilino
  locatario_doc     : CUIT/DNI o "-"
  domicilio_inmueble: dirección completa del inmueble
  monto_alquiler    : número entero (ej: 500000)
  moneda            : "ARS" por defecto
  forma_pago        : "transferencia_bancaria" | "efectivo" | "cheque"
  duracion_meses    : número entero de meses

── debt_recognition ──
  acreedor_nombre   : acreedor
  acreedor_doc      : CUIT/DNI o "-"
  deudor_nombre     : deudor
  deudor_doc        : CUIT/DNI o "-"
  monto_deuda       : número entero (ej: 200000)
  moneda            : "ARS" por defecto
  causa_deuda       : origen o causa de la deuda
  forma_pago        : "transferencia_bancaria" | "efectivo" | "cheque"

── simple_authorization ──
  autorizante_nombre  : quien autoriza
  autorizante_doc     : DNI/CUIT o "-"
  autorizado_nombre   : quien recibe la autorización
  autorizado_doc      : DNI/CUIT o "-"
  tramite_autorizado  : descripción del trámite o acto autorizado

━━━ FORMATO DE RESPUESTA ━━━
Respondé SIEMPRE con JSON válido. Sin texto antes ni después del JSON.

Mientras recopilás información:
{
  "ready": false,
  "reply": "tu mensaje conversacional para el usuario"
}

Cuando tenés TODA la información necesaria para el tipo detectado:
{
  "ready": true,
  "reply": "¡Perfecto! Tengo todo lo necesario. Voy a generar tu [nombre del documento] ahora mismo.",
  "documentType": "legal_notice",
  "extractedData": {
    "documentType": "legal_notice",
    "jurisdiction": "caba",
    "tone": "commercial_clear",
    "remitente_nombre": "...",
    "remitente_doc": "-",
    ... resto de campos del tipo detectado con los nombres exactos de arriba
  }
}`;

// ─── System prompt para Q&A de documento ─────────────────────────────────────

const DOCUMENT_QA_SYSTEM_PROMPT = `Sos un asistente legal argentino experto en análisis y redacción de documentos.
El usuario tiene un documento legal frente a él y puede hacerte preguntas sobre su contenido.

Tu rol:
- Responder preguntas sobre el documento de forma clara y concisa
- Explicar cláusulas o términos legales en lenguaje sencillo
- Señalar posibles problemas, ambigüedades o riesgos en el documento
- Sugerir mejoras o aclaraciones cuando sea pertinente
- Responder en español rioplatense (argentino)
- Ser profesional pero accesible, no usar jerga legal innecesaria

Importante:
- Si el usuario pregunta algo que no está en el documento, indicalo claramente
- No inventes información que no esté en el texto
- Tus respuestas deben ser concisas (máximo 3-4 párrafos salvo que se pida más detalle)
- No reemplazás el asesoramiento de un abogado profesional`;

// ─── Schemas de validación ────────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
});

const DocumentAskSchema = z.object({
  question: z.string().min(1).max(2000),
  documentContent: z.string().max(50000).optional(),
  history: z.array(ChatMessageSchema).max(20).optional(),
});

// ─── Registro de rutas ────────────────────────────────────────────────────────

export async function registerChatRoutes(app: FastifyInstance) {
  /**
   * POST /documents/chat
   * Conversación con IA para recopilar datos del documento.
   * Devuelve { ok, ready, reply } mientras recopila
   * y { ok, ready: true, documentType, extractedData } cuando tiene todo.
   */
  app.post("/documents/chat", async (request, reply) => {
    try {
      requireAuth(request);
    } catch {
      return reply.status(401).send({
        ok: false,
        error: "unauthorized",
        message: "No autorizado. Iniciá sesión para continuar.",
      });
    }

    const parsed = ChatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: "validation_error",
        message: "Datos inválidos en la solicitud.",
        details: parsed.error.flatten(),
      });
    }

    const { messages } = parsed.data;

    let rawContent: string;
    try {
      const completion = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1200,
        system: CHAT_SYSTEM_PROMPT + "\n\nIMPORTANTE: Respondé SIEMPRE con un objeto JSON válido, sin texto adicional.",
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      });

      rawContent =
        (completion.content[0] as any)?.text ??
        '{"ready":false,"reply":"Ocurrió un error. ¿Podés repetir tu consulta?"}';
    } catch (aiError: any) {
      app.log.error({ aiError }, "[chat] Claude API error");
      return reply.status(502).send({
        ok: false,
        error: "ai_error",
        message: "Error al conectar con el motor de IA. Intentá de nuevo.",
      });
    }

    let response: Record<string, unknown>;
    try {
      // Extraer JSON aunque venga envuelto en ```json ... ``` o texto adicional
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        rawContent.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawContent.trim();
      response = JSON.parse(jsonStr);
    } catch {
      // Si sigue fallando, intentar usar el texto como reply directo
      const plainText = rawContent.replace(/```(?:json)?|```/g, "").trim();
      response = {
        ready: false,
        reply: plainText || "No pude procesar la respuesta. ¿Podés intentarlo de nuevo?",
      };
    }

    return reply.send({ ok: true, ...response });
  });

  /**
   * POST /documents/:id/ask
   * Pregunta al asistente IA sobre el contenido de un documento específico.
   * Body: { question, documentContent?, history? }
   * Response: { ok, answer }
   */
  app.post("/documents/:id/ask", async (request, reply) => {
    try {
      requireAuth(request);
    } catch {
      return reply.status(401).send({
        ok: false,
        error: "unauthorized",
        message: "No autorizado. Iniciá sesión para continuar.",
      });
    }

    const parsed = DocumentAskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        ok: false,
        error: "validation_error",
        message: "Datos inválidos en la solicitud.",
        details: parsed.error.flatten(),
      });
    }

    const { question, documentContent, history = [] } = parsed.data;

    // Construir el system prompt con el contenido del documento si está disponible
    const systemPrompt = documentContent
      ? `${DOCUMENT_QA_SYSTEM_PROMPT}\n\n━━━ DOCUMENTO ACTUAL ━━━\n${documentContent.slice(0, 40000)}`
      : DOCUMENT_QA_SYSTEM_PROMPT;

    let answer: string;
    try {
      const historyMessages = history.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }));
      const completion = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          ...historyMessages,
          { role: "user", content: question },
        ],
      });

      answer =
        (completion.content[0] as any)?.text?.trim() ??
        "No pude generar una respuesta. Intentá de nuevo.";
    } catch (aiError: any) {
      app.log.error({ aiError }, "[document-ask] Claude API error");
      return reply.status(502).send({
        ok: false,
        error: "ai_error",
        message: "Error al conectar con el motor de IA. Intentá de nuevo.",
      });
    }

    return reply.send({ ok: true, answer });
  });
}
