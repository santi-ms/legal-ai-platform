"use client";

import { Gavel, Zap, Shield, Users } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Automatización Inteligente",
    description: "Reduce el tiempo en tareas administrativas hasta en un 40%.",
  },
  {
    icon: Shield,
    title: "Seguridad de Grado Bancario",
    description: "Tus expedientes protegidos con cifrado de extremo a extremo.",
  },
  {
    icon: Users,
    title: "Colaboración en Tiempo Real",
    description: "Conecta a todo tu equipo legal en un solo lugar.",
  },
];

export function RegisterSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-1/3 bg-primary p-12 flex-col justify-between text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <Gavel className="w-10 h-10" />
          <h1 className="text-2xl font-bold tracking-tight">LegalTech AR</h1>
        </div>

        {/* Main content */}
        <div className="space-y-8">
          <h2 className="text-4xl font-extrabold leading-tight">
            La nueva era de la gestión legal digital.
          </h2>

          {/* Features list */}
          <ul className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <li key={index} className="flex items-start gap-4">
                  <div className="mt-1 bg-white/20 p-2 rounded-lg flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className="text-white/80">{feature.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Testimonial */}
      <div className="relative z-10 mt-auto pt-10 border-t border-white/20">
        <p className="text-sm italic opacity-80">
          "LegalTech AR ha transformado la forma en que manejamos nuestros litigios, permitiéndonos enfocarnos en lo que importa: nuestros clientes."
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400"></div>
          </div>
          <div>
            <p className="font-bold text-sm">Alejandro Ruiz</p>
            <p className="text-xs opacity-70">Socio Director, Ruiz & Asociados</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

