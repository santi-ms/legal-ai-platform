import nodemailer from "nodemailer";
import { ServerClient } from "postmark";
import { randomBytes } from "crypto";
import { logger } from "../utils/logger.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  success: true;
  provider: "postmark" | "smtp" | "logger";
  messageId?: string;
}

interface EmailSender {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}

function extractOtpCodeFromText(text: string) {
  const match = text.match(/(?:^|\n)\s*(\d{6})\s*(?:\n|$)/);
  return match?.[1] ?? null;
}

function isSmtpConfigured() {
  return Boolean(
    process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_PORT &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD,
  );
}

function isPostmarkConfigured() {
  return Boolean(process.env.POSTMARK_SERVER_TOKEN);
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || "Legal AI <noreply@legal-ai-platform.com>";
}

class PostmarkEmailSender implements EmailSender {
  private readonly client = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || "");

  async send({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
    const response = await this.client.sendEmail({
      From: getEmailFrom(),
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
    });

    return {
      success: true,
      provider: "postmark",
      messageId: response.MessageID,
    };
  }
}

class SmtpEmailSender implements EmailSender {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587", 10),
    secure: process.env.EMAIL_SERVER_PORT === "465",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  async send({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
    const info = await this.transporter.sendMail({
      from: getEmailFrom(),
      to,
      subject,
      html,
      text,
    });

    return {
      success: true,
      provider: "smtp",
      messageId: info.messageId,
    };
  }
}

class LoggerEmailSender implements EmailSender {
  async send({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
    const otpCode = extractOtpCodeFromText(text);

    logger.warn("Email sender fallback in logger mode", {
      to,
      subject,
      otpCode,
      previewText: text,
      previewHtml: html.slice(0, 500),
    });

    return {
      success: true,
      provider: "logger",
    };
  }
}

function getEmailSender(): EmailSender {
  if (isPostmarkConfigured()) {
    return new PostmarkEmailSender();
  }

  if (isSmtpConfigured()) {
    return new SmtpEmailSender();
  }

  return new LoggerEmailSender();
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    return await getEmailSender().send(options);
  } catch (error: any) {
    logger.error("Error enviando email", error, { to: options.to, subject: options.subject });
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

export function getVerificationCodeEmailHtml(code: string, expiresInMinutes: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .code { display: inline-block; padding: 14px 20px; background-color: #0f172a; color: white; border-radius: 10px; font-size: 28px; letter-spacing: 8px; font-weight: bold; margin: 18px 0; }
    .hint { color: #64748b; font-size: 14px; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verificá tu correo</h1>
    <p>Usá el siguiente código para completar tu registro en Legal AI Platform:</p>
    <div class="code">${code}</div>
    <p>El código expira en ${expiresInMinutes} minutos.</p>
    <p class="hint">Si no solicitaste esta cuenta, podés ignorar este email.</p>
    <div class="footer">
      <p>No compartas este código con nadie.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getVerificationCodeEmailText(code: string, expiresInMinutes: number): string {
  return `
Verificá tu correo

Usá el siguiente código para completar tu registro en Legal AI Platform:

${code}

El código expira en ${expiresInMinutes} minutos.

No compartas este código con nadie.
Si no solicitaste esta cuenta, podés ignorar este email.
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
