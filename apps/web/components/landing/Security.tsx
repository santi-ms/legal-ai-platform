import { Shield, Lock, Server, Eye, FileCheck, Users } from "lucide-react";
import { Reveal, RevealStagger, StaggerItem } from "./motion";

const PILLARS = [
  {
    icon: Lock,
    title: "Encriptación de extremo a extremo",
    description:
      "Todo el tráfico viaja sobre TLS 1.2+. Los documentos y datos sensibles se almacenan cifrados en reposo (AES-256).",
  },
  {
    icon: Eye,
    title: "Tus documentos no entrenan IA",
    description:
      "Lo que subís o generás es tuyo. No usamos el contenido de tu cuenta para entrenar modelos propios ni de terceros.",
  },
  {
    icon: Users,
    title: "Aislamiento multi-tenant por diseño",
    description:
      "Cada estudio opera en un espacio lógico aislado. La arquitectura garantiza que los datos de un cliente nunca se mezclen con otros.",
  },
  {
    icon: FileCheck,
    title: "Cumplimiento Ley 25.326",
    description:
      "Operamos bajo el régimen de Protección de Datos Personales de Argentina. Ejercé tus derechos ARCO cuando lo necesites.",
  },
  {
    icon: Server,
    title: "Infraestructura en AWS",
    description:
      "Hosting en Amazon Web Services con backups automáticos diarios y redundancia geográfica. SLA empresarial de disponibilidad.",
  },
  {
    icon: Shield,
    title: "Auditoría y control de accesos",
    description:
      "Cada acción queda registrada. Los roles del estudio permiten limitar quién puede ver, editar o compartir cada expediente.",
  },
];

export function Security() {
  return (
    <section
      id="seguridad"
      className="relative py-28 px-6 md:px-20 bg-ink text-slate-100 overflow-hidden isolate"
    >
      {/* Blobs decorativos primary + gold en el fondo ink */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/25 rounded-full blur-[140px] animate-mesh-drift"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/15 rounded-full blur-[120px] animate-mesh-drift"
        style={{ animationDelay: "-9s" }}
      />
      {/* Noise */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Layout 2-col: izquierda header + CTA, derecha grid pilares */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Izquierda: header editorial */}
          <Reveal className="lg:col-span-5 lg:sticky lg:top-24 h-fit space-y-6">
            <div className="inline-flex items-center gap-2 text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <Shield className="w-3.5 h-3.5" />
              Confidencialidad y cumplimiento
            </div>
            <h2 className="font-display text-4xl md:text-5xl xl:text-6xl font-light tracking-tight text-white text-balance leading-[1.05]">
              Seguridad pensada{" "}
              <span className="italic font-medium text-gold-400">
                para profesionales legales
              </span>
              .
            </h2>
            <p className="text-white/70 text-lg leading-relaxed text-pretty">
              La confidencialidad no es una feature opcional: es requisito de compra. Por eso
              la arquitectura de DocuLex se diseñó con seguridad y privacidad desde el día uno.
            </p>
            <a
              href="#contacto"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold-400 hover:text-gold-300 transition-colors pt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink rounded"
            >
              ¿Requisitos particulares? Hablemos
              <span aria-hidden="true">→</span>
            </a>
          </Reveal>

          {/* Derecha: 2×3 pilares con stagger */}
          <div className="lg:col-span-7">
            <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 gap-5" stagger={0.08}>
              {PILLARS.map((p) => {
                const Icon = p.icon;
                return (
                  <StaggerItem
                    key={p.title}
                    className="group relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-gold/30 hover:bg-white/[0.07] transition-all duration-300"
                  >
                    {/* Icono con tratamiento gold accent */}
                    <div className="relative w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-5 h-5 text-gold-400" />
                    </div>
                    <h3 className="font-display text-lg font-medium mb-2 text-white leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed text-pretty">
                      {p.description}
                    </p>
                  </StaggerItem>
                );
              })}
            </RevealStagger>
          </div>
        </div>
      </div>
    </section>
  );
}
