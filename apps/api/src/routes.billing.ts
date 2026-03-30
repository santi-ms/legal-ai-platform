/**
 * Billing Routes — Suscripciones y pagos con Mercado Pago
 *
 * GET  /api/billing/plans                  — Listar planes disponibles
 * GET  /api/billing/subscription           — Obtener suscripción actual del tenant
 * POST /api/billing/checkout               — Crear preferencia de pago en MP
 * DELETE /api/billing/subscription         — Cancelar suscripción
 * GET  /api/billing/invoices               — Historial de facturas
 * POST /api/webhooks/mercado-pago          — Webhook de MP (sin auth)
 */

import { FastifyInstance } from "fastify";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

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
    // Fallback: buscar plan free
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    return { subscription: null, plan: freePlan };
  }

  // Si está en trial y ya venció → tratar como free
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
  // ── GET /api/billing/plans ──────────────────────────────────────────────────
  app.get("/api/billing/plans", async (_req, reply) => {
    const plans = await prisma.plan.findMany({
      orderBy: { priceArs: "asc" },
    });
    return reply.send({ ok: true, plans });
  });

  // ── GET /api/billing/subscription ──────────────────────────────────────────
  app.get("/api/billing/subscription", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { subscription, plan } = await getPlanForTenant(user.tenantId);

    // Contar documentos este mes
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
      usage: {
        docsThisMonth,
      },
    });
  });

  // ── POST /api/billing/checkout ─────────────────────────────────────────────
  app.post("/api/billing/checkout", async (request, reply) => {
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

    // Calcular monto y usuarios
    const totalUsers = planCode === "estudio" ? Math.max(3, 3 + additionalUsers) : 1;
    const totalAmount = (plan.priceArs ?? 0) * totalUsers;

    const frontendUrl = process.env.FRONTEND_URL ?? "https://doculex.com.ar";

    try {
      const mpClient = getMPClient();
      const preference = new Preference(mpClient);

      const planLabel =
        planCode === "estudio"
          ? `${plan.name} (${totalUsers} usuarios)`
          : plan.name;

      const prefResult = await preference.create({
        body: {
          items: [
            {
              id: planCode,
              title: `DocuLex ${planLabel}`,
              description: (plan as any).description,
              quantity: 1,
              unit_price: totalAmount,
              currency_id: "ARS",
            },
          ],
          payer: {
            email: user.email ?? undefined,
          },
          back_urls: {
            success: `${frontendUrl}/settings/billing?status=success&plan=${planCode}`,
            failure: `${frontendUrl}/settings/billing?status=failure`,
            pending: `${frontendUrl}/settings/billing?status=pending`,
          },
          auto_return: "approved",
          metadata: {
            tenantId: user.tenantId,
            userId: user.userId,
            planCode,
            totalUsers,
          },
          statement_descriptor: "DOCULEX",
          notification_url: `${process.env.API_URL ?? "https://api-production-8cad.up.railway.app"}/api/webhooks/mercado-pago`,
        },
      });

      // Guardar/actualizar Subscription en estado pendiente
      const existingSubscription = await prisma.subscription.findUnique({
        where: { tenantId: user.tenantId },
      });

      if (existingSubscription) {
        await prisma.subscription.update({
          where: { tenantId: user.tenantId },
          data: {
            planId: plan.id,
            status: "pending_payment",
            maxUsers: totalUsers,
            mpPreferenceId: prefResult.id ?? null,
            renewsAt: null,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            tenantId: user.tenantId,
            planId: plan.id,
            status: "pending_payment",
            maxUsers: totalUsers,
            mpPreferenceId: prefResult.id ?? null,
            startsAt: new Date(),
          },
        });
      }

      return reply.send({
        ok: true,
        checkoutUrl: prefResult.init_point,
        sandboxUrl: prefResult.sandbox_init_point,
        preferenceId: prefResult.id,
      });
    } catch (err: any) {
      console.error("[billing/checkout] Error:", err);
      return reply.status(500).send({
        ok: false,
        error: "MP_ERROR",
        message: "Error al crear preferencia de pago",
      });
    }
  });

  // ── DELETE /api/billing/subscription ───────────────────────────────────────
  app.delete("/api/billing/subscription", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!subscription) {
      return reply.status(404).send({ ok: false, error: "NO_SUBSCRIPTION" });
    }

    // Cancelar en BD
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "canceled",
        renewsAt: null,
      },
    });

    // Volver a plan free
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { currentPlanCode: "free" },
    });

    // Reasignar al plan free
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    if (freePlan) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { planId: freePlan.id, maxUsers: 1 },
      });
    }

    return reply.send({ ok: true, message: "Suscripción cancelada. Tu plan vuelve a Free." });
  });

  // ── GET /api/billing/invoices ───────────────────────────────────────────────
  app.get("/api/billing/invoices", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!subscription) {
      return reply.send({ ok: true, invoices: [] });
    }

    const invoices = await prisma.invoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: "desc" },
      take: 24,
    });

    return reply.send({ ok: true, invoices });
  });

  // ── POST /api/webhooks/mercado-pago ─────────────────────────────────────────
  // SIN autenticación — llamado directamente por Mercado Pago
  app.post("/api/webhooks/mercado-pago", async (request, reply) => {
    const body = request.body as any;

    // MP envía distintos tipos de notificaciones
    if (body?.type !== "payment" && body?.action !== "payment.updated" && body?.action !== "payment.created") {
      return reply.send({ ok: true });
    }

    const paymentId = body?.data?.id;
    if (!paymentId) return reply.send({ ok: true });

    try {
      const mpClient = getMPClient();
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get({ id: paymentId });

      const metadata = (payment as any).metadata ?? {};
      const tenantId = metadata.tenant_id ?? metadata.tenantId;
      const planCode = metadata.plan_code ?? metadata.planCode;
      const totalUsers = parseInt(metadata.total_users ?? metadata.totalUsers ?? "1", 10);

      if (!tenantId || !planCode) {
        console.warn("[webhook/mp] Metadata incompleta:", metadata);
        return reply.send({ ok: true });
      }

      const plan = await prisma.plan.findUnique({ where: { code: planCode } });
      if (!plan) return reply.send({ ok: true });

      const status = (payment as any).status;
      const now = new Date();

      if (status === "approved") {
        // Calcular trial y renovación
        const trialDays = (plan as any).trialDays ?? 0;
        const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 86400000) : null;
        const renewsAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        // Actualizar suscripción
        await prisma.subscription.upsert({
          where: { tenantId },
          create: {
            tenantId,
            planId: plan.id,
            status: trialEndsAt ? "trialing" : "active",
            trialEndsAt,
            startsAt: now,
            renewsAt,
            maxUsers: totalUsers,
            mpPayerId: String((payment as any).payer?.id ?? ""),
          },
          update: {
            planId: plan.id,
            status: trialEndsAt ? "trialing" : "active",
            trialEndsAt,
            renewsAt,
            maxUsers: totalUsers,
            mpPayerId: String((payment as any).payer?.id ?? ""),
          },
        });

        // Actualizar plan del tenant
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { currentPlanCode: planCode },
        });

        // Registrar factura
        const subscription = await prisma.subscription.findUnique({ where: { tenantId } });
        if (subscription) {
          const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          await prisma.invoice.create({
            data: {
              subscriptionId: subscription.id,
              mpPaymentId: String(paymentId),
              status: "approved",
              amountArs: (payment as any).transaction_amount ?? 0,
              period,
              dueAt: renewsAt,
              paidAt: now,
            },
          });
        }
      } else if (status === "rejected" || status === "cancelled") {
        // Revertir a free si falla el pago
        await prisma.subscription.updateMany({
          where: { tenantId },
          data: { status: "canceled" },
        });
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { currentPlanCode: "free" },
        });
      }

      return reply.send({ ok: true });
    } catch (err: any) {
      console.error("[webhook/mp] Error procesando pago:", err?.message);
      return reply.status(200).send({ ok: true }); // Siempre 200 para que MP no reintente
    }
  });
}
