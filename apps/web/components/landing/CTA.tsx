"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="py-24 px-6 md:px-20 overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        <div className="absolute inset-0 bg-primary rounded-[40px] rotate-1"></div>
        <div className="relative bg-background-dark text-white p-12 md:p-20 rounded-[40px] text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-black">
            ¿Listo para transformar tu práctica legal?
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Unite a los miles de profesionales que están ahorrando tiempo y reduciendo errores con LegalTech AR.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-primary text-white text-lg font-bold h-14 px-10 rounded-xl hover:scale-105 transition-transform"
              >
                Empezar Prueba Gratuita
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const subject = encodeURIComponent("Consulta - Hablar con un Asesor");
                const body = encodeURIComponent("Hola, me gustaría hablar con un asesor sobre LegalTech AR.");
                window.location.href = `mailto:soporte@legaltech.ar?subject=${subject}&body=${body}`;
              }}
              className="bg-transparent border border-slate-700 text-lg font-bold h-14 px-10 rounded-xl hover:bg-slate-800 transition-colors text-white"
            >
              Hablar con un Asesor
            </Button>
          </div>

          <p className="text-xs text-slate-500">
            No requiere tarjeta de crédito • 14 días de prueba full • Cancelá en cualquier momento
          </p>
        </div>
      </div>
    </section>
  );
}

