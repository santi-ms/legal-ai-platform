"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SupportBanner } from "@/components/settings/SupportBanner";
import {
  getBillingSubscription,
  getBillingPlans,
  cancelSubscription,
  getInvoices,
  startCheckout,
  type BillingData,
  type BillingPlan,
  type Invoice,
} from "@/app/lib/webApi";
import {
  CheckCircle2,
  Zap,
  Shield,
  Building2,
  BarChart2,
  FileText,
  Users,
  Briefcase,
  Loader2,
  AlertTriangle,
  Clock,
  Receipt,
  Crown,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatARS(amount: number) {
  return `$${amount.toLocaleString("es-AR")}`;
}

function getPlanIcon(code: string) {
  if (code === "free") return Shield;
  if (code === "pro") return Zap;
  if (code === "proplus") return Crown;
  return Building2;
}

function getPlanColor(code: string, isCurrent: boolean) {
  if (isCurrent) return "border-primary ring-2 ring-primary/20";
  if (code === "pro") return "border-primary/40 dark:border-primary/30";
  if (code === "proplus") return "border-purple-400/40 dark:border-purple-500/30";
  if (code === "estudio") return "border-slate-700 dark:border-slate-600";
  return "border-slate-200 dark:border-slate-700";
}

function getPlanFeatureList(plan: BillingPlan): string[] {
  const limits = plan.limits;
  const features = plan.features;
  const list: string[] = [];

  if (limits.docsPerMonth === -1) list.push("Documentos ilimitados");
  else list.push(`Hasta ${limits.docsPerMonth} documentos por mes`);

  if (plan.code === "free") list.push("3 tipos de documentos");
  else list.push("Todos los tipos de documentos");

  if (features.chatIA) list.push("Chat con IA");
  if (features.edicion) list.push("Edición de documentos");
  if (features.anotaciones) list.push("Anotaciones y comentarios");
  if (features.analytics) list.push("Analytics");
  if (features.exportarReportes) list.push("Exportar reportes");
  if (features.referenciaDocs) {
    if (limits.maxReferenceFiles === -1) list.push("Referencias IA ilimitadas");
    else list.push(`Referencias IA (${limits.maxReferenceFiles} archivos)`);
  }
  if (features.logoEstudio) list.push("Logo del estudio en PDFs");

  if (plan.code === "estudio") {
    list.push("Múltiples usuarios (mín. 3)");
    list.push("Soporte prioritario + onboarding");
    list.push("Account manager dedicado");
  } else if (plan.code !== "free") {
    list.push("1 usuario");
    list.push("Soporte prioritario por email");
  } else {
    list.push("1 usuario");
    list.push("Soporte por email");
  }

  return list;
}

// ─── Usage bar ────────────────────────────────────────────────────────────────

function UsageBar({
  label,
  used,
  limit,
  icon: Icon,
}: {
  label: string;
  used: number;
  limit: number | null;
  icon: React.ElementType;
}) {
  const pct = limit && limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {used.toLocaleString("es-AR")}
            {limit && limit > 0 ? ` / ${limit.toLocaleString("es-AR")}` : " (ilimitado)"}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: limit && limit > 0 ? `${pct}%` : "10%" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  isLoading,
  onSelect,
  onCancel,
  trialEndsAt,
}: {
  plan: BillingPlan;
  isCurrent: boolean;
  isLoading: boolean;
  onSelect: (planCode: string) => void;
  onCancel: () => void;
  trialEndsAt?: string | null;
}) {
  const Icon = getPlanIcon(plan.code);
  const features = getPlanFeatureList(plan);

  const isEstudio = plan.code === "estudio";
  const isFree = plan.code === "free";

  const trialLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border-2 bg-white dark:bg-slate-800 p-6 shadow-sm transition-shadow hover:shadow-md",
        getPlanColor(plan.code, isCurrent)
      )}
    >
      {plan.code === "pro" && !isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow">
          Recomendado
        </span>
      )}
      {isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow">
          Plan actual
        </span>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          isCurrent ? "bg-primary/10 text-primary" :
          plan.code === "proplus" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
          plan.code === "estudio" ? "bg-slate-900 text-white dark:bg-slate-700" :
          "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
        </div>
      </div>

      <div className="mb-1">
        {isFree ? (
          <span className="text-3xl font-black text-slate-900 dark:text-white">$0</span>
        ) : isEstudio ? (
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatARS(plan.priceArs!)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/ usuario / mes</span>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Mínimo 3 usuarios</p>
          </div>
        ) : (
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {formatARS(plan.priceArs!)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">/ mes</span>
          </div>
        )}
      </div>

      {plan.trialDays > 0 && !isCurrent && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
          ✨ {plan.trialDays} días gratis
        </p>
      )}

      {isCurrent && trialLeft !== null && trialLeft > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Trial: {trialLeft} día{trialLeft !== 1 ? "s" : ""} restante{trialLeft !== 1 ? "s" : ""}</span>
        </div>
      )}

      <ul className="space-y-2 mb-6 flex-1 mt-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        !isFree && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar suscripción
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={() => onSelect(plan.code)}
          disabled={isLoading || isFree}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-default",
            plan.code === "pro" ? "bg-primary text-white hover:bg-primary/90" :
            plan.code === "proplus" ? "bg-purple-600 text-white hover:bg-purple-700" :
            plan.code === "estudio" ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600" :
            "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          )}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFree ? "Plan actual" : `Suscribirse a ${plan.name}`}
        </button>
      )}
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function BillingPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/billing");
    }
  }, [authLoading, isAuthenticated, router]);

  // Mostrar mensaje según status de redirección de MP
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setStatusMsg({ type: "success", text: "¡Pago exitoso! Tu plan fue actualizado." });
    } else if (status === "failure") {
      setStatusMsg({ type: "error", text: "El pago no fue procesado. Podés intentarlo nuevamente." });
    } else if (status === "pending") {
      setStatusMsg({ type: "success", text: "Pago pendiente de acreditación. Te notificaremos cuando se confirme." });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      getBillingSubscription(),
      getBillingPlans(),
      getInvoices(),
    ]).then(([billingData, plansData, invoicesData]) => {
      setBilling(billingData);
      setPlans(plansData);
      setInvoices(invoicesData);
    }).catch(console.error).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const handleCheckout = async (planCode: string) => {
    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await startCheckout(planCode);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Error al iniciar el pago. Intentá de nuevo." });
      setCheckoutLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("¿Confirmás que querés cancelar tu suscripción? Volverás al plan Free.")) return;
    setCancelLoading(true);
    try {
      await cancelSubscription();
      setStatusMsg({ type: "success", text: "Suscripción cancelada. Tu plan volvió a Free." });
      const [billingData, plansData] = await Promise.all([getBillingSubscription(), getBillingPlans()]);
      setBilling(billingData);
      setPlans(plansData);
    } catch {
      setStatusMsg({ type: "error", text: "Error al cancelar. Intentá de nuevo." });
    } finally {
      setCancelLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentPlanCode = billing?.plan?.code ?? "free";
  const docsLimit = billing?.plan?.limits?.docsPerMonth ?? 5;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="px-4 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1 gap-6">
          <SettingsHeader />

          <div className="flex flex-wrap justify-between gap-3 p-4 mt-2">
            <div>
              <p className="text-4xl font-black leading-tight tracking-[-0.033em]">Ajustes del Sistema</p>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
                Administrá tu cuenta, suscripciones y preferencias de seguridad.
              </p>
            </div>
          </div>

          <SettingsTabs activeTab="billing" />

          {/* Status message */}
          {statusMsg && (
            <div className={cn(
              "flex items-start gap-3 rounded-xl border p-4",
              statusMsg.type === "success"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/30"
                : "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30"
            )}>
              {statusMsg.type === "success"
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              }
              <p className={cn(
                "text-sm font-medium",
                statusMsg.type === "success" ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"
              )}>
                {statusMsg.text}
              </p>
            </div>
          )}

          {/* Usage summary */}
          {billing && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Uso actual</h2>
                <span className={cn(
                  "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                  currentPlanCode === "free" ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" :
                  currentPlanCode === "pro" ? "bg-primary/10 text-primary" :
                  currentPlanCode === "proplus" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                  "bg-slate-900 text-white dark:bg-slate-700"
                )}>
                  Plan {billing.plan?.name ?? "Free"}
                </span>
              </div>
              <div className="space-y-4">
                <UsageBar
                  label="Documentos este mes"
                  used={billing.usage.docsThisMonth}
                  limit={docsLimit === -1 ? null : docsLimit}
                  icon={FileText}
                />
              </div>

              {/* Trial info */}
              {billing.subscription?.status === "trialing" && billing.subscription.trialEndsAt && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Período de prueba activo — vence el{" "}
                    <strong>{new Date(billing.subscription.trialEndsAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}</strong>
                  </span>
                </div>
              )}

              {/* Renewal info */}
              {billing.subscription?.renewsAt && billing.subscription.status === "active" && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Próxima renovación: {new Date(billing.subscription.renewsAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* Plans */}
          <div>
            <h2 className="text-xl font-bold mb-4">Planes disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.code}
                  plan={plan}
                  isCurrent={currentPlanCode === plan.code}
                  isLoading={checkoutLoading || cancelLoading}
                  onSelect={handleCheckout}
                  onCancel={handleCancel}
                  trialEndsAt={billing?.subscription?.trialEndsAt}
                />
              ))}
            </div>
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Historial de pagos</h2>
              </div>
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {inv.period}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {inv.paidAt ? `Pagado el ${new Date(inv.paidAt).toLocaleDateString("es-AR")}` : "Pendiente"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatARS(inv.amountArs)}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        inv.status === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        inv.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {inv.status === "approved" ? "Pagado" : inv.status === "pending" ? "Pendiente" : "Rechazado"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SupportBanner />
        </div>
      </div>
    </div>
  );
}

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  );
}
