import Link from "next/link";
import {
  PenLine,
  ScanSearch,
  MessageSquare,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Reveal, RevealStagger, StaggerItem } from "./motion";

/**
 * Bento grid — 3 asistentes IA.
 *
 * Layout desktop (12 cols × 2 rows):
 *   ┌───────────────────────┬──────────────┐
 *   │                       │  Analiza     │
 *   │  Doku Genera          │  (6,1)       │
 *   │  (grande, 7×2)        ├──────────────┤
 *   │                       │  Consulta    │
 *   │                       │  (5,1)       │
 *   └───────────────────────┴──────────────┘
 *
 * Mobile: stack vertical.
 */

const FEATURE_GENERA = {
  name: "Doku Genera",
  tagline: "Redactá cualquier documento legal en minutos",
  description:
    "Describí lo que necesitás en lenguaje natural y la IA redacta el documento completo: contratos, cartas documento, poderes notariales, acuerdos de confidencialidad.",
  icon: PenLine,
  features: [
    "Chat conversacional con IA",
    "Documentos de referencia (imita tu estilo)",
    "Descarga en PDF y Word",
    "Revisiones con sugerencias",
  ],
  conversation: [
    {
      role: "user" as const,
      text: "Necesito un contrato de locación para un depto en Corrientes capital, $300.000 por mes, 2 años.",
    },
    {
      role: "ai" as const,
      text: "Perfecto. ¿Cómo se instrumenta la garantía: propietaria, seguro de caución o fiador solidario?",
    },
    {
      role: "user" as const,
      text: "Garantía propietaria. Y sumá cláusula de ajuste semestral por ICL.",
    },
    {
      role: "ai" as const,
      text: "CONTRATO DE LOCACIÓN — Entre el Sr. [LOCADOR], DNI...",
      mono: true,
    },
  ],
};

const FEATURE_ANALIZA = {
  name: "Doku Analiza",
  tagline: "Detectá riesgos en contratos automáticamente",
  description:
    "Subí cualquier contrato. La IA lo analiza cláusula por cláusula e identifica riesgos con nivel alto, medio o bajo.",
  icon: ScanSearch,
  features: [
    "Riesgo alto / medio / bajo por cláusula",
    "Informe PDF descargable",
    "Sugerencias de modificación",
  ],
};

const FEATURE_CONSULTA = {
  name: "Doku Consulta",
  tagline: "Preguntale a tus documentos",
  description:
    "Seleccioná cualquier documento generado y hacele preguntas en lenguaje natural. La IA responde con precisión sobre el contenido exacto.",
  icon: MessageSquare,
  features: [
    "Preguntas sobre cláusulas específicas",
    "Explicación en lenguaje simple",
    "Contexto del documento real",
  ],
};

export function Features() {
  return (
    <section
      className="relative py-28 px-6 md:px-20 bg-white dark:bg-background-dark"
      id="funciones"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header editorial */}
        <Reveal className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-gold-600 dark:text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em] mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Tres asistentes IA
          </div>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-5 text-balance leading-[1.05]">
            Un asistente para cada{" "}
            <span className="text-primary">tarea</span>.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed text-pretty">
            Cada uno está especializado y todos fueron entrenados en normativa argentina.
          </p>
        </Reveal>

        {/* Bento grid con stagger */}
        <RevealStagger className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:auto-rows-fr" stagger={0.12}>
          {/* ── Card 1: Doku Genera (grande, 7×2) ───────────────── */}
          <StaggerItem className="lg:col-span-7 lg:row-span-2">
          <article className="relative group rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-indigo-600 text-white p-8 md:p-10 flex flex-col h-full min-h-[480px] shadow-soft hover:shadow-hover transition-all duration-500">
            {/* Mesh blob decorativo */}
            <div
              aria-hidden="true"
              className="absolute -top-20 -right-20 w-72 h-72 bg-gold/20 rounded-full blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />

            <div className="relative z-10 flex flex-col h-full gap-6">
              {/* Eyebrow */}
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.18em]">
                    Asistente IA · Principal
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    {FEATURE_GENERA.name}
                  </h3>
                </div>
              </div>

              {/* Tagline editorial serif */}
              <p className="text-2xl md:text-3xl font-bold leading-[1.15] text-white text-balance tracking-tight">
                {FEATURE_GENERA.tagline}
              </p>

              <p className="text-white/70 leading-relaxed text-pretty max-w-lg">
                {FEATURE_GENERA.description}
              </p>

              {/* Chat bubble preview — el corazón de la card */}
              <div className="mt-auto space-y-3 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                {FEATURE_GENERA.conversation.map((msg, idx) => {
                  const isLast = idx === FEATURE_GENERA.conversation.length - 1;
                  if (msg.role === "user") {
                    return (
                      <div key={idx} className="flex justify-end">
                        <div className="max-w-[85%] bg-white text-primary text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-lg">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="size-7 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <PenLine className="w-3.5 h-3.5 text-gold-300" />
                      </div>
                      <div
                        className={`max-w-[85%] bg-ink/60 text-white/90 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 border border-white/10 ${
                          msg.mono ? "font-mono" : ""
                        }`}
                      >
                        {msg.text}
                        {isLast && msg.mono ? (
                          <span className="inline-block w-0.5 h-3.5 bg-white/60 ml-0.5 animate-pulse align-middle" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-gold-300 transition-colors rounded-md w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              >
                Probarlo gratis
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
          </StaggerItem>

          {/* ── Card 2: Doku Analiza ──────────────────────────── */}
          <StaggerItem className="lg:col-span-5">
            <SmallFeatureCard feature={FEATURE_ANALIZA} accent="amber" />
          </StaggerItem>

          {/* ── Card 3: Doku Consulta ─────────────────────────── */}
          <StaggerItem className="lg:col-span-5">
            <SmallFeatureCard feature={FEATURE_CONSULTA} accent="emerald" />
          </StaggerItem>
        </RevealStagger>
      </div>
    </section>
  );
}

// ─── Small feature card ─────────────────────────────────────────────────────

interface SmallFeature {
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  features: string[];
}

function SmallFeatureCard({
  feature,
  accent,
}: {
  feature: SmallFeature;
  accent: "amber" | "emerald";
}) {
  const Icon = feature.icon;
  const accentClasses = {
    amber: {
      iconBg: "bg-amber-100 dark:bg-amber-900/20",
      iconColor: "text-amber-700 dark:text-amber-400",
      checkBg: "bg-amber-100 dark:bg-amber-900/30",
      checkColor: "text-amber-700 dark:text-amber-400",
      hoverBorder: "hover:border-amber-400/40",
    },
    emerald: {
      iconBg: "bg-emerald-100 dark:bg-emerald-900/20",
      iconColor: "text-emerald-700 dark:text-emerald-400",
      checkBg: "bg-emerald-100 dark:bg-emerald-900/30",
      checkColor: "text-emerald-700 dark:text-emerald-400",
      hoverBorder: "hover:border-emerald-400/40",
    },
  }[accent];

  return (
    <article
      className={cn(
        "relative lg:h-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-7 md:p-8 flex flex-col gap-4 shadow-soft hover:shadow-hover transition-all duration-300",
        accentClasses.hoverBorder
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("size-11 rounded-xl flex items-center justify-center", accentClasses.iconBg)}>
          <Icon className={cn("w-5 h-5", accentClasses.iconColor)} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">
            Asistente IA
          </p>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {feature.name}
          </h3>
        </div>
      </div>

      <p className="text-xl md:text-2xl font-bold leading-[1.2] text-slate-900 dark:text-white text-balance tracking-tight">
        {feature.tagline}
      </p>

      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed text-pretty">
        {feature.description}
      </p>

      <ul className="space-y-2 pt-2 lg:mt-auto">
        {feature.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <div
              className={cn(
                "size-5 rounded-full flex items-center justify-center flex-shrink-0",
                accentClasses.checkBg,
                accentClasses.checkColor
              )}
            >
              <Check className="w-3 h-3" />
            </div>
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}
