"use client";

import Link from "next/link";
import { ArrowRight, Clock, Shield, Sparkles, Mail, KeyRound } from "lucide-react";
import type { ReactNode } from "react";

export type AuthPanelVariant = "login" | "register" | "reset" | "verify";

interface AuthSidePanelProps {
  variant: AuthPanelVariant;
}

interface PanelContent {
  eyebrow: string;
  title: ReactNode;
  description: string;
  /** Lista de puntos a mostrar debajo del título */
  bullets: Array<{ icon: typeof Clock; title: string; description: string }>;
  /** Testimonial opcional */
  quote?: {
    text: string;
    author: string;
    role: string;
  };
}

const CONTENT: Record<AuthPanelVariant, PanelContent> = {
  login: {
    eyebrow: "Bienvenido de vuelta",
    title: (
      <>
        Tu estudio, <span className="text-gold-400">siempre a mano</span>.
      </>
    ),
    description:
      "Ingresá para retomar tus expedientes, generar documentos y coordinar tu equipo desde cualquier dispositivo.",
    bullets: [
      {
        icon: Clock,
        title: "Retomá donde lo dejaste",
        description: "Tus borradores, chats y documentos te esperan intactos.",
      },
      {
        icon: Shield,
        title: "Sesión cifrada",
        description: "TLS 1.2+ punta a punta y aislamiento por estudio.",
      },
    ],
    quote: {
      text: "DocuLex me devolvió horas que antes se iban en redacción repetitiva. Ahora dedico ese tiempo a los clientes.",
      author: "Alejandra Pérez",
      role: "Abogada laboralista",
    },
  },
  register: {
    eyebrow: "Creá tu cuenta",
    title: (
      <>
        La nueva era de la <span className="text-gold-400">gestión legal</span>.
      </>
    ),
    description:
      "Sumate a los estudios que ya delegan las tareas repetitivas en DocuLex y ganan horas para lo que importa.",
    bullets: [
      {
        icon: Sparkles,
        title: "Asistentes IA especializados",
        description: "Redacción, análisis y chat entrenados en derecho argentino.",
      },
      {
        icon: Shield,
        title: "Confidencialidad por diseño",
        description: "Tus documentos no entrenan modelos. Cifrado AES-256 en reposo.",
      },
      {
        icon: Clock,
        title: "Setup en 2 minutos",
        description: "Sin tarjeta de crédito. Empezás con el plan gratis.",
      },
    ],
  },
  reset: {
    eyebrow: "Recuperar acceso",
    title: (
      <>
        Volvé a tu estudio en <span className="text-gold-400">un par de clics</span>.
      </>
    ),
    description:
      "Te enviamos un enlace seguro a tu correo. Por tu seguridad, caduca en minutos y se invalida al usarlo.",
    bullets: [
      {
        icon: Mail,
        title: "Enlace al instante",
        description: "Revisá bandeja de entrada y, si hace falta, la carpeta de spam.",
      },
      {
        icon: KeyRound,
        title: "Contraseña nueva, sesión nueva",
        description: "Al cambiarla, se cierran las sesiones activas en otros equipos.",
      },
    ],
  },
  verify: {
    eyebrow: "Último paso",
    title: (
      <>
        Activá tu cuenta y <span className="text-gold-400">empezá a trabajar</span>.
      </>
    ),
    description:
      "Validamos tu correo para mantener aislados los espacios de trabajo y proteger la información de cada estudio.",
    bullets: [
      {
        icon: Mail,
        title: "Código de 6 dígitos",
        description: "Llega en segundos. Expira a los 10 minutos por seguridad.",
      },
      {
        icon: Shield,
        title: "Sólo vos accedés",
        description: "Nadie puede entrar a tu cuenta hasta que confirmes el correo.",
      },
    ],
  },
};

/**
 * Panel lateral de las páginas de auth.
 *
 * Reutiliza los tokens visuales de la landing: fondo `bg-ink`, acento
 * `text-gold-400`, mesh blobs en primary + gold, textura noise SVG y
 * la estética editorial de Inter extrabold tracking-tight.
 *
 * Es un Client Component porque anima con CSS keyframes (`animate-mesh-drift`)
 * y porque el wordmark linkea a `/` con hover de Tailwind.
 */
export function AuthSidePanel({ variant }: AuthSidePanelProps) {
  const content = CONTENT[variant];

  return (
    <aside className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] bg-ink text-white overflow-hidden isolate">
      {/* Mesh blob primary — esquina superior derecha */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-primary/30 rounded-full blur-[140px] animate-mesh-drift"
      />
      {/* Mesh blob gold — esquina inferior izquierda */}
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-32 w-[420px] h-[420px] bg-gold/20 rounded-full blur-[120px] animate-mesh-drift"
        style={{ animationDelay: "-9s" }}
      />

      {/* Noise SVG para textura editorial */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col w-full px-12 py-14">
        {/* Wordmark — mismo lenguaje que el Footer de la landing */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-3xl font-extrabold tracking-tight text-white hover:text-gold-300 transition-colors w-fit group"
        >
          doculex<span className="text-gold-400">.</span>
          <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </Link>

        {/* Bloque central */}
        <div className="flex-1 flex flex-col justify-center max-w-lg space-y-7 py-10">
          <div className="inline-flex items-center gap-2 text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em] w-fit">
            <span className="w-4 h-px bg-gold-400" />
            {content.eyebrow}
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.05] text-balance">
            {content.title}
          </h1>

          <p className="text-white/70 text-base leading-relaxed text-pretty">
            {content.description}
          </p>

          <ul className="space-y-4 pt-4">
            {content.bullets.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.title} className="flex items-start gap-3">
                  <div className="mt-0.5 w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gold-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-white tracking-tight">
                      {b.title}
                    </p>
                    <p className="text-sm text-white/60 leading-snug">
                      {b.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Testimonial opcional */}
        {content.quote ? (
          <figure className="relative pt-6 border-t border-white/10 max-w-lg">
            <blockquote className="text-sm text-white/80 leading-relaxed text-pretty">
              &ldquo;{content.quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-ink font-bold text-sm"
                aria-hidden="true"
              >
                {content.quote.author
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">{content.quote.author}</p>
                <p className="text-white/50">{content.quote.role}</p>
              </div>
            </figcaption>
          </figure>
        ) : (
          <p className="text-xs text-white/40 pt-6 border-t border-white/10 max-w-lg">
            © {new Date().getFullYear()} DocuLex — Hecho en Argentina.
          </p>
        )}
      </div>
    </aside>
  );
}
