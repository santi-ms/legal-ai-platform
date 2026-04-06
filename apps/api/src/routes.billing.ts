/**
 * Billing Routes — Suscripciones recurrentes con Mercado Pago PreApproval
 *
 * GET    /billing/plans                  — Listar planes disponibles
 * GET    /billing/subscription           — Obtener suscripción actual del tenant
 * POST   /billing/checkout               — Crear suscripción recurrente en MP (PreApproval)
 * DELETE /billing/subscription           — Cancelar suscripción (en MP + nuestra BD)
 * GET    /billing/invoices               — Historial de facturas
 *
 * Webhooks (sin auth — llamados directamente por Mercado Pago):
 * POST   /api/webhooks/mercado-pago      — Pagos y cambios de estado de suscripción
 */

import { FastifyInstance } from "fastify";
import { MercadoPagoConfig, PreApproval, Payment } from "mercadopago";
import { createHmac } from "node:crypto";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

// ─── Webhook signature verification ──────────────────────────────────────────
// MP firma los webhooks con HMAC-SHA256 usando el secret del panel de MP.
// Header x-signature = "ts=<timestamp>,v1=<hmac>"
// El mensaje firmado es: "id:<dataId>;request-id:<x-request-id>;ts:<timestamp>"
//
// Para activar: agregar MP_WEBHOOK_SECRET en Railway con el valor del
// "Clave secreta" de la sección Webhooks del panel de Mercado Pago.
// Sin la variable, la verificación se omite (con warning en logs).
function verifyMPWebhookSignature(
  request: any,
  dataId: string,
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhook/mp] MP_WEBHOOK_SECRET no configurado — omitiendo verificación de firma");
    return true; // dejar pasar hasta que se configure el secret
  }

  const xSignature  = request.headers["x-signature"] as string | undefined;
  const xRequestId  = request.headers["x-request-id"] as string | undefined;

  if (!xSignature || !xRequestId) {
    console.warn("[webhook/mp] Webhook sin x-signature o x-request-id — rechazado");
    return false;
  }

  // Extraer ts y v1 del header "ts=<ts>,v1=<hash>"
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [k, v] = part.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unauthorized(reply: any) {
  return reply.status(401).send({ ok: false, error: "UNAUTHORIZED", message: "Autenticación requerida" });
}

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getEndOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

function getNextMonthDate(from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, from.getDate());
}

// ─── Mercado Pago Client ──────────────────────────────────────────────────────

function getMPClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MP_ACCESS_TOKEN no configurado");
  return new MercadoPagoConfig({ accessToken });
}

// ─── Plan limits helper ───────────────────────────────────────────────────────

export async function getPlanForTenant(tenantId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription) {
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    return { subscription: null, plan: freePlan };
  }

  // Suscripciones pendientes de pago o canceladas → tratar como free
  // (el usuario inició un checkout pero no completó el pago, o fue cancelada)
  const INACTIVE_STATUSES = ["pending_payment", "canceled", "past_due"];
  if (INACTIVE_STATUSES.includes(subscription.status)) {
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    return { subscription: null, plan: freePlan };
  }

  // Si el trial venció → degradar a free
  if (
    subscription.status === "trialing" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt < new Date()
  ) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "past_due" },
    });
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { currentPlanCode: "free" },
    });
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    return { subscription, plan: freePlan };
  }

  return { subscription, plan: subscription.plan };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerBillingRoutes(app: FastifyInstance) {
  // ── GET /billing/plans ──────────────────────────────────────────────────────
  app.get("/billing/plans", async (_req, reply) => {
    const plans = await prisma.plan.findMany({ orderBy: { priceArs: "asc" } });
    return reply.send({ ok: true, plans });
  });

  // ── GET /billing/subscription ──────────────────────────────────────────────
  app.get("/billing/subscription", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { subscription, plan } = await getPlanForTenant(user.tenantId);

    const docsThisMonth = await prisma.document.count({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: getStartOfMonth(), lte: getEndOfMonth() },
      },
    });

    return reply.send({
      ok: true,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            trialEndsAt: subscription.trialEndsAt,
            startsAt: subscription.startsAt,
            renewsAt: subscription.renewsAt,
            maxUsers: subscription.maxUsers,
          }
        : null,
      plan: plan
        ? {
            code: (plan as any).code,
            name: (plan as any).name,
            priceArs: (plan as any).priceArs,
            trialDays: (plan as any).trialDays,
            limits: (plan as any).limits,
            features: (plan as any).features,
          }
        : null,
      usage: { docsThisMonth },
    });
  });

  // ── POST /billing/checkout ─────────────────────────────────────────────────
  // Crea una suscripción recurrente en MP (PreApproval).
  // El usuario es redirigido a init_point para autorizar el débito mensual.
  app.post("/billing/checkout", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { planCode, additionalUsers = 0 } = request.body as {
      planCode: string;
      additionalUsers?: number;
    };

    // Validar plan
    const plan = await prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan || planCode === "free") {
      return reply.status(400).send({ ok: false, error: "INVALID_PLAN", message: "Plan inválido" });
    }

    const totalUsers = planCode === "estudio" ? Math.max(3, 3 + additionalUsers) : 1;
    const totalAmount = (plan.priceArs ?? 0) * totalUsers;
    const trialDays = (plan as any).trialDays ?? 0;
    const frontendUrl = process.env.FRONTEND_URL ?? "https://doculex.com.ar";
    const apiUrl = process.env.API_URL ?? "https://api-production-8cad.up.railway.app";

    const planLabel = planCode === "estudio"
      ? `${(plan as any).name} (${totalUsers} usuarios)`
      : (plan as any).name;

    try {
      const mpClient = getMPClient();
      const preApproval = new PreApproval(mpClient);

      // start_date: si hay trial, el primer cobro es después del período de prueba
      const now = new Date();
      const startDate = trialDays > 0
        ? new Date(now.getTime() + trialDays * 86_400_000)
        : now;

      // external_reference: guardamos tenantId + planCode + usuarios para el webhook
      const externalRef = JSON.stringify({
        tenantId: user.tenantId,
        planCode,
        totalUsers,
      });

      const result = await preApproval.create({
        body: {
          reason: `DocuLex ${planLabel}`,
          external_reference: externalRef,
          payer_email: user.email ?? undefined,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: totalAmount,
            currency_id: "ARS",
            start_date: startDate.toISOString(),
          } as any,
          back_url: `${frontendUrl}/settings/billing?plan=${planCode}`,
          notification_url: `${apiUrl}/api/webhooks/mercado-pago`,
          status: "pending",
        } as any,
      });

      // Guardar/actualizar Subscription en estado pending_payment
      await prisma.subscription.upsert({
        where: { tenantId: user.tenantId },
        create: {
          tenantId: user.tenantId,
          planId: plan.id,
          status: "pending_payment",
          maxUsers: totalUsers,
          mpSubscriptionId: String(result.id ?? ""),
          startsAt: now,
        },
        update: {
          planId: plan.id,
          status: "pending_payment",
          maxUsers: totalUsers,
          mpSubscriptionId: String(result.id ?? ""),
          renewsAt: null,
        },
      });

      return reply.send({
        ok: true,
        checkoutUrl: (result as any).init_point,
        subscriptionId: result.id,
      });
    } catch (err: any) {
      const detail = err?.cause?.message ?? err?.message ?? String(err);
      const mpDetail = err?.cause ?? err?.response?.data ?? null;
      console.error("[billing/checkout] Error:", detail, mpDetail);
      return reply.status(500).send({
        ok: false,
        error: "MP_ERROR",
        message: detail,
        detail: mpDetail,
      });
    }
  });

  // ── DELETE /billing/subscription ───────────────────────────────────────────
  app.delete("/billing/subscription", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!subscription) {
      return reply.status(404).send({ ok: false, error: "NO_SUBSCRIPTION" });
    }

    // Cancelar la suscripción en Mercado Pago (para que no siga cobrando)
    if (subscription.mpSubscriptionId) {
      try {
        const mpClient = getMPClient();
        const preApproval = new PreApproval(mpClient);
        await preApproval.update({
          id: subscription.mpSubscriptionId,
          body: { status: "cancelled" } as any,
        });
        console.log("[billing/cancel] Suscripción MP cancelada:", subscription.mpSubscriptionId);
      } catch (err: any) {
        // No fallar si MP falla — igual cancelamos en nuestra BD
        console.warn("[billing/cancel] Error cancelando en MP:", err?.message);
      }
    }

    // Degradar a free en nuestra BD
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        renewsAt: null,
        planId: freePlan?.id ?? subscription.planId,
        maxUsers: 1,
      },
    });

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { currentPlanCode: "free" },
    });

    return reply.send({ ok: true, message: "Suscripción cancelada. Tu plan vuelve a Free." });
  });

  // ── GET /billing/invoices ───────────────────────────────────────────────────
  app.get("/billing/invoices", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!subscription) return reply.send({ ok: true, invoices: [] });

    const invoices = await prisma.invoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: "desc" },
      take: 24,
    });

    return reply.send({ ok: true, invoices });
  });

  // ── POST /api/webhooks/mercado-pago ─────────────────────────────────────────
  // SIN autenticación — llamado directamente por Mercado Pago.
  //
  // Maneja dos tipos de eventos:
  //   1. subscription_preapproval → cambio de estado de la suscripción
  //      (authorized → activar, cancelled/paused → degradar a free)
  //   2. subscription_authorized_payment → pago mensual procesado
  //      (registrar factura, actualizar renewsAt)
  //   3. payment → pago puntual (legacy / test)
  app.post("/api/webhooks/mercado-pago", async (request, reply) => {
    // Siempre responder 200 para que MP no reintente indefinidamente
    reply.send({ ok: true });

    const body = request.body as any;
    const type = body?.type ?? "";
    const dataId = body?.data?.id;

    if (!dataId) return;

    // Verificar firma HMAC-SHA256 de Mercado Pago
    if (!verifyMPWebhookSignature(request, String(dataId))) {
      console.warn(`[webhook/mp] Firma inválida — evento descartado (tipo=${type} id=${dataId})`);
      return;
    }

    console.log(`[webhook/mp] tipo=${type} id=${dataId}`);

    try {
      const mpClient = getMPClient();

      // ── 1. Cambio de estado de suscripción ────────────────────────────────
      if (type === "subscription_preapproval") {
        const preApproval = new PreApproval(mpClient);
        const sub = await preApproval.get({ id: String(dataId) }) as any;

        const externalRef = sub?.external_reference;
        if (!externalRef) {
          console.warn("[webhook/mp] Sin external_reference en preapproval:", dataId);
          return;
        }

        let parsed: { tenantId: string; planCode: string; totalUsers: number };
        try {
          parsed = JSON.parse(externalRef);
        } catch {
          console.warn("[webhook/mp] external_reference no es JSON:", externalRef);
          return;
        }

        const { tenantId, planCode, totalUsers } = parsed;
        const plan = await prisma.plan.findUnique({ where: { code: planCode } });
        if (!plan) return;

        const mpStatus = sub?.status; // "authorized" | "paused" | "cancelled" | "pending"
        const now = new Date();

        if (mpStatus === "authorized") {
          const trialDays = (plan as any).trialDays ?? 0;

          if (trialDays === 0) {
            // Sin período de prueba: "authorized" en MP significa que el usuario vio la
            // pantalla de pago, pero NO garantiza que haya completado el cobro.
            // Solo actualizamos el mpSubscriptionId para que el webhook de pago
            // (`subscription_authorized_payment`) pueda encontrar la suscripción.
            // El plan se activa recién cuando se confirma el primer pago real.
            await prisma.subscription.updateMany({
              where: { tenantId, status: "pending_payment" },
              data: {
                mpSubscriptionId: String(dataId),
                mpPayerId: String(sub?.payer_id ?? ""),
              },
            });
            console.log(`[webhook/mp] PreApproval authorized sin trial, esperando primer pago: tenant=${tenantId}`);
            return;
          }

          // Con período de prueba: activar como trialing ya que el usuario autorizó
          // el débito futuro y el trial comienza inmediatamente (sin cobro inicial).
          const trialEndsAt = new Date(now.getTime() + trialDays * 86_400_000);
          const renewsAt = getNextMonthDate(now);

          await prisma.subscription.upsert({
            where: { tenantId },
            create: {
              tenantId,
              planId: plan.id,
              status: "trialing",
              trialEndsAt,
              startsAt: now,
              renewsAt,
              maxUsers: totalUsers,
              mpSubscriptionId: String(dataId),
              mpPayerId: String(sub?.payer_id ?? ""),
            },
            update: {
              planId: plan.id,
              status: "trialing",
              trialEndsAt,
              renewsAt,
              maxUsers: totalUsers,
              mpSubscriptionId: String(dataId),
              mpPayerId: String(sub?.payer_id ?? ""),
            },
          });

          await prisma.tenant.update({
            where: { id: tenantId },
            data: { currentPlanCode: planCode },
          });

          console.log(`[webhook/mp] ✅ Trial activado: tenant=${tenantId} plan=${planCode} trial=${trialDays}d`);

        } else if (mpStatus === "cancelled" || mpStatus === "paused") {
          // Suscripción cancelada o pausada → degradar a free
          const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
          await prisma.subscription.updateMany({
            where: { tenantId },
            data: {
              status: mpStatus === "paused" ? "paused" : "canceled",
              renewsAt: null,
              planId: freePlan?.id,
              maxUsers: 1,
            },
          });
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { currentPlanCode: "free" },
          });
          console.log(`[webhook/mp] Suscripción ${mpStatus}: tenant=${tenantId}`);
        }

        return;
      }

      // ── 2. Pago mensual de suscripción ─────────────────────────────────────
      if (type === "subscription_authorized_payment" || type === "payment") {
        const paymentClient = new Payment(mpClient);
        const payment = await paymentClient.get({ id: dataId }) as any;

        const status = payment?.status;
        if (status !== "approved") return;

        const now = new Date();

        // Para subscription_authorized_payment, el preapproval ID viene en el objeto
        const preapprovalId = payment?.metadata?.preapproval_id
          ?? payment?.point_of_interaction?.transaction_data?.subscription_id
          ?? null;

        // Buscar nuestra suscripción por mpSubscriptionId o por metadata
        let tenantId: string | null = null;
        let planCode: string | null = null;
        let totalUsers = 1;

        if (preapprovalId) {
          const dbSub = await prisma.subscription.findFirst({
            where: { mpSubscriptionId: String(preapprovalId) },
            include: { plan: true },
          });
          if (dbSub) {
            tenantId = dbSub.tenantId;
            planCode = (dbSub.plan as any)?.code ?? null;
          }
        }

        // Fallback: metadata del pago (legacy / checkout pro)
        if (!tenantId) {
          const metadata = payment?.metadata ?? {};
          tenantId = metadata.tenant_id ?? metadata.tenantId ?? null;
          planCode = metadata.plan_code ?? metadata.planCode ?? null;
          totalUsers = parseInt(metadata.total_users ?? metadata.totalUsers ?? "1", 10);
        }

        if (!tenantId || !planCode) {
          console.warn("[webhook/mp] No se pudo identificar tenant del pago:", dataId);
          return;
        }

        // Actualizar renewsAt y registrar factura
        const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
        if (!subscription) return;

        const renewsAt = getNextMonthDate(now);
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { renewsAt, status: "active" },
        });

        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Evitar duplicar factura del mismo pago
        const existingInvoice = await prisma.invoice.findFirst({
          where: { mpPaymentId: String(dataId) },
        });
        if (!existingInvoice) {
          await prisma.invoice.create({
            data: {
              subscriptionId: subscription.id,
              mpPaymentId: String(dataId),
              status: "approved",
              amountArs: payment?.transaction_amount ?? 0,
              period,
              dueAt: renewsAt,
              paidAt: now,
            },
          });
        }

        console.log(`[webhook/mp] 💰 Pago registrado: tenant=${tenantId} monto=${payment?.transaction_amount}`);
        return;
      }

    } catch (err: any) {
      console.error("[webhook/mp] Error procesando webhook:", err?.message);
    }
  });
}
