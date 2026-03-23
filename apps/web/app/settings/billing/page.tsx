"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SupportBanner } from "@/components/settings/SupportBanner";
import { getDocumentStats } from "@/app/lib/webApi";
import {
  CheckCircle2,
  Zap,
  Shield,
  Building2,
  AlertCircle,
  ExternalLink,
  BarChart2,
  FileText,
  Users,
  Briefcase,
} from "lucide-react";

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Gratuito",
    price: "$0",
    period: "",
    description: "Para explorar la plataforma",
    icon: Shield,
    color: "border-slate-200 dark:border-slate-700",
    badgeColor: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    features: [
      "Hasta 5 documentos por mes",
      "3 tipos de documentos",
      "PDF estándar",
      "1 usuario",
      "Soporte por email",
    ],
    cta: "Plan actual",
    ctaColor: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    current: true,
    unavailable: [],
  },
  {
    id: "pro",
    name: "Profesional",
    price: "$29",
    period: "/ mes USD",
    description: "Para abogados independientes",
    icon: Zap,
    color: "border-primary ring-2 ring-primary/20",
    badgeColor: "bg-primary/10 text-primary",
    features: [
      "Documentos ilimitados",
      "Todos los tipos de documento",
      "PDF con membrete personalizado",
      "Hasta 5 usuarios",
      "Clientes y expedientes ilimitados",
      "Anotaciones y versiones",
      "Analytics detallado",
      "Soporte prioritario",
    ],
    cta: "Contratar plan",
    ctaColor: "bg-primary text-white hover:bg-primary/90",
    current: false,
    unavailable: [],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Estudio",
    price: "$89",
    period: "/ mes USD",
    description: "Para estudios jurídicos",
    icon: Building2,
    color: "border-slate-700 dark:border-slate-600",
    badgeColor: "bg-slate-900 text-white dark:bg-slate-700",
    features: [
      "Todo lo del plan Profesional",
      "Usuarios ilimitados",
      "Multi-sede",
      "Integración con sistemas externos",
      "SLA garantizado",
      "Onboarding personalizado",
      "Gerente de cuenta dedicado",
    ],
    cta: "Contactar ventas",
    ctaColor: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600",
    current: false,
    unavailable: [],
  },
] as const;

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
  const pct = limit ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  const color =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
      ? "bg-amber-500"
      : "bg-primary";

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
            {limit ? ` / ${limit.toLocaleString("es-AR")}` : " (ilimitado)"}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: limit ? `${pct}%` : "10%" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingSettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{ total: number; totalClients: number; expedientesActivos: number } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/billing");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getDocumentStats()
      .then((s) => setStats({ total: s.total, totalClients: s.totalClients, expedientesActivos: s.expedientesActivos }))
      .catch(() => {});
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="px-4 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1 gap-6">
          <SettingsHeader />

          <div className="flex flex-wrap justify-between gap-3 p-4 mt-2">
            <div>
              <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-slate-900 dark:text-white">
                Ajustes del Sistema
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
                Administrá tu cuenta, suscripciones y preferencias de seguridad.
              </p>
            </div>
          </div>

          <SettingsTabs activeTab="billing" />

          {/* Current plan notice */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 p-4">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Estás en el plan <strong>Gratuito</strong>
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                El pago online estará disponible próximamente. Para contratar un plan, contactanos por email.
              </p>
            </div>
          </div>

          {/* Usage summary */}
          {stats && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Uso actual</h2>
              </div>
              <div className="space-y-4">
                <UsageBar label="Documentos" used={stats.total} limit={5} icon={FileText} />
                <UsageBar label="Clientes" used={stats.totalClients} limit={null} icon={Users} />
                <UsageBar label="Expedientes activos" used={stats.expedientesActivos} limit={null} icon={Briefcase} />
              </div>
            </div>
          )}

          {/* Plans grid */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Planes disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border-2 bg-white dark:bg-slate-800 p-6 shadow-sm transition-shadow hover:shadow-md ${plan.color}`}
                  >
                    {("recommended" in plan && plan.recommended) && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow">
                        Recomendado
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${plan.badgeColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">{plan.period}</span>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => {
                        if (plan.id !== "free") {
                          window.location.href = `mailto:ventas@doculex.ar?subject=${encodeURIComponent(`Quiero contratar el plan ${plan.name}`)}`;
                        }
                      }}
                      disabled={plan.current}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${plan.ctaColor} disabled:opacity-50 disabled:cursor-default`}
                    >
                      {plan.id !== "free" && <ExternalLink className="w-3.5 h-3.5" />}
                      {plan.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <SupportBanner />
        </div>
      </div>
    </div>
  );
}
