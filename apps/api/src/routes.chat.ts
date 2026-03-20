import { FastifyInstance } from "fastify";
import OpenAI from "openai";
import { z } from "zod";
import { requireAuth } from "./utils/auth.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── System prompt ────────────────────────────────────────────────────────────

const CHAT_SYSTEM_PROMPT = `Sos un asistente legal argentino especializado en redacción de documentos legales.
Tu única función es recopilar la información necesaria para generar uno de los siguientes tipos de documentos:

- service_contract : Contrato de Prestación de Servicios
- nda              : Acuerdo de Confidencialidad (NDA)
- legal_notice     : Carta Documento / Notificación Legal
- lease            : Contrato de Locación (Alquiler)
- debt_recognition : Reconocimiento de Deuda
- simple_authorization : Autorización Simple

━━━ INSTRUCCIONES ━━━
1. Identificá qué tipo de documento quiere el usuario (puede decirlo con sus palabras).
2. Recolectá la información necesaria con preguntas naturales y amigables.
3. Hacé máximo 2 preguntas por mensaje para no abrumar al usuario.
4. Si el usuario da información incompleta para un campo no crítico, usá un valor razonable y avisale.
5. Para CUIT/DNI: si el usuario no lo tiene a mano, usá "-" y avisale que lo puede actualizar después.
6. Jurisdicción: si no la menciona, usá "caba" por defecto.
7. Tono: siempre usá "commercial_clear" por defecto salvo que el usuario pida algo diferente.
8. Respondé siempre en español rioplatense (argentino).
9. Sé cálido, claro y profesional.

━━━ CAMPOS REQUERIDOS POR TIPO ━━━

service_contract:
  proveedor_nombre     → nombre completo del proveedor / prestador
  proveedor_doc        → CUIT (XX-XXXXXXXX-X) o "-"
  cliente_nombre       → nombre completo del cliente
  cliente_doc          → CUIT o "-"
  servicio_descripcion → descripción clara del servicio
  monto                → monto en ARS (número entero, sin puntos ni comas)
  periodicidad_pago    → "mensual" | "unico" | "trimestral"
  plazo_meses          → duración en meses (número entero)
  forma_pago           → "transferencia_bancaria" | "efectivo" | "cheque"

nda:
  revelador_nombre → quien comparte la información
  revelador_doc    → CUIT o "-"
  receptor_nombre  → quien recibe la información
  receptor_doc     → CUIT o "-"
  finalidad        → para qué se comparte la info confidencial
  plazo_meses      → duración en meses (número entero)

legal_notice:
  remitente_nombre      → quien envía la carta
  remitente_doc         → CUIT/DNI o "-"
  destinatario_nombre   → destinatario
  destinatario_doc      → CUIT/DNI o "-"
  contexto_relacion     → contexto de la relación entre partes
  hechos_descripcion    → descripción de los hechos que motivan la carta
  intimacion_solicitud  → qué se intima, exige o solicita
  plazo_dias_respuesta  → días para responder (número entero)

lease:
  locador_nombre   → propietario
  locador_doc      → CUIT/DNI o "-"
  locatario_nombre → inquilino
  locatario_doc    → CUIT/DNI o "-"
  inmueble_direccion → dirección completa del inmueble
  canon_mensual    → alquiler mensual en ARS (número entero)
  plazo_meses      → duración en meses (número entero)

debt_recognition:
  acreedor_nombre → acreedor
  acreedor_doc    → CUIT/DNI o "-"
  deudor_nombre   → deudor
  deudor_doc      → CUIT/DNI o "-"
  monto_deuda     → monto en ARS (número entero)
  causa_deuda     → origen o causa de la deuda

simple_authorization:
  autorizante_nombre → quien autoriza
  autorizante_doc    → DNI/CUIT o "-"
  autorizado_nombre  → quien recibe la autorización
  autorizado_doc     → DNI/CUIT o "-"
  tramite_descripcion → descripción del trámite o acto autorizado

━━━ FORMATO DE RESPUESTA ━━━
Respondé SIEMPRE con JSON válido. Sin texto antes ni después del JSON.

Mientras recopilás información:
{
  "ready": false,
  "reply": "tu mensaje conversacional para el usuario"
}

Cuando tenés TODA la información necesaria:
{
  "ready": true,
  "reply": "¡Perfecto! Tengo todo lo necesario. Voy a generar tu [tipo de documento] ahora mismo.",
  "documentType": "service_contract",
  "extractedData": {
    "documentType": "service_contract",
    "jurisdiction": "caba",
    "tone": "commercial_clear",
    ... todos los campos del documento
  }
}`;

// ─── Schemas de validación ────────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
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
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      });

      rawContent =
        completion.choices[0]?.message?.content ??
        '{"ready":false,"reply":"Ocurrió un error. ¿Podés repetir tu consulta?"}';
    } catch (aiError: any) {
      app.log.error({ aiError }, "[chat] OpenAI API error");
      return reply.status(502).send({
        ok: false,
        error: "ai_error",
        message: "Error al conectar con el motor de IA. Intentá de nuevo.",
      });
    }

    let response: Record<string, unknown>;
    try {
      response = JSON.parse(rawContent);
    } catch {
      response = {
        ready: false,
        reply: "No pude procesar la respuesta correctamente. ¿Podés intentarlo de nuevo?",
      };
    }

    return reply.send({ ok: true, ...response });
  });
}
