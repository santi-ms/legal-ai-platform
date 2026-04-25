import nodemailer from "nodemailer";
import { ServerClient } from "postmark";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { logger } from "../utils/logger.js";
import {
  otpEmailTemplate,
  passwordResetEmailTemplate,
  inviteEmailTemplate,
} from "./email-templates.js";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  success: true;
  provider: "resend" | "postmark" | "smtp" | "logger";
  messageId?: string;
}

interface EmailSender {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
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

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || "Legal AI <noreply@legal-ai-platform.com>";
}

class ResendEmailSender implements EmailSender {
  private readonly client = new Resend(process.env.RESEND_API_KEY || "");

  async send({ to, subject, html, text }: SendEmailOptions): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: getEmailFrom(),
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      provider: "resend",
      messageId: data?.id,
    };
  }
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
  async send({ to, subject }: SendEmailOptions): Promise<SendEmailResult> {
    logger.warn("Email fallback - would send email", { to, subject });
    // El contenido del email NO se loguea por seguridad

    return {
      success: true,
      provider: "logger",
    };
  }
}

function getEmailSender(): EmailSender {
  if (isResendConfigured()) {
    return new ResendEmailSender();
  }

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
  return passwordResetEmailTemplate(verificationUrl);
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
  return otpEmailTemplate(code, expiresInMinutes);
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
  return passwordResetEmailTemplate(resetUrl);
}

// ─── Plantilla de invitación de equipo ────────────────────────────────────────

export function getTeamInvitationEmailHtml(
  inviterName: string,
  tenantName: string,
  inviteUrl: string,
  _expiresInHours: number
): string {
  return inviteEmailTemplate(inviterName, tenantName, inviteUrl);
}

export function getTeamInvitationEmailText(
  inviterName: string,
  tenantName: string,
  inviteUrl: string,
  expiresInHours: number
): string {
  return `
Te invitaron a unirte a ${tenantName} en DocuLex

${inviterName} te invitó a colaborar en ${tenantName} en DocuLex.

Aceptá la invitación entrando a:
${inviteUrl}

Esta invitación expira en ${expiresInHours} horas.

Si no esperabas esta invitación, podés ignorar este email.
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
