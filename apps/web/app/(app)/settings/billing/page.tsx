"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import {
  getBillingSubscription,
  getBillingPlans,
  cancelSubscription,
  reactivateSubscription,
  redeemPromoCode,
  getInvoices,
  startCheckout,
  changePlan,
  type ChangePlanResult,
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
  Loader2,
  AlertTriangle,
  Clock,
  Receipt,
  Crown,
  X,
  Minus,
  Plus,
  ArrowLeftRight,
  RotateCcw,
  CalendarX,
  Tag,
  ChevronDown,
  AlertCircle,
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

  list.push("Todos los tipos de documentos");

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
  hasActiveSub,
  isCanceling,
  onSelect,
  onCancel,
  onReactivate,
  trialEndsAt,
}: {
  plan: BillingPlan;
  isCurrent: boolean;
  isLoading: boolean;
  hasActiveSub: boolean;
  isCanceling: boolean;
  onSelect: (planCode: string) => void;
  onCancel: () => void;
  onReactivate: () => void;
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
        "relative flex flex-col rounded-2xl border-2 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md",
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
          isCanceling ? (
            <button
              type="button"
              onClick={onReactivate}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><RotateCcw className="w-3.5 h-3.5" />Reactivar suscripción</>
              }
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar suscripción
            </button>
          )
        )
      ) : isFree ? (
        /* Plan Free cuando no es el actual — no mostrar botón para no confundir */
        null
      ) : (
        <button
          type="button"
          onClick={() => onSelect(plan.code)}
          disabled={isLoading}
          className={cn(
            "w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-default",
            plan.code === "pro" ? "bg-primary text-white hover:bg-primary/90" :
            plan.code === "proplus" ? "bg-purple-600 text-white hover:bg-purple-700" :
            plan.code === "estudio" ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600" :
            "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          )}
        >
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : hasActiveSub
              ? <><ArrowLeftRight className="w-3.5 h-3.5" />Cambiar a {plan.name}</>
              : `Suscribirse a ${plan.name}`}
        </button>
      )}
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function BillingPageContent() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const verifyPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Selector de usuarios para plan Estudio
  const [estudioUsers, setEstudioUsers] = useState(3);
  const [showEstudioModal, setShowEstudioModal] = useState(false);
  // Cambio de plan
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    planCode: string;
    planName: string;
    isUpgrade: boolean;
    proRataAmount: number;    // sólo upgrades
    daysRemaining: number;    // sólo upgrades
    newMonthlyAmount: number;
  } | null>(null);
  const [changePlanLoading, setChangePlanLoading] = useState(false);
  // Mail de Mercado Pago (MP lo exige en el PreApproval y debe coincidir con
  // el mail de la cuenta con la que el cliente se loguee en MP).
  // Estado de canje de códigos promocionales
  const [showPromoSection, setShowPromoSection] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showPayerEmailModal, setShowPayerEmailModal] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{
    planCode: string;
    additionalUsers: number;
  } | null>(null);
  const [payerEmailInput, setPayerEmailInput] = useState("");
  const [payerEmailError, setPayerEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/billing");
    }
  }, [authLoading, isAuthenticated, router]);

  // Mostrar mensaje según status de redirección de MP
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setStatusMsg({
        type: "success",
        text: "¡Suscripción autorizada! Tu plan se activará en unos minutos. Si no cambia, recargá la página.",
      });
    } else if (status === "failure") {
      setStatusMsg({ type: "error", text: "No se pudo procesar la suscripción. Podés intentarlo nuevamente." });
    } else if (status === "pending") {
      setStatusMsg({ type: "success", text: "Suscripción pendiente de confirmación. Te avisamos cuando se active." });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const planParam   = searchParams.get("plan");
    const statusParam = searchParams.get("status");

    Promise.allSettled([
      getBillingSubscription(),
      getBillingPlans(),
      getInvoices(),
    ]).then(([billingResult, plansResult, invoicesResult]) => {
      let billingData: BillingData | null = null;

      if (billingResult.status === "fulfilled") {
        billingData = billingResult.value;
        setBilling(billingData);
      } else {
        console.error("[billing] getBillingSubscription failed:", billingResult.reason);
      }

      if (plansResult.status === "fulfilled") setPlans(plansResult.value);
      else console.error("[billing] getBillingPlans failed:", plansResult.reason);

      if (invoicesResult.status === "fulfilled") setInvoices(invoicesResult.value);
      else console.error("[billing] getInvoices failed:", invoicesResult.reason);

      // Retorno desde MP vía back_url (?plan= sin ?status=)
      // Muestra mensaje según el estado REAL de la suscripción en la BD.
      // El webhook de MP puede llegar segundos después de la redirección,
      // así que si el estado es pending_payment hacemos polling breve antes de mostrar error.
      if (planParam && !statusParam && billingData) {
        const subStatus = billingData.subscription?.status;
        const currentPlanMatches = billingData.plan?.code === planParam;

        if ((subStatus === "trialing" || subStatus === "active") && currentPlanMatches) {
          // Plan ya coincide con el esperado → éxito inmediato
          setStatusMsg({
            type: "success",
            text: subStatus === "trialing"
              ? `¡Tu período de prueba del plan ${billingData.plan?.name ?? planParam} comenzó! Se te cobrará automáticamente al vencimiento.`
              : `¡Suscripción activada! Ya sos parte del plan ${billingData.plan?.name ?? planParam}.`,
          });
          router.replace("/settings/billing", { scroll: false } as any);
        } else if ((subStatus === "trialing" || subStatus === "active") && !currentPlanMatches) {
          // Activo pero con plan viejo → pago de prorrateo procesándose, hacer polling
          setVerifying(true);
          let attempts = 0;
          verifyPollRef.current = setInterval(async () => {
            attempts++;
            try {
              const updated = await getBillingSubscription();
              if (updated.plan?.code === planParam) {
                clearInterval(verifyPollRef.current!);
                verifyPollRef.current = null;
                setVerifying(false);
                setBilling(updated);
                setStatusMsg({
                  type: "success",
                  text: `¡Plan actualizado a ${updated.plan?.name ?? planParam}! Tu próxima renovación es el mismo día del mes.`,
                });
                router.replace("/settings/billing", { scroll: false } as any);
              } else if (attempts >= 10) {
                clearInterval(verifyPollRef.current!);
                verifyPollRef.current = null;
                setVerifying(false);
                setStatusMsg({
                  type: "error",
                  text: "El pago está siendo procesado por Mercado Pago. Si el plan no se actualiza en unos minutos, recargá la página.",
                });
                router.replace("/settings/billing", { scroll: false } as any);
              }
            } catch { /* ignorar */ }
          }, 3000);
        } else if (subStatus === "pending_payment") {
          // El webhook de MP puede no haber llegado todavía — esperar hasta 30 s
          setVerifying(true);
          let attempts = 0;
          const maxAttempts = 10; // 10 × 3 s = 30 s
          verifyPollRef.current = setInterval(async () => {
            attempts++;
            try {
              const updated = await getBillingSubscription();
              const s = updated.subscription?.status;
              if (s === "trialing" || s === "active") {
                clearInterval(verifyPollRef.current!);
                verifyPollRef.current = null;
                setVerifying(false);
                setBilling(updated);
                setStatusMsg({
                  type: "success",
                  text: s === "trialing"
                    ? `¡Tu período de prueba del plan ${updated.plan?.name ?? planParam} comenzó! Se te cobrará automáticamente al vencimiento.`
                    : `¡Suscripción activada! Ya sos parte del plan ${updated.plan?.name ?? planParam}.`,
                });
                router.replace("/settings/billing", { scroll: false } as any);
              } else if (attempts >= maxAttempts) {
                clearInterval(verifyPollRef.current!);
                verifyPollRef.current = null;
                setVerifying(false);
                setStatusMsg({
                  type: "error",
                  text: "Tu suscripción todavía está siendo procesada por Mercado Pago. Si el plan no se actualiza en unos minutos, recargá la página.",
                });
                router.replace("/settings/billing", { scroll: false } as any);
              }
            } catch { /* ignorar errores de red en polling */ }
          }, 3000);
        } else {
          // canceled u otro estado definitivo → no se completó el pago
          setStatusMsg({
            type: "error",
            text: "El proceso no se completó o fue cancelado. Tu plan no fue modificado. Podés intentarlo cuando quieras.",
          });
          router.replace("/settings/billing", { scroll: false } as any);
        }
      }
    }).finally(() => setLoading(false));
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpiar polling de verificación al desmontar
  useEffect(() => {
    return () => {
      if (verifyPollRef.current) clearInterval(verifyPollRef.current);
    };
  }, []);

  // Restauración desde bfcache (botón "atrás" del browser)
  // Cuando el usuario vuelve desde MP sin completar el pago, el browser puede restaurar
  // la página con checkoutLoading=true (estado previo a la redirección). Esto lo resuelve.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return; // Solo aplica a restauración desde bfcache
      setCheckoutLoading(false);
      if (!isAuthenticated) return;
      // Refetch para mostrar el estado real (no el estado cacheado pre-redirección)
      Promise.allSettled([getBillingSubscription(), getBillingPlans(), getInvoices()])
        .then(([br, pr, ir]) => {
          if (br.status === "fulfilled") setBilling(br.value);
          if (pr.status === "fulfilled") setPlans(pr.value);
          if (ir.status === "fulfilled") setInvoices(ir.value);
        });
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [isAuthenticated]);

  // hasActiveSub: true cuando el usuario tiene plan activo, trial o cancelación pendiente
  // Y además está en un plan pagado. Si el plan efectivo es Free (puede pasar si
  // los datos quedan inconsistentes: status=active apuntando a plan Free), tratamos
  // al usuario como "sin suscripción" para que el upgrade vaya por /billing/checkout
  // en vez de /billing/change-plan (que calcularía un prorrateo absurdo contra $0).
  const subStatus = billing?.subscription?.status;
  const onPaidPlan = (billing?.plan?.code ?? "free") !== "free";
  const hasActiveSub =
    onPaidPlan &&
    (subStatus === "active" ||
      subStatus === "trialing" ||
      subStatus === "canceling");

  const isCanceling = billing?.subscription?.status === "canceling";

  const handlePlanSelect = (planCode: string) => {
    if (isCanceling) {
      // La suscripción está programada para cancelarse — reactivar primero
      setStatusMsg({
        type: "error",
        text: "Tu suscripción está programada para cancelarse. Reactivá primero para poder cambiar de plan.",
      });
      return;
    }
    if (hasActiveSub) {
      // El usuario quiere cambiar de plan → mostrar confirmación primero
      if (planCode === "estudio") {
        setShowEstudioModal(true);
        return;
      }
      const targetPlan    = plans.find((p) => p.code === planCode);
      const currentPrice  = billing?.plan?.priceArs ?? 0;
      const newPrice      = targetPlan?.priceArs ?? 0;
      const isUpgrade     = newPrice > currentPrice;

      // Pre-calcular prorrateo para mostrarlo en el modal (el backend recalcula al confirmar)
      const renewsAt       = billing?.subscription?.renewsAt ? new Date(billing.subscription.renewsAt) : null;
      const msRemaining    = renewsAt ? Math.max(0, renewsAt.getTime() - Date.now()) : 0;
      const daysRemaining  = Math.max(1, Math.ceil(msRemaining / 86_400_000));
      const proRataAmount  = isUpgrade ? Math.round((newPrice - currentPrice) / 30 * daysRemaining) : 0;

      setPendingChange({
        planCode,
        planName:        targetPlan?.name ?? planCode,
        isUpgrade,
        proRataAmount,
        daysRemaining,
        newMonthlyAmount: newPrice,
      });
      setShowChangePlanModal(true);
    } else {
      // Usuario sin plan activo → checkout normal
      if (planCode === "estudio") {
        setShowEstudioModal(true);
        return;
      }
      handleFreshCheckout(planCode);
    }
  };

  // handleFreshCheckout: en vez de ir directo a MP, pedimos primero el mail
  // de MP del cliente (MP exige payer_email y puede no coincidir con el mail
  // de DocuLex). El modal invoca confirmPayerEmailAndCheckout cuando confirman.
  const handleFreshCheckout = (planCode: string, additionalUsers = 0) => {
    setPendingCheckout({ planCode, additionalUsers });
    setPayerEmailInput(user?.email ?? "");
    setPayerEmailError(null);
    setShowPayerEmailModal(true);
  };

  const confirmPayerEmailAndCheckout = async () => {
    if (!pendingCheckout) return;
    const email = payerEmailInput.trim().toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) {
      setPayerEmailError("Ingresá un email válido.");
      return;
    }
    setPayerEmailError(null);
    setShowPayerEmailModal(false);
    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await startCheckout(
        pendingCheckout.planCode,
        pendingCheckout.additionalUsers,
        email,
      );
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message ?? "Error al iniciar el pago. Intentá de nuevo." });
      setCheckoutLoading(false);
    } finally {
      setPendingCheckout(null);
    }
  };

  const handleEstudioCheckout = async () => {
    setShowEstudioModal(false);
    const additionalUsers = estudioUsers - 3;
    if (hasActiveSub) {
      // Cambio de plan activo → usar change-plan (no requiere prompt de mail)
      setCheckoutLoading(true);
      try {
        const result = await changePlan("estudio", additionalUsers);
        if (result.type === "upgrade") {
          window.location.href = result.checkoutUrl;
        } else {
          const [updatedBilling, updatedPlans] = await Promise.all([getBillingSubscription(), getBillingPlans()]);
          setBilling(updatedBilling);
          setPlans(updatedPlans);
          setStatusMsg({ type: "success", text: `Plan cambiado a ${result.newPlanName}.` });
          setCheckoutLoading(false);
        }
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err?.message ?? "Error al iniciar el pago. Intentá de nuevo." });
        setCheckoutLoading(false);
      }
    } else {
      // Checkout nuevo → preguntar mail MP primero
      handleFreshCheckout("estudio", additionalUsers);
    }
  };

  const handleConfirmChangePlan = async () => {
    if (!pendingChange) return;
    setShowChangePlanModal(false);
    setChangePlanLoading(true);
    try {
      const result = await changePlan(pendingChange.planCode);
      if (result.type === "upgrade") {
        // Redirigir a MP para pagar el prorrateo
        window.location.href = result.checkoutUrl;
      } else {
        // Downgrade inmediato — refrescar datos y mostrar éxito
        const [updatedBilling, updatedPlans] = await Promise.all([
          getBillingSubscription(),
          getBillingPlans(),
        ]);
        setBilling(updatedBilling);
        setPlans(updatedPlans);
        const renewsDate = result.renewsAt
          ? new Date(result.renewsAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
          : null;
        setStatusMsg({
          type: "success",
          text: `Plan cambiado a ${result.newPlanName}.${renewsDate ? ` Tu próximo cobro es el ${renewsDate}.` : ""}`,
        });
        setChangePlanLoading(false);
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message ?? "Error al cambiar el plan. Intentá de nuevo." });
      setChangePlanLoading(false);
    }
    setPendingChange(null);
  };

  const handleCancel = async () => {
    const renewsAtDate = billing?.subscription?.renewsAt
      ? new Date(billing.subscription.renewsAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
      : null;
    const confirmText = renewsAtDate
      ? `¿Cancelar tu suscripción?\n\nSeguirás con el plan ${billing?.plan?.name} hasta el ${renewsAtDate}. Después pasarás al plan Free automáticamente.`
      : "¿Confirmás que querés cancelar tu suscripción? Volverás al plan Free.";

    if (!confirm(confirmText)) return;
    setCancelLoading(true);
    try {
      const result = await cancelSubscription();
      if (result.canceledAtPeriodEnd && result.renewsAt) {
        const endDate = new Date(result.renewsAt).toLocaleDateString("es-AR", {
          day: "numeric", month: "long", year: "numeric",
        });
        setStatusMsg({
          type: "success",
          text: `Suscripción cancelada. Seguís con el plan ${billing?.plan?.name} hasta el ${endDate}. Después pasarás al plan Free.`,
        });
      } else {
        setStatusMsg({ type: "success", text: "Suscripción cancelada. Tu plan volvió a Free." });
      }
      const [billingData, plansData] = await Promise.all([getBillingSubscription(), getBillingPlans()]);
      setBilling(billingData);
      setPlans(plansData);
    } catch {
      setStatusMsg({ type: "error", text: "Error al cancelar. Intentá de nuevo." });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivate = async () => {
    setCancelLoading(true);
    try {
      const { checkoutUrl } = await reactivateSubscription();
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message ?? "Error al reactivar. Intentá de nuevo." });
      setCancelLoading(false);
    }
  };

  const handleRedeemPromo = async () => {
    const normalized = promoCodeInput.trim().toUpperCase();
    if (normalized.length < 3) {
      setPromoFeedback({ type: "error", text: "Ingresá un código válido." });
      return;
    }
    setPromoLoading(true);
    setPromoFeedback(null);
    try {
      const result = await redeemPromoCode(normalized);
      setPromoFeedback({
        type: "success",
        text: `¡Código activado! Tenés ${result.trialDays} días gratis del plan ${result.planName}.`,
      });
      setPromoCodeInput("");
      // Refrescar billing para que se vea el nuevo plan
      const [billingData, plansData] = await Promise.all([getBillingSubscription(), getBillingPlans()]);
      setBilling(billingData);
      setPlans(plansData);
    } catch (err: any) {
      setPromoFeedback({ type: "error", text: err?.message ?? "No pudimos canjear el código." });
    } finally {
      setPromoLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentPlanCode = billing?.plan?.code ?? "free";
  const docsLimit = billing?.plan?.limits?.docsPerMonth ?? 5;
  const estudioPlan = plans.find((p) => p.code === "estudio");
  const estudioTotal = (estudioPlan?.priceArs ?? 45000) * estudioUsers;

  return (
    <>
      {/* Modal de mail de Mercado Pago (antes de ir al checkout) */}
      {showPayerEmailModal && pendingCheckout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Email de Mercado Pago
              </h2>
              <button
                onClick={() => { setShowPayerEmailModal(false); setPendingCheckout(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Confirmá el email de tu cuenta de Mercado Pago. Tiene que coincidir con el mail con el que te vas a loguear en MP para autorizar el débito mensual.
            </p>

            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Email de Mercado Pago
            </label>
            <input
              type="email"
              autoFocus
              value={payerEmailInput}
              onChange={(e) => { setPayerEmailInput(e.target.value); setPayerEmailError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") confirmPayerEmailAndCheckout(); }}
              placeholder="tu-cuenta@mercadopago.com"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            {payerEmailError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{payerEmailError}</p>
            )}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Podés usar un mail distinto al de tu cuenta de DocuLex. No te genera ninguna cuenta nueva.
            </p>


            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowPayerEmailModal(false); setPendingCheckout(null); }}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPayerEmailAndCheckout}
                disabled={checkoutLoading}
                className="flex-1 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {checkoutLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : "Ir al pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cambio de plan */}
      {showChangePlanModal && pendingChange && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                {pendingChange.isUpgrade ? "Actualizar plan" : "Cambiar plan"}
              </h2>
              <button
                onClick={() => { setShowChangePlanModal(false); setPendingChange(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumen del cambio */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Plan actual</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {billing?.plan?.name} — {formatARS(billing?.plan?.priceArs ?? 0)}/mes
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Nuevo plan</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {pendingChange.planName} — {formatARS(pendingChange.newMonthlyAmount)}/mes
                </span>
              </div>
            </div>

            {pendingChange.isUpgrade ? (
              /* Upgrade: mostrar prorrateo */
              <div className="space-y-3 mb-5">
                <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Días restantes del período</span>
                    <span className="font-medium">{pendingChange.daysRemaining} días</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-primary/10 pt-2">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">A pagar ahora</span>
                    <span className="font-bold text-primary text-base">{formatARS(pendingChange.proRataAmount)}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Diferencia proporcional por los días restantes. El próximo ciclo completo se cobra {formatARS(pendingChange.newMonthlyAmount)}.
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Serás redirigido a Mercado Pago para completar el pago.
                </p>
              </div>
            ) : (
              /* Downgrade: sin cargo */
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 mb-5 space-y-1">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Sin cargo adicional
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  El cambio aplica de inmediato. Los días restantes del período actual se mantienen con el nuevo plan. Tu próximo cobro será de {formatARS(pendingChange.newMonthlyAmount)}.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowChangePlanModal(false); setPendingChange(null); }}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmChangePlan}
                disabled={changePlanLoading}
                className="flex-1 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {changePlanLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : pendingChange.isUpgrade ? "Ir al pago" : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal selector de usuarios Estudio */}
      {showEstudioModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-600" /> Plan Estudio
              </h2>
              <button onClick={() => setShowEstudioModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              El plan Estudio se factura por usuario. El mínimo es 3 usuarios.
            </p>

            {/* Advertencia si es cambio de plan */}
            {hasActiveSub && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 mb-4">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Cambio de plan:</strong> tu suscripción actual se cancelará y no se reembolsarán los días restantes.
                </p>
              </div>
            )}

            {/* Selector de cantidad */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-600 p-4 mb-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cantidad de usuarios</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEstudioUsers((n) => Math.max(3, n - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                  disabled={estudioUsers <= 3}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xl font-bold text-slate-900 dark:text-white w-8 text-center">{estudioUsers}</span>
                <button
                  onClick={() => setEstudioUsers((n) => Math.min(50, n + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Resumen */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-4 mb-5 space-y-1">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                <span>${(estudioPlan?.priceArs ?? 45000).toLocaleString("es-AR")} × {estudioUsers} usuarios</span>
                <span className="font-bold text-slate-900 dark:text-white">${estudioTotal.toLocaleString("es-AR")}/mes</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Podés agregar o quitar usuarios en cualquier momento desde Ajustes → Equipo.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEstudioModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEstudioCheckout}
                disabled={checkoutLoading}
                className="flex-1 py-2.5 text-sm font-bold bg-slate-900 text-white dark:bg-slate-700 rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar al pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-5">

          {/* Verificando suscripción con MP */}
          {verifying && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 p-4">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Verificando tu suscripción con Mercado Pago… esto puede tomar unos segundos.
              </p>
            </div>
          )}

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
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
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

              {/* Canceling info */}
              {billing.subscription?.status === "canceling" && billing.subscription.renewsAt && (
                <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2.5">
                  <CalendarX className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Tu suscripción se cancela el{" "}
                    <strong>
                      {new Date(billing.subscription.renewsAt).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </strong>
                    . Después pasarás al plan Free.{" "}
                    <button
                      type="button"
                      onClick={handleReactivate}
                      disabled={cancelLoading}
                      className="underline font-semibold hover:no-underline disabled:opacity-50"
                    >
                      Reactivar
                    </button>
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

          {/* Código promocional — solo visible en Free */}
          {!onPaidPlan && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setShowPromoSection((v) => !v);
                  if (showPromoSection) {
                    setPromoFeedback(null);
                    setPromoCodeInput("");
                  }
                }}
                className="w-full flex items-center justify-between px-4 sm:px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    ¿Tenés un código promocional?
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-400 transition-transform",
                    showPromoSection && "rotate-180"
                  )}
                />
              </button>

              {showPromoSection && (
                <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 mt-3">
                    Si recibiste un código de DocuLex en una charla, evento o convenio, ingresalo acá para activar tu período de prueba gratuito.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.toUpperCase());
                          setPromoFeedback(null);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRedeemPromo(); }}
                        disabled={promoLoading}
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans disabled:opacity-60"
                        placeholder="Ej: ABOGACIA2026"
                        maxLength={40}
                        autoComplete="off"
                      />
                    </div>
                    <button
                      onClick={handleRedeemPromo}
                      disabled={promoLoading || promoCodeInput.trim().length < 3}
                      className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      {promoLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Canjeando…</span>
                        </>
                      ) : (
                        "Canjear"
                      )}
                    </button>
                  </div>

                  {promoFeedback?.type === "success" && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{promoFeedback.text}</span>
                    </div>
                  )}
                  {promoFeedback?.type === "error" && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{promoFeedback.text}</span>
                    </div>
                  )}
                </div>
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
                  isLoading={checkoutLoading || cancelLoading || changePlanLoading}
                  hasActiveSub={hasActiveSub}
                  isCanceling={isCanceling && currentPlanCode === plan.code}
                  onSelect={handlePlanSelect}
                  onCancel={handleCancel}
                  onReactivate={handleReactivate}
                  trialEndsAt={billing?.subscription?.trialEndsAt}
                />
              ))}
            </div>
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm">
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
      </div>
    </>
  );
}

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  );
}
