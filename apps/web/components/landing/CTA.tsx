import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-28 px-6 md:px-20 overflow-hidden bg-white dark:bg-background-dark">
      <div className="max-w-6xl mx-auto relative">
        {/* Panel principal con mesh gradient animado de fondo */}
        <div className="relative rounded-[3rem] overflow-hidden bg-ink text-white isolate">
          {/* Mesh blobs animados dentro del panel */}
          <div
            aria-hidden="true"
            className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/40 rounded-full blur-[120px] animate-mesh-drift"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gold/30 rounded-full blur-[120px] animate-mesh-drift"
            style={{ animationDelay: "-9s" }}
          />
          {/* Noise texture overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Contenido */}
          <div className="relative z-10 px-8 md:px-16 py-20 md:py-28 text-center space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 px-4 py-2 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                Setup en 2 minutos
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.02] tracking-tight text-balance max-w-4xl mx-auto">
              Dejá de tipear lo que{" "}
              <span className="text-gold-400">
                ya sabés
              </span>
              .
              <br />
              Enfocate en el caso.
            </h2>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Tu primer documento generado con IA está a un click. Sin tarjeta, sin formularios.
            </p>

            {/* Un solo CTA gigante — claridad de acción */}
            <div className="pt-4">
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-3 bg-white text-ink text-lg font-bold h-16 px-10 rounded-brand hover:bg-gold-100 transition-all shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
              >
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Microtexto */}
            <p className="text-sm text-white/50 pt-2">
              7 días de prueba en Pro · Cancelás con 1 click
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
