import { Briefcase, Scale, User as UserIcon, Building2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Reveal, RevealStagger, StaggerItem } from "./motion";

const CASES = [
  {
    icon: Scale,
    tag: "Laboralistas",
    title: "Más cartas documento, menos horas de tipeo",
    bullets: [
      "Cartas documento por despido, intimación de pago, reclamo de horas extra.",
      "Demanda laboral con datos del expediente precargados.",
      "Liquidación final con cálculos automáticos y fundamentos de la LCT.",
    ],
    /** Gradiente distintivo por segmento */
    gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    accent: "text-rose-600 dark:text-rose-400",
    accentBg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Building2,
    tag: "Corporativo",
    title: "Contratos y NDAs sin copiar-pegar plantillas viejas",
    bullets: [
      "Contrato de servicios profesionales con cláusula de jurisdicción configurable.",
      "Acuerdos de confidencialidad (NDA) unilaterales o bilaterales.",
      "Poderes especiales y contratos de locación comercial con validez en CABA y provincias.",
    ],
    gradient: "from-primary/20 via-primary/5 to-transparent",
    accent: "text-primary",
    accentBg: "bg-primary/10 border-primary/20",
  },
  {
    icon: UserIcon,
    tag: "Abogado independiente",
    title: "Todo tu estudio en una sola herramienta",
    bullets: [
      "Clientes, expedientes y vencimientos en un panel único.",
      "Referencias de tus documentos anteriores — la IA imita tu estilo.",
      "Compartí documentos con tus clientes por link público, con expiración automática.",
    ],
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    accent: "text-emerald-700 dark:text-emerald-400",
    accentBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Briefcase,
    tag: "Estudios jurídicos",
    title: "Equipos con roles, branding propio y analytics",
    bullets: [
      "Usuarios ilimitados con permisos granulares por expediente.",
      "Logo de tu estudio en todos los documentos generados.",
      "Reportes de productividad exportables para facturación interna.",
    ],
    gradient: "from-gold/20 via-gold/5 to-transparent",
    accent: "text-gold-600 dark:text-gold-400",
    accentBg: "bg-gold/10 border-gold/20",
  },
];

export function UseCases() {
  return (
    <section
      id="casos-de-uso"
      className="relative py-28 px-6 md:px-20 bg-parchment dark:bg-background-dark texture-noise"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header editorial */}
        <Reveal className="text-center mb-16 max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 text-gold-600 dark:text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <Briefcase className="w-3.5 h-3.5" />
            Para quién es DocuLex
          </div>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.05]">
            Pensado para{" "}
            <span className="text-primary">tu forma de trabajar</span>.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed text-pretty">
            Sea que manejes un único expediente o los 50 de la semana, DocuLex se adapta
            a tu flujo. Estos son los casos más frecuentes.
          </p>
        </Reveal>

        {/* Cards con gradientes por segmento */}
        <RevealStagger className="grid grid-cols-1 md:grid-cols-2 gap-6" stagger={0.1}>
          {CASES.map((c) => {
            const Icon = c.icon;
            return (
              <StaggerItem key={c.tag}>
                <article className="group relative h-full p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-hover">
                  {/* Blob gradiente decorativo */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl bg-gradient-to-br opacity-70 group-hover:opacity-100 transition-opacity duration-500",
                      c.gradient
                    )}
                  />

                  <div className="relative z-10">
                    {/* Header con icono */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl border flex items-center justify-center",
                          c.accentBg,
                          c.accent
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {c.tag}
                      </span>
                    </div>

                    {/* Title serif */}
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.15] text-balance">
                      {c.title}
                    </h3>

                    {/* Bullets */}
                    <ul className="space-y-3">
                      {c.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-pretty"
                        >
                          <span
                            className={cn("font-bold mt-0.5", c.accent)}
                            aria-hidden="true"
                          >
                            ›
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </RevealStagger>
      </div>
    </section>
  );
}
