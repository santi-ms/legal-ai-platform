import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { CONTACT, mailto } from "@/app/lib/site";

const PLANS = [
  {
    name: "Free",
    price: "Gratis",
    period: "",
    description: "Para explorar la plataforma",
    highlight: false,
    badge: null,
    cta: "Empezar gratis",
    features: [
      "5 documentos por mes",
      "3 clientes",
      "2 expedientes",
      "2 análisis de contratos/mes",
      "Flujo guiado de generación",
    ],
    missing: [
      "Chat con IA",
      "Edición de documentos",
      "Documentos de referencia",
      "Analytics",
    ],
  },
  {
    name: "Pro",
    price: "$24.999",
    period: "/mes",
    description: "Para abogados independientes",
    highlight: true,
    badge: "Más popular",
    cta: "Probar 7 días gratis",
    features: [
      "50 documentos por mes",
      "Clientes ilimitados",
      "Expedientes ilimitados",
      "15 análisis de contratos/mes",
      "Chat con IA",
      "Edición de documentos",
      "10 documentos de referencia",
      "Analytics de actividad",
      "Soporte por email prioritario",
    ],
    missing: [],
  },
  {
    name: "Pro+",
    price: "$35.000",
    period: "/mes",
    description: "Para mayor volumen",
    highlight: false,
    badge: null,
    cta: "Comenzar ahora",
    features: [
      "100 documentos por mes",
      "Clientes ilimitados",
      "Expedientes ilimitados",
      "30 análisis de contratos/mes",
      "Chat con IA",
      "Edición de documentos",
      "20 documentos de referencia",
      "Analytics + exportar reportes",
      "Soporte por email prioritario",
    ],
    missing: [],
  },
  {
    name: "Estudio",
    price: "$45.000",
    period: "/usuario/mes",
    description: "Para estudios jurídicos",
    highlight: false,
    badge: "Equipos",
    cta: "Contactar ventas",
    features: [
      "Documentos ilimitados",
      "Usuarios ilimitados",
      "Clientes y expedientes ilimitados",
      "Análisis ilimitados",
      "Chat con IA",
      "Edición de documentos",
      "Referencias ilimitadas",
      "Logo del estudio en documentos",
      "Analytics + exportar reportes",
      "Soporte prioritario + onboarding",
    ],
    missing: [],
  },
];

export function Pricing() {
  return (
    <section
      id="precios"
      className="py-24 px-6 md:px-20 bg-white dark:bg-background-dark"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5" />
            PLANES Y PRECIOS
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Elegí el plan que se adapta<br className="hidden md:block" /> a tu estudio
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
            Todos los precios en pesos argentinos. Cancelá cuando quieras.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border p-7 flex flex-col transition-all duration-200",
                plan.highlight
                  ? "border-primary bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.03]"
                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-primary/40 hover:shadow-lg"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full",
                  plan.highlight
                    ? "bg-white text-primary"
                    : "bg-primary text-white"
                )}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-6">
                <h3 className={cn(
                  "text-lg font-bold mb-1",
                  plan.highlight ? "text-white" : "text-slate-900 dark:text-white"
                )}>
                  {plan.name}
                </h3>
                <p className={cn(
                  "text-xs mb-4",
                  plan.highlight ? "text-white/70" : "text-slate-500 dark:text-slate-400"
                )}>
                  {plan.description}
                </p>
                <div className="flex items-end gap-1">
                  <span className={cn(
                    "text-3xl font-extrabold",
                    plan.highlight ? "text-white" : "text-slate-900 dark:text-white"
                  )}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={cn(
                      "text-sm mb-1",
                      plan.highlight ? "text-white/70" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <Link
                href={plan.name === "Estudio" ? "#contacto" : "/auth/register"}
                className={cn(
                  "w-full text-center text-sm font-bold py-2.5 rounded-xl mb-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  plan.highlight
                    ? "bg-white text-primary hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-primary"
                    : "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary"
                )}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={cn(
                      "w-4 h-4 mt-0.5 flex-shrink-0",
                      plan.highlight ? "text-white" : "text-primary"
                    )} />
                    <span className={plan.highlight ? "text-white/90" : "text-slate-700 dark:text-slate-300"}>
                      {f}
                    </span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                    <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center leading-none">—</span>
                    <span className="text-slate-400 dark:text-slate-600 line-through">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10">
          ¿Dudas sobre qué plan elegir?{" "}
          <a
            href={mailto(CONTACT.support, "Consulta sobre planes")}
            className="text-primary hover:underline font-medium"
          >
            Escribinos
          </a>{" "}
          y te ayudamos.
        </p>
      </div>
    </section>
  );
}
