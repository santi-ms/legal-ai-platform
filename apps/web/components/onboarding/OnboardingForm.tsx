"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Building2, User, Briefcase, Tag, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { completeOnboarding } from "@/app/lib/webApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const ROLE_OPTIONS = [
  { value: "", label: "Seleccioná tu rol (opcional)" },
  { value: "socio_director", label: "Socio / Director" },
  { value: "abogado_asociado", label: "Abogado/a Asociado/a" },
  { value: "pasante_paralegal", label: "Pasante / Paralegal" },
  { value: "abogado_inhouse", label: "Abogado/a In-House" },
  { value: "otro", label: "Otro" },
];

type OnboardingFormProps = {
  initialName: string;
  initialEmail: string;
};

export function OnboardingForm({ initialName, initialEmail }: OnboardingFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const { success } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [company, setCompany] = useState("");
  const [professionalRole, setProfessionalRole] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [promoStatus, setPromoStatus] = useState<"idle" | "ok" | "warn">("idle");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPromoStatus("idle");
    setPromoMsg(null);

    if (!name.trim()) {
      setError("Ingresá tu nombre para continuar.");
      return;
    }

    if (!company.trim()) {
      setError("Ingresá la empresa o estudio para continuar.");
      return;
    }

    try {
      const result = await completeOnboarding({
        name: name.trim(),
        company: company.trim(),
        professionalRole: professionalRole || undefined,
        promoCode: promoCode.trim() || undefined,
      });

      // Mostrar feedback del código promo antes de redirigir
      if (result.promo?.applied) {
        setPromoStatus("ok");
        setPromoMsg(`¡Código aplicado! Tenés ${result.promo.trialDays} días de plan ${result.promo.planCode?.toUpperCase()} gratis.`);
      } else if (result.promo?.warning) {
        setPromoStatus("warn");
        setPromoMsg(result.promo.warning);
      }

      await update({ reason: "onboarding-complete" });
      if (!result.promo?.warning) {
        success(result.promo?.applied
          ? `¡Código activado! Disfrutá ${result.promo.trialDays} días de plan Pro.`
          : "Onboarding completado exitosamente"
        );
      }

      startTransition(() => {
        router.replace("/onboarding/plan");
        router.refresh();
      });
    } catch (submitError: any) {
      setError(submitError?.message || "No pudimos completar el onboarding.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre completo
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="pl-10"
              placeholder="Ej. Juan Pérez"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Correo electrónico
          </Label>
          <Input id="email" value={initialEmail} disabled className="bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="company" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Empresa o estudio
          </Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="pl-10"
              placeholder="Ej. Estudio Pérez & Asociados"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="professionalRole" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Cargo / Rol <span className="text-slate-400 font-normal">(opcional)</span>
          </Label>
          <div className="relative">
            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <select
              id="professionalRole"
              value={professionalRole}
              onChange={(event) => setProfessionalRole(event.target.value)}
              disabled={isPending}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Código Promocional ── */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPromo((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            ¿Tenés un código promocional?
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showPromo ? "rotate-180" : ""}`} />
        </button>

        {showPromo && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Si recibiste un código en una charla o evento, ingresalo acá para activar tu período de prueba gratuito.
            </p>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoStatus("idle");
                  setPromoMsg(null);
                }}
                className="pl-9 font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
                placeholder="Ej: ABOGACIA2026"
                disabled={isPending}
                maxLength={40}
              />
            </div>

            {/* Feedback del código */}
            {promoStatus === "ok" && promoMsg && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {promoMsg}
              </div>
            )}
            {promoStatus === "warn" && promoMsg && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {promoMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Configurando espacio...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </form>
  );
}