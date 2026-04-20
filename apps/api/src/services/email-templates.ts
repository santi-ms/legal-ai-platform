/**
 * Responsive email templates for the platform.
 * Uses inline CSS for maximum email client compatibility.
 */

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1a1a2e;
`;

const BUTTON_STYLE = `
  display: inline-block;
  background-color: #4f46e5;
  color: #ffffff !important;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  margin: 16px 0;
`;

function baseTemplate(content: string, previewText = ''): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Doculex</title>
  ${previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>` : ''}
</head>
<body style="margin:0;padding:0;background:#f5f5f5;${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Doculex</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
                © ${new Date().getFullYear()} Doculex. Todos los derechos reservados.<br>
                Si no solicitaste este email, podés ignorarlo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpEmailTemplate(code: string, expiresMinutes = 10): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Verificá tu email</h2>
    <p style="margin:0 0 24px;color:#4b5563;">Tu código de verificación es:</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#4f46e5;">${code}</span>
    </div>
    <p style="margin:0;color:#6b7280;font-size:14px;">Este código expira en ${expiresMinutes} minutos.</p>
  `, `Tu código de verificación: ${code}`);
}

export function passwordResetEmailTemplate(resetUrl: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Restablecer contraseña</h2>
    <p style="margin:0 0 24px;color:#4b5563;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <a href="${resetUrl}" style="${BUTTON_STYLE}">Restablecer contraseña</a>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px;">
      Este enlace expira en 1 hora. Si no solicitaste esto, ignorá este email.
    </p>
  `, 'Restablecé tu contraseña de Doculex');
}

export function inviteEmailTemplate(inviterName: string, tenantName: string, inviteUrl: string): string {
  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Te invitaron a Doculex</h2>
    <p style="margin:0 0 24px;color:#4b5563;">
      <strong>${inviterName}</strong> te invitó a unirte al equipo <strong>${tenantName}</strong> en Doculex.
    </p>
    <a href="${inviteUrl}" style="${BUTTON_STYLE}">Aceptar invitación</a>
    <p style="margin:16px 0 0;color:#6b7280;font-size:14px;">Esta invitación expira en 7 días.</p>
  `, `${inviterName} te invitó a Doculex`);
}

export function deadlineAlertEmailTemplate(items: Array<{title: string; daysLeft: number; type: string}>): string {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
        <strong style="color:#1a1a2e;">${item.title}</strong>
        <span style="font-size:12px;color:#6b7280;display:block;">${item.type}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">
        <span style="color:${item.daysLeft <= 1 ? '#dc2626' : item.daysLeft <= 3 ? '#d97706' : '#059669'};font-weight:600;">
          ${item.daysLeft === 0 ? 'Hoy' : item.daysLeft === 1 ? 'Mañana' : `En ${item.daysLeft} días`}
        </span>
      </td>
    </tr>
  `).join('');

  return baseTemplate(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Vencimientos próximos</h2>
    <p style="margin:0 0 24px;color:#4b5563;">Tenés ${items.length} vencimiento${items.length > 1 ? 's' : ''} próximo${items.length > 1 ? 's' : ''}:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      ${itemsHtml}
    </table>
  `, `Tenés ${items.length} vencimientos próximos`);
}
