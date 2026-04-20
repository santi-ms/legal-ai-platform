/**
 * Vencimiento Notifier Service
 *
 * Corre diariamente (vía cron) y envía emails de recordatorio a los usuarios
 * cuyos vencimientos (Vencimiento model) están por vencer según su `alertaDias`.
 *
 * Lógica:
 *  - Busca Vencimientos pendientes cuya fechaVencimiento ≤ hoy + alertaDias
 *  - Agrupa por usuario (createdById)
 *  - Envía un email-resumen por usuario con todos sus vencimientos próximos
 *  - Marca notificadoAt = now() para no re-notificar el mismo día
 *
 * Se respeta la preferencia `emailNotifications` del usuario.
 */

import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./email.js";
import { logger } from "../utils/logger.js";

const prisma = new PrismaClient();

const TIPO_LABEL: Record<string, string> = {
  audiencia:            "Audiencia",
  presentacion:         "Presentación",
  prescripcion:         "Prescripción",
  plazo_legal:          "Plazo legal",
  vencimiento_contrato: "Contrato",
  notificacion:         "Notificación",
  pericia:              "Pericia",
  traslado:             "Traslado",
  otro:                 "Otro",
};

function formatDateAR(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

function urgencyLabel(days: number): { text: string; color: string } {
  if (days < 0)  return { text: `Venció hace ${Math.abs(days)}d`, color: "#ef4444" };
  if (days === 0) return { text: "Vence hoy",   color: "#ef4444" };
  if (days === 1) return { text: "Vence mañana", color: "#f97316" };
  if (days <= 3)  return { text: `En ${days} días`,   color: "#f97316" };
  if (days <= 7)  return { text: `En ${days} días`,   color: "#eab308" };
  return           { text: `En ${days} días`,   color: "#22c55e" };
}

interface NotifItem {
  id: string;
  titulo: string;
  tipo: string;
  fechaVencimiento: Date;
  daysLeft: number;
  expedienteTitle?: string | null;
}

function buildEmailHtml(
  userName: string,
  items: NotifItem[],
  frontendUrl: string
): string {
  const rows = items
    .map((item) => {
      const { text: urgText, color: urgColor } = urgencyLabel(item.daysLeft);
      return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px;">
          <strong style="color: #0f172a; display: block;">${item.titulo}</strong>
          <span style="color: #64748b; font-size: 12px;">${TIPO_LABEL[item.tipo] ?? item.tipo}${item.expedienteTitle ? ` · ${item.expedienteTitle}` : ""}</span>
        </td>
        <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
          <span style="font-weight: 600; color: #0f172a;">${formatDateAR(item.fechaVencimiento)}</span>
        </td>
        <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
          <span style="color: ${urgColor}; font-weight: 600; font-size: 13px;">${urgText}</span>
        </td>
      </tr>`;
    })
    .join("");

  const overdueCount = items.filter((i) => i.daysLeft < 0).length;
  const urgentCount  = items.filter((i) => i.daysLeft >= 0 && i.daysLeft <= 3).length;
  const intro = overdueCount > 0
    ? `Tenés <strong>${overdueCount} vencimiento${overdueCount !== 1 ? "s" : ""} vencido${overdueCount !== 1 ? "s" : ""}</strong> y <strong>${urgentCount} próximos</strong> para revisar.`
    : `Tenés <strong>${items.length} vencimiento${items.length !== 1 ? "s" : ""}</strong> próximo${items.length !== 1 ? "s" : ""} para gestionar.`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 620px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b2fc9 0%, #7c3aed 100%); padding: 28px 32px 22px;">
      <div style="color: white; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">⚖️ DocuLex</div>
      <div style="color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px;">Recordatorio de vencimientos legales</div>
    </div>

    <!-- Body -->
    <div style="padding: 28px 32px;">
      <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">Hola, <strong>${userName}</strong></p>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 20px;">${intro}</p>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 14px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 9px 16px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Vencimiento</th>
            <th style="padding: 9px 16px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; white-space: nowrap;">Fecha</th>
            <th style="padding: 9px 16px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Estado</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <!-- CTA -->
      <div style="margin-top: 24px; text-align: center;">
        <a href="${frontendUrl}/vencimientos"
           style="display: inline-block; background: #3b2fc9; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Gestionar vencimientos →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 18px 32px; border-top: 1px solid #e2e8f0; background: #f8fafc;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        Recordatorio automático de DocuLex.<br>
        Podés desactivar estas notificaciones desde <a href="${frontendUrl}/settings" style="color: #6366f1;">tu perfil</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText(userName: string, items: NotifItem[], frontendUrl: string): string {
  const lines = items.map((item) => {
    const { text: urg } = urgencyLabel(item.daysLeft);
    return `• ${item.titulo} (${TIPO_LABEL[item.tipo] ?? item.tipo}) — ${formatDateAR(item.fechaVencimiento)} — ${urg}`;
  });
  return `Hola ${userName},\n\nTenés ${items.length} vencimiento(s) próximo(s):\n\n${lines.join("\n")}\n\nGestioná tus vencimientos: ${frontendUrl}/vencimientos\n\n— DocuLex`;
}

export async function runVencimientoNotifier(): Promise<void> {
  logger.info("[vencimiento-notifier] Iniciando verificación...");

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const frontendUrl = process.env.FRONTEND_URL || "https://legal-ai-platform.vercel.app";

  try {
    // Find pending vencimientos where fechaVencimiento <= today + alertaDias
    // and not yet notified today (notificadoAt is null or before today)
    // We use a raw approach: fetch all due-for-notification vencimientos
    // The alertaDias check: fechaVencimiento <= now + alertaDias days
    // Since alertaDias varies per vencimiento, we use a generous window (30 days)
    // and then filter per-item in JS.
    const MAX_ALERT_WINDOW_DAYS = 30;
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + MAX_ALERT_WINDOW_DAYS);

    const candidates = await prisma.vencimiento.findMany({
      where: {
        estado: "pendiente",
        archivedAt: null,
        fechaVencimiento: { lte: windowEnd },
        OR: [
          { notificadoAt: null },
          { notificadoAt: { lt: now } }, // not notified today
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            notificationPreferences: true,
          },
        },
        expediente: { select: { title: true } },
      },
    });

    if (candidates.length === 0) {
      logger.info("[vencimiento-notifier] Sin vencimientos para notificar.");
      return;
    }

    // Filter: only notify if daysUntil(fechaVencimiento) <= alertaDias
    const toNotify = candidates.filter((v) => {
      const days = daysUntil(v.fechaVencimiento);
      return days <= v.alertaDias; // includes overdue (days < 0) and approaching
    });

    if (toNotify.length === 0) {
      logger.info("[vencimiento-notifier] Ningún vencimiento cumple el umbral de alerta.");
      return;
    }

    // Group by user
    const byUser = new Map<
      string,
      {
        user: (typeof toNotify)[0]["createdBy"];
        items: NotifItem[];
      }
    >();

    for (const v of toNotify) {
      const userId = v.createdById;
      if (!byUser.has(userId)) {
        byUser.set(userId, { user: v.createdBy, items: [] });
      }
      byUser.get(userId)!.items.push({
        id: v.id,
        titulo: v.titulo,
        tipo: v.tipo,
        fechaVencimiento: v.fechaVencimiento,
        daysLeft: daysUntil(v.fechaVencimiento),
        expedienteTitle: v.expediente?.title ?? null,
      });
    }

    const idsToNotify: string[] = [];

    for (const [, { user, items }] of byUser) {
      // Check user notification preferences
      const prefs = (user.notificationPreferences as Record<string, unknown>) || {};
      if (prefs.emailNotifications === false || prefs.vencimientoAlerts === false) {
        logger.info(`[vencimiento-notifier] ${user.email} tiene notificaciones de vencimientos desactivadas — omitiendo`);
        continue;
      }

      idsToNotify.push(...items.map((i) => i.id));
    }

    // Marcar ANTES de enviar: evita duplicados si hay crash post-envío
    if (idsToNotify.length > 0) {
      await prisma.vencimiento.updateMany({
        where: { id: { in: idsToNotify } },
        data: { notificadoAt: new Date() },
      });
    }

    let sentCount = 0;

    for (const [, { user, items }] of byUser) {
      // Omitir usuarios sin notificaciones (ya filtrados arriba, pero recheck por consistencia)
      const prefs = (user.notificationPreferences as Record<string, unknown>) || {};
      if (prefs.emailNotifications === false || prefs.vencimientoAlerts === false) continue;

      // Sort: overdue first, then by ascending fechaVencimiento
      items.sort((a, b) => a.daysLeft - b.daysLeft);

      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      const overdueCount = items.filter((i) => i.daysLeft < 0).length;
      const todayCount   = items.filter((i) => i.daysLeft === 0).length;

      let subjectEmoji = "🟡";
      if (overdueCount > 0 || todayCount > 0) subjectEmoji = "🔴";
      else if (items.some((i) => i.daysLeft <= 3)) subjectEmoji = "🟠";

      const subjectSuffix = overdueCount > 0
        ? `${overdueCount} vencido${overdueCount !== 1 ? "s" : ""}`
        : `${items.length} próximo${items.length !== 1 ? "s" : ""}`;

      try {
        await sendEmail({
          to: user.email,
          subject: `${subjectEmoji} DocuLex — Recordatorio: ${subjectSuffix}`,
          html: buildEmailHtml(userName, items, frontendUrl),
          text: buildEmailText(userName, items, frontendUrl),
        });

        sentCount += items.length;
        logger.info(`[vencimiento-notifier] Email enviado a ${user.email} (${items.length} vencimientos)`);
      } catch (emailErr) {
        logger.error(`[vencimiento-notifier] Error enviando email a ${user.email}`, emailErr);
        // notificadoAt ya fue marcado — no se reintentará el mismo día (comportamiento intencional)
      }
    }

    logger.info(`[vencimiento-notifier] Completado. Marcados: ${idsToNotify.length} vencimientos, emails enviados para: ${sentCount}.`);
  } catch (err) {
    logger.error("[vencimiento-notifier] Error en el notificador", err);
  }
}
