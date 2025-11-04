import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_PORT === "465", // true para 465, false para otros
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Legal AI <noreply@legal-ai-platform.com>",
      to,
      subject,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error enviando email:", error);
    throw new Error(`Error enviando email: ${error.message}`);
  }
}

// Generar token aleatorio para verificación/reset
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Plantilla de email de verificación
export function getVerificationEmailHtml(verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verifica tu cuenta</h1>
    <p>Gracias por registrarte en Legal AI Platform. Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el siguiente botón:</p>
    <a href="${verificationUrl}" class="button">Verificar Email</a>
    <p>O copia y pega este enlace en tu navegador:</p>
    <p style="word-break: break-all; color: #10b981;">${verificationUrl}</p>
    <p>Este enlace expirará en 24 horas.</p>
    <div class="footer">
      <p>Si no creaste una cuenta en Legal AI Platform, puedes ignorar este email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getVerificationEmailText(verificationUrl: string): string {
  return `
Verifica tu cuenta

Gracias por registrarte en Legal AI Platform. Para completar tu registro, por favor verifica tu dirección de email visitando el siguiente enlace:

${verificationUrl}

Este enlace expirará en 24 horas.

Si no creaste una cuenta en Legal AI Platform, puedes ignorar este email.
  `.trim();
}

// Plantilla de email de reset de contraseña
export function getResetPasswordEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Restablecer contraseña</h1>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Legal AI Platform.</p>
    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
    <p>O copia y pega este enlace en tu navegador:</p>
    <p style="word-break: break-all; color: #10b981;">${resetUrl}</p>
    <p>Este enlace expirará en 1 hora.</p>
    <p><strong>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</strong></p>
    <div class="footer">
      <p>Por seguridad, no compartas este enlace con nadie.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getResetPasswordEmailText(resetUrl: string): string {
  return `
Restablecer contraseña

Recibimos una solicitud para restablecer la contraseña de tu cuenta en Legal AI Platform.

Visita el siguiente enlace para crear una nueva contraseña:

${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este email de forma segura.
  `.trim();
}
