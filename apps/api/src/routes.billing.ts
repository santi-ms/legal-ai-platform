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
import { MercadoPagoConfig, PreApproval, Payment, Preference } from "mercadopago";
import { createHmac } from "node:crypto";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";
import { auditLog } from "./services/audit-log.js";

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
    console.error("[webhook/mp] MP_WEBHOOK_SECRET no configurado — rechazando webhook");
    return false;
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
  const year  = from.getFullYear();
  const month = from.getMonth();
  const day   = from.getDate();
  // Último día del mes siguiente (ej: para enero→febrero, devuelve 28 o 29)
  const lastDayOfNextMonth = new Date(year, month + 2, 0).getDate();
  return new Date(year, month + 1, Math.min(day, lastDayOfNextMonth));
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

  // Suscripciones pendientes de pago o canceladas definitivamente → tratar como free
  const INACTIVE_STATUSES = ["pending_payment", "canceled", "past_due"];
  if (INACTIVE_STATUSES.includes(subscription.status)) {
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    return { subscription: null, plan: freePlan };
  }

  const now = new Date();

  // "canceling" = cancelación al final del período.
  // El usuario sigue con acceso hasta renewsAt; después baja a free.
  if (subscription.status === "canceling") {
    if (subscription.renewsAt && subscription.renewsAt < now) {
      // El período ya terminó → degradar
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "canceled" },
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { currentPlanCode: "free" },
      });
      const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
      return { subscription, plan: freePlan };
    }
    // Período activo → acceso normal al plan
    return { subscription, plan: subscription.plan };
  }

  // Si el trial venció → degradar a free
  if (
    subscription.status === "trialing" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt < now
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

// Dedup en memoria de webhooks de MP. Clave: x-request-id; valor: timestamp.
// Se limpia entradas viejas en cada hit del webhook (no necesita cron).
const mpWebhookSeen = new Map<string, number>();

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

    const monthRange = { gte: getStartOfMonth(), lte: getEndOfMonth() };
    const [
      docsThisMonth,
      analysesThisMonth,
      strategiesThisMonth,
      jurisMessagesThisMonth,
      clientsTotal,
      expedientesTotal,
      referenceStorageAgg,
    ] = await Promise.all([
      prisma.document.count({
        where: { tenantId: user.tenantId, createdAt: monthRange },
      }),
      prisma.contractAnalysis.count({
        where: { tenantId: user.tenantId, createdAt: monthRange },
      }),
      prisma.escritoAnalisis.count({
        where: { tenantId: user.tenantId, createdAt: monthRange },
      }),
      prisma.jurisMensaje.count({
        where: {
          role: "assistant",
          createdAt: monthRange,
          consulta: { tenantId: user.tenantId },
        },
      }),
      prisma.client.count({
        where: { tenantId: user.tenantId, archivedAt: null },
      }),
      prisma.expediente.count({
        where: { tenantId: user.tenantId, status: { not: "archivado" } },
      }),
      prisma.referenceDocument.aggregate({
        where: { tenantId: user.tenantId, deletedAt: null },
        _sum: { fileSize: true },
      }),
    ]);

    const referenceStorageMb = Math.round(
      ((referenceStorageAgg._sum.fileSize ?? 0) / (1024 * 1024)) * 10,
    ) / 10;

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
        analysesThisMonth,
        strategiesThisMonth,
        jurisMessagesThisMonth,
        clientsTotal,
        expedientesTotal,
        referenceStorageMb,
      },
    });
  });

  // ── POST /billing/checkout ─────────────────────────────────────────────────
  // Crea una suscripción recurrente en MP (PreApproval).
  // El usuario es redirigido a init_point para autorizar el débito mensual.
  app.post("/billing/checkout", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { planCode, additionalUsers = 0, payerEmail } = request.body as {
      planCode: string;
      additionalUsers?: number;
      payerEmail?: string;
    };

    // Validar plan
    const plan = await prisma.plan.findUnique({ where: { code: planCode } });
    if (!plan || planCode === "free") {
      return reply.status(400).send({ ok: false, error: "INVALID_PLAN", message: "Plan inválido" });
    }

    // Email para el PreApproval de MP. MP lo exige como required.
    // Preferimos el que el cliente nos pasa explícitamente (su mail de MP,
    // que puede diferir del de DocuLex); fallback al de la cuenta.
    const mpPayerEmail = (payerEmail?.trim() || user.email || "").toLowerCase();
    if (!mpPayerEmail || !mpPayerEmail.includes("@")) {
      return reply.status(400).send({
        ok: false,
        error: "PAYER_EMAIL_REQUIRED",
        message: "Necesitamos el email que vas a usar en Mercado Pago.",
      });
    }

    // Guardia: evitar checkout si el usuario ya tiene una suscripción vigente
    // a un plan PAGADO. De lo contrario, el upsert posterior pondría la
    // suscripción activa en "pending_payment", desactivándola mientras MP
    // sigue cobrando el plan anterior.
    //
    // Excepción: si el status figura activo pero el plan efectivo es Free
    // (puede pasar por drift de datos — webhook que degradó plan pero dejó
    // status activo, o suscripción vieja mal limpiada), dejamos pasar:
    // el usuario realmente no tiene nada pago y necesita poder suscribirse.
    const existingSub = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
      include: { plan: true },
    });
    const existingPlanCode = (existingSub?.plan as any)?.code ?? "";
    const isOnPaidPlan = existingSub && existingPlanCode && existingPlanCode !== "free";

    if (
      existingSub &&
      isOnPaidPlan &&
      (existingSub.status === "active" || existingSub.status === "trialing" || existingSub.status === "canceling")
    ) {
      if (existingPlanCode === planCode) {
        return reply.status(409).send({
          ok: false,
          error: "ALREADY_SUBSCRIBED",
          message: `Ya tenés el plan ${(plan as any).name} activo.`,
        });
      }
      // Plan diferente (upgrade/downgrade): el usuario debe cancelar primero.
      // Crear dos suscripciones activas en MP generaría cobros dobles.
      return reply.status(409).send({
        ok: false,
        error: "SUBSCRIPTION_ACTIVE",
        message: "Ya tenés una suscripción activa. Cancelá el plan actual antes de suscribirte a otro.",
      });
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

      // MP PreApproval exige payer_email como required. Debe coincidir con
      // el mail de la cuenta MP con la que el cliente autorice el débito.
      // El frontend pide al usuario ese mail antes del checkout; fallback
      // al mail de la cuenta DocuLex si no lo especifica.
      //
      // payment_methods_allowed: declaramos explícitamente qué medios aceptamos
      // en el checkout (tarjeta de crédito, débito y saldo en cuenta MP).
      // Sin esto, MP por defecto sólo muestra tarjetas y oculta "Dinero en
      // cuenta" — varios clientes con tarjeta rechazada por whitelist PreApproval
      // no tenían cómo completar el pago.
      const result = await preApproval.create({
        body: {
          reason: `DocuLex ${planLabel}`,
          external_reference: externalRef,
          payer_email: mpPayerEmail,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: totalAmount,
            currency_id: "ARS",
            start_date: startDate.toISOString(),
            payment_methods_allowed: [
              { payment_type: "credit_card" },
              { payment_type: "debit_card" },
              { payment_type: "account_money" },
            ],
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

  // ── POST /billing/change-plan ──────────────────────────────────────────────
  // Cambia el plan de un usuario que ya tiene suscripción activa o en trial.
  //
  // UPGRADE (precio nuevo > precio actual):
  //   Cobra la diferencia prorrateada por los días restantes del período.
  //   Crea un pago único en MP Checkout Pro. Al aprobarse, actualiza el
  //   PreApproval con el nuevo monto mensual y activa el plan inmediatamente.
  //   La fecha de renovación no cambia.
  //
  // DOWNGRADE (precio nuevo < precio actual):
  //   Cambia el plan de inmediato en la BD. Actualiza el monto del PreApproval
  //   para que el próximo ciclo cobre el precio menor. Sin cargo adicional.
  app.post("/billing/change-plan", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { planCode, additionalUsers = 0 } = request.body as {
      planCode: string;
      additionalUsers?: number;
    };

    const newPlan = await prisma.plan.findUnique({ where: { code: planCode } });
    if (!newPlan || planCode === "free") {
      return reply.status(400).send({ ok: false, error: "INVALID_PLAN", message: "Plan inválido" });
    }

    const existingSub = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
      include: { plan: true },
    });

    if (!existingSub || !["active", "trialing"].includes(existingSub.status)) {
      return reply.status(400).send({
        ok: false,
        error: "NO_ACTIVE_SUBSCRIPTION",
        message: "No tenés una suscripción activa para cambiar.",
      });
    }

    const existingPlanCode = (existingSub.plan as any)?.code ?? "";

    // Si el plan actual es Free no hay nada "de pagado" sobre lo cual prorratear:
    // el usuario debe ir por el flujo de checkout normal (/billing/checkout) para
    // autorizar una suscripción nueva. Devolver 409 para que el cliente reintente
    // por el path correcto.
    if (existingPlanCode === "free") {
      return reply.status(409).send({
        ok: false,
        error: "UPGRADE_FROM_FREE_USE_CHECKOUT",
        message: "Para pasar de Free a un plan pagado usá el flujo de checkout.",
      });
    }

    if (existingPlanCode === planCode) {
      return reply.status(409).send({ ok: false, error: "SAME_PLAN", message: "Ya estás en ese plan." });
    }

    const totalUsers          = planCode === "estudio" ? Math.max(3, 3 + additionalUsers) : 1;
    const newMonthlyAmount    = (newPlan.priceArs ?? 0) * totalUsers;
    const currentMonthlyAmount = ((existingSub.plan as any)?.priceArs ?? 0) * (existingSub.maxUsers ?? 1);
    const isUpgrade           = newMonthlyAmount > currentMonthlyAmount;
    const frontendUrl         = process.env.FRONTEND_URL ?? "https://doculex.com.ar";
    const apiUrl              = process.env.API_URL ?? "https://api-production-8cad.up.railway.app";
    const planLabel           = planCode === "estudio"
      ? `${(newPlan as any).name} (${totalUsers} usuarios)`
      : (newPlan as any).name;

    if (isUpgrade) {
      // ── Upgrade: prorrateo ──────────────────────────────────────────────────
      const now      = new Date();
      const renewsAt = existingSub.renewsAt ?? getNextMonthDate(existingSub.startsAt ?? now);
      const msRemaining   = Math.max(0, renewsAt.getTime() - now.getTime());
      const daysRemaining = Math.max(1, Math.ceil(msRemaining / 86_400_000));

      // Diferencia diaria × días restantes, redondeado al peso
      const proRataAmount = Math.round((newMonthlyAmount - currentMonthlyAmount) / 30 * daysRemaining);

      if (proRataAmount <= 0) {
        return reply.status(400).send({ ok: false, error: "NO_DIFFERENCE", message: "Sin diferencia de precio para prorratear." });
      }

      try {
        const mpClient = getMPClient();
        const preference = new Preference(mpClient);

        const prefResult = await preference.create({
          body: {
            items: [{
              id:          `upgrade-${user.tenantId}-${Date.now()}`,
              title:       `DocuLex — Cambio a ${planLabel}`,
              description: `Diferencia prorrateada: ${daysRemaining} días`,
              quantity:    1,
              unit_price:  proRataAmount,
              currency_id: "ARS",
            }] as any,
            metadata: {
              type:                "plan_upgrade",
              tenant_id:           user.tenantId,
              plan_code:           planCode,
              total_users:         String(totalUsers),
              mp_subscription_id:  existingSub.mpSubscriptionId ?? "",
              new_monthly_amount:  String(newMonthlyAmount),
            },
            back_urls: {
              success: `${frontendUrl}/settings/billing?plan=${planCode}`,
              failure: `${frontendUrl}/settings/billing`,
              pending: `${frontendUrl}/settings/billing?plan=${planCode}`,
            },
            auto_return: "approved",
            notification_url: `${apiUrl}/api/webhooks/mercado-pago`,
          } as any,
        });

        console.log(`[billing/change-plan] ⬆️ Upgrade iniciado: tenant=${user.tenantId} ${existingPlanCode}→${planCode} prorrateo=$${proRataAmount}`);

        return reply.send({
          ok:            true,
          type:          "upgrade",
          checkoutUrl:   (prefResult as any).init_point,
          proRataAmount,
          daysRemaining,
          renewsAt:      renewsAt.toISOString(),
        });
      } catch (err: any) {
        const detail = err?.cause?.message ?? err?.message ?? String(err);
        console.error("[billing/change-plan] Error creando preferencia MP:", detail);
        return reply.status(500).send({ ok: false, error: "MP_ERROR", message: detail });
      }
    } else {
      // ── Downgrade: cambio inmediato, sin cargo ──────────────────────────────
      // Actualizar el monto del PreApproval para que el próximo ciclo cobre menos
      if (existingSub.mpSubscriptionId) {
        try {
          const mpClient = getMPClient();
          const preApproval = new PreApproval(mpClient);
          await preApproval.update({
            id: existingSub.mpSubscriptionId,
            body: { auto_recurring: { transaction_amount: newMonthlyAmount } as any },
          });
          console.log(`[billing/change-plan] PreApproval actualizado para downgrade: ${existingSub.mpSubscriptionId} → $${newMonthlyAmount}/mes`);
        } catch (err: any) {
          console.warn("[billing/change-plan] No se pudo actualizar monto en MP:", err?.message);
        }
      }

      // Actualizar BD inmediatamente (renewsAt y status no cambian)
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: { planId: newPlan.id, maxUsers: totalUsers },
      });

      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: { currentPlanCode: planCode },
      });

      console.log(`[billing/change-plan] ⬇️ Downgrade: tenant=${user.tenantId} ${existingPlanCode}→${planCode}`);

      return reply.send({
        ok:          true,
        type:        "downgrade",
        newPlanName: (newPlan as any).name,
        renewsAt:    existingSub.renewsAt?.toISOString() ?? null,
      });
    }
  });

  // ── POST /billing/reactivate ───────────────────────────────────────────────
  // Deshace una cancelación pendiente ("canceling").
  // Crea un nuevo preapproval en MP con start_date = renewsAt, de modo que
  // el usuario no paga nada ahora y el primer cobro ocurre cuando termina
  // el período ya pagado.
  app.post("/billing/reactivate", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { payerEmail } = (request.body ?? {}) as { payerEmail?: string };
    const mpPayerEmail = (payerEmail?.trim() || user.email || "").toLowerCase();
    if (!mpPayerEmail || !mpPayerEmail.includes("@")) {
      return reply.status(400).send({
        ok: false,
        error: "PAYER_EMAIL_REQUIRED",
        message: "Necesitamos el email que vas a usar en Mercado Pago.",
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId: user.tenantId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== "canceling") {
      return reply.status(400).send({
        ok: false,
        error: "NOT_CANCELING",
        message: "Tu suscripción no está pendiente de cancelación.",
      });
    }

    const plan      = subscription.plan as any;
    const planCode  = plan?.code ?? "";
    const totalUsers = subscription.maxUsers ?? 1;
    const totalAmount = (plan?.priceArs ?? 0) * totalUsers;
    const frontendUrl = process.env.FRONTEND_URL ?? "https://doculex.com.ar";
    const apiUrl      = process.env.API_URL ?? "https://api-production-8cad.up.railway.app";
    const planLabel   = planCode === "estudio"
      ? `${plan?.name} (${totalUsers} usuarios)`
      : plan?.name ?? planCode;

    // El nuevo preapproval arranca a cobrar en renewsAt (el usuario ya pagó hasta ahí)
    const startDate = subscription.renewsAt ?? new Date();

    try {
      const mpClient  = getMPClient();
      const preApproval = new PreApproval(mpClient);

      // MP exige payer_email en PreApproval (ver /checkout arriba).
      // payment_methods_allowed: habilitar explícitamente crédito + débito +
      // saldo en cuenta MP (ver comentario en /billing/checkout).
      const result = await preApproval.create({
        body: {
          reason: `DocuLex ${planLabel}`,
          external_reference: JSON.stringify({
            tenantId:  user.tenantId,
            planCode,
            totalUsers,
            noTrial:   true,   // ← nunca iniciar trial en reactivaciones
          }),
          payer_email: mpPayerEmail,
          auto_recurring: {
            frequency:          1,
            frequency_type:     "months",
            transaction_amount: totalAmount,
            currency_id:        "ARS",
            start_date:         startDate.toISOString(),
            payment_methods_allowed: [
              { payment_type: "credit_card" },
              { payment_type: "debit_card" },
              { payment_type: "account_money" },
            ],
          } as any,
          back_url: `${frontendUrl}/settings/billing?plan=${planCode}`,
          notification_url: `${apiUrl}/api/webhooks/mercado-pago`,
          status: "pending",
        } as any,
      });

      // Actualizar el mpSubscriptionId al nuevo preapproval (el status sigue "canceling"
      // hasta que el usuario autorice en MP y llegue el webhook "authorized")
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { mpSubscriptionId: String(result.id ?? "") },
      });

      console.log(`[billing/reactivate] Nuevo preapproval creado: tenant=${user.tenantId} start=${startDate.toISOString()}`);

      return reply.send({ ok: true, checkoutUrl: (result as any).init_point });
    } catch (err: any) {
      const detail = err?.cause?.message ?? err?.message ?? String(err);
      console.error("[billing/reactivate] Error:", detail);
      return reply.status(500).send({ ok: false, error: "MP_ERROR", message: detail });
    }
  });

  // ── POST /billing/redeem-promo ─────────────────────────────────────────────
  // Permite a un usuario ya logueado canjear un código promocional para
  // obtener un trial de plan pago (Pro / Pro+ / Estudio).
  //
  // Reglas:
  //   - Solo desde plan "free" (si ya tiene plan pago, no se puede).
  //   - Código debe estar activo, no vencido y con usos disponibles.
  //   - Un tenant no puede canjear más de UN código (se registra el uso).
  //   - El trial es independiente de MP — no se crea PreApproval. Al vencer,
  //     la suscripción pasa a past_due y el tenant degrada a free salvo que
  //     haga checkout.
  app.post("/billing/redeem-promo", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { code } = (request.body ?? {}) as { code?: string };
    const normalizedCode = (code ?? "").trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length < 3) {
      return reply.status(400).send({
        ok: false,
        error: "INVALID_CODE",
        message: "Ingresá un código válido.",
      });
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        // 1. Verificar estado actual del tenant: no debe tener plan pago activo.
        const existingSub = await tx.subscription.findUnique({
          where: { tenantId: user.tenantId },
          include: { plan: true },
        });
        const existingPlanCode = existingSub?.plan?.code ?? "";
        const onPaidPlan = existingPlanCode && existingPlanCode !== "free";
        const activeStatus = ["active", "trialing", "canceling"].includes(existingSub?.status ?? "");
        if (existingSub && onPaidPlan && activeStatus) {
          return { status: 409, error: "ALREADY_ON_PAID_PLAN", message: "Ya tenés un plan pago activo. Los códigos promocionales son solo para cuentas Free." };
        }

        // 2. Un tenant solo puede canjear una vez.
        const previousUse = await tx.promoCodeUse.findFirst({
          where: { tenantId: user.tenantId },
        });
        if (previousUse) {
          return { status: 409, error: "ALREADY_REDEEMED", message: "Ya canjeaste un código promocional anteriormente." };
        }

        // 3. Buscar el código.
        const promo = await tx.promoCode.findUnique({ where: { code: normalizedCode } });
        if (!promo) {
          return { status: 404, error: "CODE_NOT_FOUND", message: "Código promocional inválido." };
        }
        if (!promo.isActive) {
          return { status: 410, error: "CODE_INACTIVE", message: "El código promocional ya no está activo." };
        }
        if (promo.expiresAt && promo.expiresAt < new Date()) {
          return { status: 410, error: "CODE_EXPIRED", message: "El código promocional está vencido." };
        }
        if (promo.maxUses !== -1 && promo.usedCount >= promo.maxUses) {
          return { status: 410, error: "CODE_EXHAUSTED", message: "El código promocional ya alcanzó su límite de usos." };
        }

        // 4. Resolver plan.
        const plan = await tx.plan.findUnique({ where: { code: promo.planCode } });
        if (!plan) {
          return { status: 500, error: "PLAN_NOT_FOUND", message: "Error interno: plan asociado al código no existe." };
        }

        // 5. Crear / actualizar suscripción en trial.
        const now = new Date();
        const trialEndsAt = new Date(now.getTime() + promo.trialDays * 86_400_000);

        await tx.subscription.upsert({
          where: { tenantId: user.tenantId },
          create: {
            tenantId: user.tenantId,
            planId: plan.id,
            status: "trialing",
            maxUsers: plan.code === "estudio" ? 3 : 1,
            startsAt: now,
            trialEndsAt,
          },
          update: {
            planId: plan.id,
            status: "trialing",
            maxUsers: plan.code === "estudio" ? 3 : 1,
            startsAt: now,
            trialEndsAt,
            renewsAt: null,
            mpSubscriptionId: null,
          },
        });

        await tx.tenant.update({
          where: { id: user.tenantId },
          data: { currentPlanCode: promo.planCode },
        });

        // 6. Registrar uso y aumentar contador.
        await tx.promoCodeUse.create({
          data: { promoCodeId: promo.id, tenantId: user.tenantId },
        });
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });

        return {
          status: 200,
          ok: true,
          planCode: promo.planCode,
          planName: plan.name,
          trialDays: promo.trialDays,
          trialEndsAt: trialEndsAt.toISOString(),
        };
      });

      if (result.status !== 200) {
        return reply.status(result.status).send({
          ok: false,
          error: result.error,
          message: result.message,
        });
      }

      console.log(`[billing/redeem-promo] ✅ Canjeado: tenant=${user.tenantId} plan=${result.planCode} trial=${result.trialDays}d`);
      return reply.send({
        ok: true,
        planCode: result.planCode,
        planName: result.planName,
        trialDays: result.trialDays,
        trialEndsAt: result.trialEndsAt,
      });
    } catch (err: any) {
      console.error("[billing/redeem-promo] Error:", err?.message ?? err);
      return reply.status(500).send({ ok: false, error: "SERVER_ERROR", message: "No pudimos canjear el código. Intentá de nuevo." });
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

    // Cancelar el preapproval en MP para que no genere futuros cobros.
    if (subscription.mpSubscriptionId) {
      try {
        const mpClient = getMPClient();
        const preApproval = new PreApproval(mpClient);
        await preApproval.update({
          id: subscription.mpSubscriptionId,
          body: { status: "cancelled" } as any,
        });
        console.log("[billing/cancel] Preapproval MP cancelado:", subscription.mpSubscriptionId);
      } catch (err: any) {
        console.warn("[billing/cancel] Error cancelando en MP:", err?.message);
      }
    }

    // Cancelación al final del período: el usuario mantiene acceso hasta renewsAt.
    // Solo si NO tiene renewsAt (trial puro o pending) degradamos inmediatamente.
    const hasRemainingPeriod = subscription.renewsAt && subscription.renewsAt > new Date();

    if (hasRemainingPeriod) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "canceling" },
      });
      await auditLog({
        tenantId: user.tenantId,
        userId: user.userId,
        action: "billing.cancel_scheduled",
        resourceType: "Subscription",
        resourceId: subscription.id,
        metadata: { renewsAt: subscription.renewsAt },
        request,
      });
      const renewsDate = subscription.renewsAt!.toLocaleDateString("es-AR", {
        day: "numeric", month: "long", year: "numeric",
      });
      return reply.send({
        ok: true,
        canceledAtPeriodEnd: true,
        renewsAt: subscription.renewsAt!.toISOString(),
        message: `Tu suscripción se cancela el ${renewsDate}. Hasta entonces tenés acceso completo.`,
      });
    }

    // Sin período restante → degradar a free de inmediato
    const freePlan = await prisma.plan.findUnique({ where: { code: "free" } });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "canceled", renewsAt: null, planId: freePlan?.id ?? subscription.planId, maxUsers: 1 },
    });
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: { currentPlanCode: "free" },
    });
    await auditLog({
      tenantId: user.tenantId,
      userId: user.userId,
      action: "billing.cancel_immediate",
      resourceType: "Subscription",
      resourceId: subscription.id,
      request,
    });
    return reply.send({ ok: true, canceledAtPeriodEnd: false, message: "Suscripción cancelada. Tu plan vuelve a Free." });
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
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return reply.code(401).send({ error: "Webhook not configured" });
    }

    const body = request.body as any;
    const type = body?.type ?? "";
    const dataId = body?.data?.id;

    if (!dataId) {
      return reply.code(400).send({ ok: false, error: "Missing data.id" });
    }

    // Verificar firma HMAC-SHA256 de Mercado Pago
    if (!verifyMPWebhookSignature(request, String(dataId))) {
      console.warn(`[webhook/mp] Firma inválida — evento descartado (tipo=${type} id=${dataId})`);
      return reply.code(401).send({ ok: false, error: "Invalid signature" });
    }

    // Idempotencia: MP reintenta el mismo evento si no respondemos 200 a tiempo.
    // Sin dedup, cada retry vuelve a procesar el cambio (posible doble cobro lógico,
    // doble facturación, doble cambio de estado). Usamos x-request-id (único por
    // delivery según MP) como clave + ventana de 10 min en memoria.
    const requestId = (request.headers["x-request-id"] as string | undefined) ?? `${type}:${dataId}`;
    const now = Date.now();
    const TEN_MIN = 10 * 60 * 1000;
    for (const [k, ts] of mpWebhookSeen.entries()) {
      if (now - ts > TEN_MIN) mpWebhookSeen.delete(k);
    }
    if (mpWebhookSeen.has(requestId)) {
      console.log(`[webhook/mp] retry duplicado descartado (request-id=${requestId})`);
      return reply.send({ ok: true, deduped: true });
    }
    mpWebhookSeen.set(requestId, now);

    // Responder 200 para que MP no reintente indefinidamente
    reply.send({ ok: true });

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

        let parsed: { tenantId: string; planCode: string; totalUsers: number; noTrial?: boolean };
        try {
          parsed = JSON.parse(externalRef);
        } catch {
          console.warn("[webhook/mp] external_reference no es JSON:", externalRef);
          return;
        }

        const { tenantId, planCode, totalUsers, noTrial } = parsed;
        const plan = await prisma.plan.findUnique({ where: { code: planCode } });
        if (!plan) return;

        const mpStatus = sub?.status; // "authorized" | "paused" | "cancelled" | "pending"
        const now = new Date();

        if (mpStatus === "authorized") {
          // noTrial=true se usa en reactivaciones: el usuario ya tuvo su trial,
          // no debe obtener otro período de prueba al reactivar.
          const trialDays = noTrial ? 0 : ((plan as any).trialDays ?? 0);
          const renewsAt = getNextMonthDate(now);

          if (trialDays === 0) {
            // Sin período de prueba: activar inmediatamente como "active".
            // El usuario autorizó el débito — MP cobra en el momento o en segundos.
            // Activamos YA para que el usuario no quede en limbo esperando el webhook
            // de pago, que puede tardar minutos en llegar.
            // Cuando llegue subscription_authorized_payment, simplemente actualiza renewsAt.
            await prisma.subscription.upsert({
              where: { tenantId },
              create: {
                tenantId,
                planId: plan.id,
                status: "active",
                startsAt: now,
                renewsAt,
                maxUsers: totalUsers,
                mpSubscriptionId: String(dataId),
                mpPayerId: String(sub?.payer_id ?? ""),
              },
              update: {
                planId: plan.id,
                status: "active",
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

            console.log(`[webhook/mp] ✅ Plan activado (sin trial): tenant=${tenantId} plan=${planCode}`);
            return;
          }

          // Con período de prueba: activar como "trialing".
          // El usuario autorizó el débito futuro — el trial comienza ahora sin cobro.
          const trialEndsAt = new Date(now.getTime() + trialDays * 86_400_000);

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
          // Verificar que el preapproval cancelado sea el actualmente registrado.
          // Si el tenant hizo un cambio de plan, ya tiene un nuevo mpSubscriptionId
          // y la cancelación del anterior no debe degradarlo a free.
          const currentSub = await prisma.subscription.findUnique({ where: { tenantId } });
          if (currentSub && currentSub.mpSubscriptionId !== String(dataId)) {
            console.log(`[webhook/mp] Cancelación ignorada — ${dataId} ya no es el preapproval activo de tenant=${tenantId}`);
            return;
          }

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

        const now      = new Date();
        const metadata = payment?.metadata ?? {};

        // ── 2a. Pago de prorrateo (upgrade de plan) ─────────────────────────
        if (metadata.type === "plan_upgrade") {
          const tenantId         = metadata.tenant_id ?? metadata.tenantId ?? null;
          const planCode         = metadata.plan_code ?? metadata.planCode ?? null;
          const mpSubscriptionId = metadata.mp_subscription_id ?? null;
          const newMonthlyAmount = parseInt(metadata.new_monthly_amount ?? "0", 10);
          const totalUsers       = parseInt(metadata.total_users ?? "1", 10);

          if (!tenantId || !planCode) {
            console.warn("[webhook/mp] plan_upgrade sin metadata completa:", dataId);
            return;
          }

          const upgradePlan = await prisma.plan.findUnique({ where: { code: planCode } });
          if (!upgradePlan) return;

          // Actualizar el PreApproval con el nuevo monto mensual
          if (mpSubscriptionId && newMonthlyAmount > 0) {
            try {
              const preApproval = new PreApproval(mpClient);
              await preApproval.update({
                id: mpSubscriptionId,
                body: { auto_recurring: { transaction_amount: newMonthlyAmount } as any },
              });
              console.log(`[webhook/mp] PreApproval actualizado: ${mpSubscriptionId} → $${newMonthlyAmount}/mes`);
            } catch (err: any) {
              console.warn("[webhook/mp] No se pudo actualizar PreApproval:", err?.message);
            }
          }

          // Activar el nuevo plan en la BD (mantener renewsAt sin tocar)
          const subToUpgrade = await prisma.subscription.findUnique({ where: { tenantId } });
          if (!subToUpgrade) return;

          await prisma.subscription.update({
            where: { id: subToUpgrade.id },
            data: { planId: upgradePlan.id, status: "active", maxUsers: totalUsers },
          });

          await prisma.tenant.update({
            where: { id: tenantId },
            data: { currentPlanCode: planCode },
          });

          // Registrar factura del prorrateo
          const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const existingInv = await prisma.invoice.findFirst({ where: { mpPaymentId: String(dataId) } });
          if (!existingInv) {
            await prisma.invoice.create({
              data: {
                subscriptionId: subToUpgrade.id,
                mpPaymentId:    String(dataId),
                status:         "approved",
                amountArs:      payment?.transaction_amount ?? 0,
                period,
                dueAt:          subToUpgrade.renewsAt ?? getNextMonthDate(now),
                paidAt:         now,
              },
            });
          }

          console.log(`[webhook/mp] ⬆️ Upgrade procesado: tenant=${tenantId} plan=${planCode}`);
          return;
        }

        // ── 2b. Pago mensual normal de suscripción ──────────────────────────
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

        // Keep tenant.currentPlanCode in sync — important for plans without trial
        // where this payment webhook is the first thing that activates the plan.
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { currentPlanCode: planCode! },
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
