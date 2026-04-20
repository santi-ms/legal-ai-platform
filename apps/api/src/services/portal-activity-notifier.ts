/**
 * Portal Activity Notifier Service
 *
 * Corre después de cada sync (o separado) y envía emails cuando
 * hay actividad nueva en expedientes scrapeados del portal judicial.
 *
 * Lógica:
 *   - Busca expedientes con portalNewActivity = true
 *   - Agrupa por usuario (createdById)
 *   - Envía un email por usuario con el resumen de actividad
 *   - Resetea portalNewActivity = false en los expedientes notificados
 */

import { prisma } from "../db.js";
import { sendEmail } from "./email.js";
import { logger } from "../utils/logger.js";

function formatDateAR(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

interface ActivityItem {
  id: string;
  title: string;
  number: string | null;
  matter: string;
  portalStatus: string | null;
  portalLastMovimiento: string | null;
  portalMovimientoAt: Date | null;
}

function buildEmailHtml(
  userName: string,
  items: ActivityItem[],
  frontendUrl: string
): string {
  const rows = items
    .map((item) => {
      const fecha = item.portalMovimientoAt ? formatDateAR(item.portalMovimientoAt) : "—";
      const movimiento = item.portalLastMovimiento
        ? item.portalLastMovimiento.substring(0, 120) + (item.portalLastMovimiento.length > 120 ? "…" : "")
        : "—";
      const statusBadge = item.portalStatus
        ? `<span style="background: #dbeafe; color: #1d4ed8; border-radius: 4px; padding: 1px 6px; font-size: 11px;">${item.portalStatus}</span>`
        : "";

      return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px;">
          <strong style="color: #0f172a; display: block;">${item.title}</strong>
          ${item.number ? `<span style="color: #64748b; font-size: 12px;">Nº ${item.number}</span>` : ""}
          <br><span style="color: #64748b; font-size: 11px; text-transform: capitalize;">${item.matter}</span>
        </td>
        <td style="padding: 12px 16px; font-size: 13px; white-space: nowrap;">
          <span style="color: #64748b; font-size: 12px;">${fecha}</span>
          ${statusBadge ? `<br>${statusBadge}` : ""}
        </td>
        <td style="padding: 12px 16px; font-size: 13px; color: #334155; max-width: 240px;">
          ${movimiento}
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 680px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px 22px;">
      <div style="color: white; font-size: 20px; font-weight: 700;">⚖️ DocuLex</div>
      <div style="color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px;">Actividad nueva en el Portal Judicial</div>
    </div>

    <!-- Body -->
    <div style="padding: 28px 32px;">
      <p style="color: #334155; font-size: 15px; margin: 0 0 6px;">Hola, <strong>${userName}</strong></p>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 20px;">
        Detectamos actividad nueva en <strong>${items.length} expediente${items.length !== 1 ? "s" : ""}</strong>
        desde el portal judicial:
      </p>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 14px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 9px 16px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Expediente</th>
            <th style="padding: 9px 16px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Fecha</th>
            <th style="padding: 9px 16px; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Último movimiento</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <!-- CTA -->
      <div style="margin-top: 24px; text-align: center;">
        <a href="${frontendUrl}/expedientes?portalActivity=true"
           style="display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Ver expedientes →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 18px 32px; border-top: 1px solid #e2e8f0; background: #f8fafc;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
        Alerta automática de DocuLex — Portal Judicial.<br>
        Podés desactivar estas notificaciones desde <a href="${frontendUrl}/settings" style="color: #6366f1;">tu perfil</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText(
  userName: string,
  items: ActivityItem[],
  frontendUrl: string
): string {
  const lines = items.map((item) => {
    const mov = item.portalLastMovimiento ? ` — ${item.portalLastMovimiento.substring(0, 80)}` : "";
    return `• ${item.title}${item.number ? ` (Nº ${item.number})` : ""}${mov}`;
  });
  return `Hola ${userName},\n\nHay actividad nueva en ${items.length} expediente(s) del portal judicial:\n\n${lines.join("\n")}\n\nVerlos en: ${frontendUrl}/expedientes\n\n— DocuLex`;
}

export async function runPortalActivityNotifier(): Promise<void> {
  logger.info("[portal-activity-notifier] Verificando actividad nueva...");

  const frontendUrl = process.env.FRONTEND_URL || "https://legal-ai-platform.vercel.app";

  try {
    const expedientes = await prisma.expediente.findMany({
      where: {
        portalNewActivity: true,
        portalSyncEnabled: true,
      },
      select: {
        id:                   true,
        title:                true,
        number:               true,
        matter:               true,
        portalStatus:         true,
        portalLastMovimiento: true,
        portalMovimientoAt:   true,
        createdById:          true,
        createdBy: {
          select: {
            id:                      true,
            email:                   true,
            firstName:               true,
            lastName:                true,
            notificationPreferences: true,
          },
        },
      },
    });

    if (expedientes.length === 0) {
      logger.info("[portal-activity-notifier] Sin actividad nueva.");
      return;
    }

    // Group by user
    const byUser = new Map<
      string,
      { user: (typeof expedientes)[0]["createdBy"]; items: ActivityItem[] }
    >();

    for (const exp of expedientes) {
      const userId = exp.createdById;
      if (!byUser.has(userId)) {
        byUser.set(userId, { user: exp.createdBy, items: [] });
      }
      byUser.get(userId)!.items.push({
        id:                   exp.id,
        title:                exp.title,
        number:               exp.number,
        matter:               exp.matter,
        portalStatus:         exp.portalStatus,
        portalLastMovimiento: exp.portalLastMovimiento,
        portalMovimientoAt:   exp.portalMovimientoAt,
      });
    }

    const notifiedIds: string[] = [];

    for (const [, { user, items }] of byUser) {
      // Respect user notification preferences
      const prefs = (user.notificationPreferences as Record<string, unknown>) || {};
      if (prefs.emailNotifications === false || prefs.portalActivityEmails === false) {
        logger.info(`[portal-activity-notifier] ${user.email} tiene notificaciones de portal desactivadas — no se marca como notificado`);
        // No se envió email → NO marcar portalNewActivity como false
        continue;
      }

      const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

      try {
        await sendEmail({
          to: user.email,
          subject: `🏛️ DocuLex — Actividad nueva en ${items.length} expediente${items.length !== 1 ? "s" : ""} del portal`,
          html: buildEmailHtml(userName, items, frontendUrl),
          text: buildEmailText(userName, items, frontendUrl),
        });

        notifiedIds.push(...items.map((i) => i.id));
        logger.info(`[portal-activity-notifier] Email enviado a ${user.email} (${items.length} expedientes)`);
      } catch (emailErr) {
        logger.error(`[portal-activity-notifier] Error enviando email a ${user.email}`, emailErr);
      }
    }

    // Clear portalNewActivity flag
    if (notifiedIds.length > 0) {
      await prisma.expediente.updateMany({
        where: { id: { in: notifiedIds } },
        data:  { portalNewActivity: false },
      });
      logger.info(`[portal-activity-notifier] Reseteados ${notifiedIds.length} expedientes.`);
    }
  } catch (err) {
    logger.error("[portal-activity-notifier] Error inesperado", err);
  }
}
