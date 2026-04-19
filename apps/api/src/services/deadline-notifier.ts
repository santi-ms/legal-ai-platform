/**
 * Deadline Notifier Service
 *
 * Corre diariamente (vía cron) y envía emails a los abogados
 * cuyos expedientes tienen vencimientos en 7, 3 o 1 día.
 * Usa `deadlineNotifiedAt` para evitar duplicados en el mismo día.
 */

import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./email.js";
import { logger } from "../utils/logger.js";

const prisma = new PrismaClient();

// Umbrales de alerta en días
const THRESHOLDS_DAYS = [7, 3, 1];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatDateAR(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

function daysUntil(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): string {
  if (days <= 1) return "🔴 URGENTE — Vence mañana";
  if (days <= 3) return "🟠 Vence en 3 días";
  return "🟡 Vence en 7 días";
}

function buildEmailHtml(
  userName: string,
  expedientes: Array<{ title: string; number: string | null; matter: string; deadline: Date; daysLeft: number }>
): string {
  const rows = expedientes
    .map(
      (exp) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px;">
          <strong style="color: #0f172a;">${exp.title}</strong>
          ${exp.number ? `<br><span style="color: #64748b; font-size: 13px;">Nº ${exp.number}</span>` : ""}
          <br><span style="color: #64748b; font-size: 12px; text-transform: capitalize;">${exp.matter}</span>
        </td>
        <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
          <span style="font-weight: 600; color: #0f172a;">${formatDateAR(exp.deadline)}</span>
        </td>
        <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
          ${urgencyLabel(exp.daysLeft)}
        </td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b2fc9 0%, #5b46f5 100%); padding: 32px 32px 24px;">
      <div style="color: white; font-size: 22px; font-weight: 700;">⚖️ Legal AI Platform</div>
      <div style="color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 4px;">Recordatorio de vencimientos</div>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="color: #334155; font-size: 16px; margin: 0 0 8px;">Hola, <strong>${userName}</strong></p>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">
        Tenés <strong>${expedientes.length} expediente${expedientes.length !== 1 ? "s" : ""}</strong> con vencimientos próximos:
      </p>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Expediente</th>
            <th style="padding: 10px 16px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Vencimiento</th>
            <th style="padding: 10px 16px; text-align: center; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Estado</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${process.env.APP_URL || "https://legal-ai-platform.vercel.app"}/expedientes"
           style="display: inline-block; background: #3b2fc9; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Ver expedientes →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; border-top: 1px solid #e2e8f0; background: #f8fafc;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        Este es un recordatorio automático de Legal AI Platform.<br>
        Podés desactivar estas notificaciones desde tu perfil.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText(
  userName: string,
  expedientes: Array<{ title: string; number: string | null; deadline: Date; daysLeft: number }>
): string {
  const lines = expedientes.map(
    (exp) =>
      `- ${exp.title}${exp.number ? ` (Nº ${exp.number})` : ""} — Vence: ${formatDateAR(exp.deadline)} (${exp.daysLeft} día${exp.daysLeft !== 1 ? "s" : ""})`
  );
  return `Hola ${userName},\n\nTenés ${expedientes.length} expediente(s) con vencimientos próximos:\n\n${lines.join("\n")}\n\nAccedé a tus expedientes: ${process.env.APP_URL || "https://legal-ai-platform.vercel.app"}/expedientes\n\n— Legal AI Platform`;
}

export async function runDeadlineNotifier(): Promise<void> {
  logger.info("[deadline-notifier] Iniciando verificación de vencimientos...");

  const now = new Date();

  // Rangos de fechas: buscar expedientes con deadline entre hoy y +7 días
  const windowEnd = endOfDay(addDays(now, 7));
  const windowStart = startOfDay(now);

  try {
    // Buscar expedientes activos con deadline próximo que aún no fueron notificados hoy
    const expedientes = await prisma.expediente.findMany({
      where: {
        status: "activo",
        deadline: {
          gte: windowStart,
          lte: windowEnd,
        },
        OR: [
          { deadlineNotifiedAt: null },
          {
            deadlineNotifiedAt: {
              lt: startOfDay(now), // no notificado hoy
            },
          },
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
        tenant: { select: { id: true } },
      },
    });

    if (expedientes.length === 0) {
      logger.info("[deadline-notifier] No hay vencimientos próximos para notificar.");
      return;
    }

    // Agrupar por usuario
    const byUser = new Map<
      string,
      {
        user: (typeof expedientes)[0]["createdBy"];
        items: Array<{ id: string; title: string; number: string | null; matter: string; deadline: Date; daysLeft: number }>;
      }
    >();

    for (const exp of expedientes) {
      if (!exp.deadline) continue;

      const daysLeft = daysUntil(exp.deadline);
      // Solo alertar en los umbrales exactos
      if (!THRESHOLDS_DAYS.some((t) => daysLeft <= t && daysLeft > 0)) continue;

      const userId = exp.createdBy.id;
      if (!byUser.has(userId)) {
        byUser.set(userId, { user: exp.createdBy, items: [] });
      }
      byUser.get(userId)!.items.push({
        id: exp.id,
        title: exp.title,
        number: exp.number,
        matter: exp.matter,
        deadline: exp.deadline,
        daysLeft,
      });
    }

    // Enviar un email por usuario
    for (const [, { user, items }] of byUser) {
      // Verificar que el usuario tiene notificaciones habilitadas
      const prefs = (user.notificationPreferences as Record<string, unknown>) || {};
      if (prefs.emailNotifications === false) {
        logger.info(`[deadline-notifier] Usuario ${user.email} tiene notificaciones desactivadas, omitiendo.`);
        continue;
      }

      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

      // Ordenar por urgencia (más urgente primero)
      items.sort((a, b) => a.daysLeft - b.daysLeft);

      try {
        await sendEmail({
          to: user.email,
          subject: `⚖️ Recordatorio: ${items.length} expediente${items.length !== 1 ? "s" : ""} con vencimiento próximo`,
          html: buildEmailHtml(userName, items),
          text: buildEmailText(userName, items),
        });

        // Marcar como notificados
        await prisma.expediente.updateMany({
          where: { id: { in: items.map((i) => i.id) } },
          data: { deadlineNotifiedAt: now },
        });

        logger.info(`[deadline-notifier] Email enviado a ${user.email} (${items.length} expedientes)`);
      } catch (emailErr) {
        logger.error(`[deadline-notifier] Error enviando email a ${user.email}`, emailErr);
      }
    }

    logger.info("[deadline-notifier] Verificación completada.");
  } catch (err) {
    logger.error("[deadline-notifier] Error en el notificador de vencimientos", err);
  }
}
