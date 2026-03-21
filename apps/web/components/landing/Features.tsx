"use client";

import Link from "next/link";
import { Check, History, CloudUpload, MessageSquare, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const mainFeatures = [
  {
    title: "Normativa Argentina",
    description: "Documentos generados con IA entrenada en el Código Civil y Comercial y leyes especiales vigentes en Argentina.",
  },
  {
    title: "Privacidad Garantizada",
    description: "Tus datos están encriptados. No compartimos ni entrenamos modelos con tu información privada.",
  },
  {
    title: "Chat con IA incluido",
    description: "Generá documentos describiendo lo que necesitás en lenguaje natural, sin formularios complicados.",
  },
];

const featureCards = [
  {
    icon: History,
    title: "Historial de Versiones",
    description: "Cada documento guarda un registro completo de cambios.",
    highlighted: false,
  },
  {
    icon: CloudUpload,
    title: "Almacenamiento en la Nube",
    description: "Accedé a tus documentos desde cualquier dispositivo.",
    highlighted: true,
  },
  {
    icon: MessageSquare,
    title: "Asistente IA",
    description: "Preguntale al asistente sobre cualquier cláusula del documento.",
    highlighted: false,
  },
  {
    icon: FileDown,
    title: "Descarga en PDF",
    description: "Documentos con formato profesional, listos para usar.",
    highlighted: false,
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 md:px-20 relative bg-slate-50 dark:bg-slate-900/30" id="funciones">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Main Features */}
          <div className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tecnología de vanguardia para profesionales del derecho
            </h2>

            <div className="space-y-6">
              {mainFeatures.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                      {feature.title}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/auth/register">
              <Button
                variant="outline"
                className="border-2 border-primary text-primary font-bold px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-all"
              >
                Crear cuenta gratis
              </Button>
            </Link>
          </div>

          {/* Right Side - Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 pt-12">
              {featureCards.slice(0, 2).map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl shadow-sm border ${
                      card.highlighted
                        ? "bg-primary text-white border-primary/20 shadow-lg shadow-primary/20"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                    }`}
                  >
                    <Icon
                      className={`mb-4 ${
                        card.highlighted ? "text-white" : "text-primary"
                      }`}
                      size={24}
                    />
                    <h5
                      className={`font-bold mb-2 ${
                        card.highlighted
                          ? "text-white"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {card.title}
                    </h5>
                    <p
                      className={`text-xs ${
                        card.highlighted
                          ? "opacity-80"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              {featureCards.slice(2).map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl shadow-sm border ${
                      card.highlighted
                        ? "bg-primary text-white border-primary/20 shadow-lg shadow-primary/20"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                    }`}
                  >
                    <Icon
                      className={`mb-4 ${
                        card.highlighted ? "text-white" : "text-primary"
                      }`}
                      size={24}
                    />
                    <h5
                      className={`font-bold mb-2 ${
                        card.highlighted
                          ? "text-white"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {card.title}
                    </h5>
                    <p
                      className={`text-xs ${
                        card.highlighted
                          ? "opacity-80"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
