"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBillingPlans, startCheckout, type BillingPlan } from "@/app/lib/webApi";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  Shield,
  Zap,
  Crown,
  Building2,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

function getPlanIcon(code: string) {
  if (code === "free") return Shield;
  if (code === "pro") return Zap;
  if (code === "proplus") return Crown;
  return Building2;
}

function formatARS(amount: number) {
  return `$${amount.toLocaleString("es-AR")}`;
}

function getPlanFeatureList(plan: BillingPlan): string[] {
  const { limits, features } = plan;
  const list: string[] = [];

  if (limits.docsPerMonth === -1) list.push("Documentos ilimitados");
  else list.push(`${limits.docsPerMonth} documentos por mes`);

  list.push("Todos los tipos de documentos");

  if (features.chatIA) list.push("Chat con IA");
  if (features.edicion) list.push("Edición de documentos");
  if (features.anotaciones) list.push("Anotaciones");
  if (features.analytics) list.push("Analytics");
  if (features.logoEstudio) list.push("Logo del estudio en PDFs");
  if (plan.code === "estudio") list.push("Múltiples usuarios (mín. 3)");

  return list;
}

export default function OnboardingPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    getBillingPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (planCode: string) => {
    if (planCode === "free") {
      router.push("/documents");
      return;
    }
    setSelectedPlan(planCode);
    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await startCheckout(planCode);
      window.location.href = checkoutUrl;
    } catch {
      setCheckoutLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="mb-6">
            <BrandLogo size={50} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary mb-2">
            Paso final
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Elegí tu plan
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-md">
            Empezá gratis o activá un plan pago con 7 días de prueba en Pro. Podés cambiar en cualquier momento.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan.code);
              const features = getPlanFeatureList(plan);
              const isLoading = checkoutLoading && selectedPlan === plan.code;

              return (
                <div
                  key={plan.code}
                  className={cn(
                    "relative flex flex-col rounded-2xl border-2 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md cursor-pointer",
                    plan.code === "pro" ? "border-primary ring-2 ring-primary/20" :
                    plan.code === "proplus" ? "border-purple-400/40 dark:border-purple-500/30" :
                    plan.code === "estudio" ? "border-slate-700 dark:border-slate-600" :
                    "border-slate-200 dark:border-slate-700"
                  )}
                >
                  {plan.code === "pro" && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow">
                      Recomendado
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      plan.code === "pro" ? "bg-primary/10 text-primary" :
                      plan.code === "proplus" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                      plan.code === "estudio" ? "bg-slate-900 text-white dark:bg-slate-700" :
                      "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-1">
                    {plan.priceArs === null ? (
                      <span className="text-2xl font-black text-slate-900 dark:text-white">$0</span>
                    ) : plan.code === "estudio" ? (
                      <div>
                        <span className="text-xl font-black text-slate-900 dark:text-white">{formatARS(plan.priceArs)}</span>
                        <span className="text-xs text-slate-500 ml-1">/ usuario / mes</span>
                        <p className="text-xs text-slate-400 mt-0.5">Mín. 3 usuarios</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{formatARS(plan.priceArs)}</span>
                        <span className="text-xs text-slate-500 ml-1">/ mes</span>
                      </div>
                    )}
                  </div>

                  {plan.trialDays > 0 && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                      ✨ {plan.trialDays} días gratis
                    </p>
                  )}

                  <ul className="space-y-2 my-4 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleSelect(plan.code)}
                    disabled={checkoutLoading}
                    className={cn(
                      "mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60",
                      plan.code === "free"
                        ? "border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        : plan.code === "pro"
                        ? "bg-primary text-white hover:bg-primary/90"
                        : plan.code === "proplus"
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : plan.code === "free" ? (
                      <>Continuar gratis <ArrowRight className="w-4 h-4" /></>
                    ) : (
                      <>Suscribirme <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Podés cambiar o cancelar tu plan en cualquier momento desde Ajustes → Suscripción.
        </p>
      </div>
    </main>
  );
}
