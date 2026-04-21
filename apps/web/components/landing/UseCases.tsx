import { Briefcase, Scale, User as UserIcon, Building2 } from "lucide-react";

const CASES = [
  {
    icon: Scale,
    tag: "Laboralistas",
    title: "Más cartas documento, menos horas de tipeo",
    bullets: [
      "Carta documento por despido, intimación de pago, reclamo de horas extra.",
      "Demanda laboral con datos del expediente precargados.",
      "Liquidación final con cálculos automáticos y fundamentos del Código Civil y LCT.",
    ],
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
  },
];

export function UseCases() {
  return (
    <section
      id="casos-de-uso"
      className="py-24 px-6 md:px-20 bg-white dark:bg-background-dark"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Briefcase className="w-3.5 h-3.5" />
            PARA QUIÉN ES DOCULEX
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Pensado para{" "}
            <span className="text-primary">tu forma de trabajar</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            Sea que manejes un único expediente o los 50 de la semana, DocuLex
            se adapta a tu flujo. Estos son los casos más frecuentes.
          </p>
        </div>

        {/* Use cases grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CASES.map((c) => {
            const Icon = c.icon;
            return (
              <article
                key={c.tag}
                className="relative p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {c.tag}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-snug">
                  {c.title}
                </h3>
                <ul className="space-y-2.5">
                  {c.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex gap-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                    >
                      <span
                        className="text-primary font-bold mt-0.5"
                        aria-hidden="true"
                      >
                        ›
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
