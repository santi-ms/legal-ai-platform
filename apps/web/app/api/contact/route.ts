/**
 * POST /api/contact
 *
 * Recibe el formulario de contacto de la landing (plan Estudio / consultas
 * generales). MVP: valida con zod, envía un mail a soporte vía Resend o
 * Postmark (Resend tiene prioridad si ambos están configurados). Si no hay
 * provider configurado, queda en logs. Rate-limit en memoria por IP, 5
 * envíos / 10 min.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

// ─── Schema ──────────────────────────────────────────────────────────────────

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Nombre muy corto").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  studio: z.string().trim().max(200).optional().or(z.literal("")),
  teamSize: z.enum(["1", "2-5", "6-15", "16+"]).optional(),
  message: z.string().trim().min(10, "Contanos un poco más").max(2000),
  // Honeypot — debe venir vacío. Si viene lleno, es bot.
  website: z.string().max(0).optional().or(z.literal("")),
});

// ─── Rate limit en memoria (MVP) ─────────────────────────────────────────────

const BUCKET = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 min

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = BUCKET.get(ip);
  if (!entry || now > entry.resetAt) {
    BUCKET.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > LIMIT;
}

// GC
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of BUCKET.entries()) {
      if (now > v.resetAt) BUCKET.delete(k);
    }
  }, WINDOW_MS).unref?.();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function buildSubject(payload: z.infer<typeof ContactSchema>) {
  return `[Landing] ${payload.studio || payload.name} — consulta DocuLex`;
}

function buildTextBody(payload: z.infer<typeof ContactSchema>) {
  return [
    `Nombre: ${payload.name}`,
    `Email:  ${payload.email}`,
    payload.phone && `Teléfono: ${payload.phone}`,
    payload.studio && `Estudio: ${payload.studio}`,
    payload.teamSize && `Tamaño del equipo: ${payload.teamSize}`,
    "",
    "Mensaje:",
    payload.message,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendViaResend(
  payload: z.infer<typeof ContactSchema>,
  apiKey: string,
  from: string,
  to: string,
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: payload.email,
      subject: buildSubject(payload),
      text: buildTextBody(payload),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[contact] Resend error:", res.status, text);
    return { delivered: false, reason: "resend_error" };
  }

  return { delivered: true };
}

async function sendViaPostmark(
  payload: z.infer<typeof ContactSchema>,
  token: string,
  from: string,
  to: string,
) {
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: from,
      To: to,
      ReplyTo: payload.email,
      Subject: buildSubject(payload),
      TextBody: buildTextBody(payload),
      MessageStream: "outbound",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[contact] Postmark error:", res.status, text);
    return { delivered: false, reason: "postmark_error" };
  }

  return { delivered: true };
}

async function sendEmail(payload: z.infer<typeof ContactSchema>) {
  const to = process.env.CONTACT_TO_EMAIL || "soporte@doculex.ar";

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from = process.env.RESEND_FROM_EMAIL || "soporte@doculex.ar";
    return sendViaResend(payload, resendKey, from, to);
  }

  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN;
  if (postmarkToken) {
    const from = process.env.POSTMARK_FROM_EMAIL || "soporte@doculex.ar";
    return sendViaPostmark(payload, postmarkToken, from, to);
  }

  console.info("[contact] Sin provider de email configurado — lead solo en logs:", {
    name: payload.name,
    email: payload.email,
    studio: payload.studio,
    teamSize: payload.teamSize,
    phone: payload.phone,
    message: payload.message.slice(0, 200),
  });
  return { delivered: false, reason: "no_email_provider" };
}

// ─── Route ───────────────────────────────────────────────────────────────────

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED", message: "Muchos envíos. Intentá más tarde." },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const parsed = ContactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "VALIDATION_ERROR",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Honeypot: si llenaron `website`, es bot. Devolvemos 200 sin hacer nada
  // para no darle señal al atacante.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendEmail(parsed.data);
  } catch (err) {
    console.error("[contact] unhandled error:", err);
    // No mostramos el error al usuario, pero guardamos el lead en logs.
    console.info("[contact] Lead rescatado de error:", parsed.data);
  }

  return NextResponse.json({ ok: true });
}
