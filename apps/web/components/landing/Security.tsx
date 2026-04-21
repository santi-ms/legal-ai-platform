import { Shield, Lock, Server, Eye, FileCheck, Users } from "lucide-react";

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
      "Cada estudio opera en un espacio lógico aislado. La arquitectura garantiza que los datos de un cliente nunca puedan mezclarse con los de otro.",
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
      className="py-24 px-6 md:px-20 bg-slate-50 dark:bg-slate-900/30"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Shield className="w-3.5 h-3.5" />
            CONFIDENCIALIDAD Y CUMPLIMIENTO
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Seguridad pensada{" "}
            <span className="text-primary">para profesionales legales</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            La confidencialidad no es una feature opcional: es requisito de
            compra. Por eso la arquitectura de DocuLex se diseñó con seguridad y
            privacidad desde el día uno.
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-slate-100">
                  {p.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿Tu estudio tiene requisitos particulares de cumplimiento?{" "}
            <a
              href="#contacto"
              className="text-primary hover:underline font-semibold"
            >
              Hablemos
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
