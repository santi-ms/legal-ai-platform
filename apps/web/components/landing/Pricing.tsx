import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { CONTACT, mailto } from "@/app/lib/site";
import { Reveal, RevealStagger, StaggerItem } from "./motion";

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
      "5 clientes",
      "5 expedientes",
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
    highlight: false,
    badge: null,
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
    price: "$34.999",
    period: "/mes",
    description: "Para mayor volumen",
    highlight: true,
    badge: "Más popular",
    cta: "Suscribirme",
    features: [
      "100 documentos por mes",
      "Clientes ilimitados",
      "Expedientes ilimitados",
      "30 análisis de contratos/mes",
      "Chat con IA",
      "Edición de documentos",
      "20 documentos de referencia",
      "Logo del estudio en PDFs",
      "Analytics + exportar reportes",
      "Soporte por email prioritario",
    ],
    missing: [],
  },
  {
    name: "Equipo",
    price: "$60.000",
    period: "/mes",
    description: "Para estudios de 2 a 3 abogados",
    highlight: false,
    badge: "Equipos chicos",
    cta: "Suscribirme",
    features: [
      "150 documentos por mes",
      "Hasta 3 usuarios",
      "Clientes y expedientes ilimitados",
      "50 análisis de contratos/mes",
      "Chat con IA",
      "Edición de documentos",
      "30 documentos de referencia",
      "Logo del estudio en PDFs",
      "Analytics + exportar reportes",
      "Soporte por email prioritario",
    ],
    missing: [],
  },
  {
    name: "Estudio",
    price: "$45.000",
    period: "/usuario/mes",
    description: "Para estudios jurídicos grandes",
    highlight: false,
    badge: null,
    cta: "Contactar ventas",
    features: [
      "Documentos ilimitados",
      "Usuarios ilimitados (mín. 3)",
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
      className="relative py-28 px-6 md:px-20 bg-parchment dark:bg-background-dark overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header editorial */}
        <Reveal className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-gold-600 dark:text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em] mb-4">
            <Zap className="w-3.5 h-3.5" />
            Planes y precios
          </div>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-5 text-balance leading-[1.05]">
            Elegí el plan que se adapta{" "}
            <span className="text-primary">a tu estudio</span>.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
            Todos los precios en pesos argentinos. Cancelás cuando quieras.
          </p>
        </Reveal>

        {/* Plans grid con stagger */}
        <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 xl:gap-4 items-stretch" stagger={0.08}>
          {PLANS.map((plan) => (
            <StaggerItem
              key={plan.name}
              className={cn(
                "relative rounded-brand flex flex-col transition-all duration-300",
                plan.highlight
                  ? "xl:scale-[1.05] xl:-translate-y-2 z-10"
                  : "hover:-translate-y-1"
              )}
            >
              {/* Borde animado conic para el plan destacado */}
              {plan.highlight && (
                <div
                  aria-hidden="true"
                  className="absolute -inset-[2px] rounded-brand conic-border opacity-70"
                />
              )}

              {/* Card real */}
              <div
                className={cn(
                  "relative flex flex-col h-full p-7 rounded-brand",
                  plan.highlight
                    ? "bg-ink text-white shadow-hover"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-hover"
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className={cn(
                      "absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full",
                      plan.highlight
                        ? "bg-gold text-ink"
                        : "bg-primary text-white"
                    )}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan name & price */}
                <div className="mb-6">
                  <h3
                    className={cn(
                      "text-2xl font-bold tracking-tight mb-1",
                      plan.highlight ? "text-white" : "text-slate-900 dark:text-white"
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={cn(
                      "text-xs mb-5",
                      plan.highlight ? "text-white/60" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-x-1 flex-wrap">
                    <span
                      className={cn(
                        "text-4xl font-extrabold tracking-tight tabular-nums",
                        plan.highlight ? "text-white" : "text-slate-900 dark:text-white"
                      )}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={cn(
                          "text-sm whitespace-nowrap",
                          plan.highlight ? "text-white/60" : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={plan.name === "Estudio" ? "#contacto" : "/auth/register"}
                  className={cn(
                    "w-full text-center text-sm font-bold py-3 rounded-xl mb-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    plan.highlight
                      ? "bg-gold text-ink hover:bg-gold-400 focus-visible:ring-gold focus-visible:ring-offset-ink"
                      : "bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary"
                  )}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={cn(
                          "w-4 h-4 mt-0.5 flex-shrink-0",
                          plan.highlight ? "text-gold-300" : "text-primary"
                        )}
                      />
                      <span
                        className={
                          plan.highlight
                            ? "text-white/90"
                            : "text-slate-700 dark:text-slate-300"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm opacity-40"
                    >
                      <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center leading-none">
                        —
                      </span>
                      <span className="text-slate-400 dark:text-slate-600 line-through">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </RevealStagger>

        {/* Footer note */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-12">
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
