"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, FileText, Shield, CheckCircle2, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar con ESC
  useEffect(() => {
    if (showDemoModal) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowDemoModal(false);
        }
      };
      document.addEventListener("keydown", handleEscape);
      // Focus en botón de cerrar al abrir
      setTimeout(() => closeButtonRef.current?.focus(), 100);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showDemoModal]);

  // Cerrar al hacer click fuera del modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowDemoModal(false);
    }
  };
  return (
    <header className="relative pt-20 pb-16 px-6 md:px-20 overflow-hidden" id="inicio">
      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col gap-8">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full w-fit border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Nueva generación legal</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-slate-900 dark:text-slate-100">
            Crea documentos{" "}
            <span className="text-primary">legales</span> con IA en minutos
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
            La plataforma líder en Argentina para la generación automática de contratos y documentos con validez jurídica total. Potenciada por inteligencia artificial adaptada a la normativa local.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-primary text-white text-lg font-bold h-14 px-8 rounded-xl hover:shadow-xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
              >
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowDemoModal(true)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-semibold h-14 px-8 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Ver Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-300"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-400"></div>
            </div>
            <span>Más de 5,000 abogados ya confían en nosotros</span>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 group-hover:scale-90 transition-transform duration-700"></div>
          <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-6 rounded-3xl shadow-2xl">
            {/* Window Controls */}
            <div className="flex items-center justify-between mb-8 border-b border-white/20 dark:border-slate-700 pb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="text-xs font-mono opacity-50 uppercase tracking-widest text-slate-600 dark:text-slate-400">
                Editor Inteligente v2.0
              </div>
            </div>

            {/* Card Content */}
            <div className="space-y-4">
              {/* Placeholder lines */}
              <div className="h-4 bg-primary/20 rounded w-3/4"></div>
              <div className="h-4 bg-primary/10 rounded w-1/2"></div>

              {/* Feature Icons */}
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary/40" />
                </div>
                <div className="h-20 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary/40" />
                </div>
                <div className="h-20 bg-primary/30 border border-primary/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* AI Assistant Card */}
              <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/20 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Asistente IA</span>
                </div>
                <p className="text-xs italic leading-relaxed text-slate-600 dark:text-slate-400">
                  "He analizado el Código Civil y Comercial. Se recomienda añadir una cláusula de jurisdicción en CABA para este contrato de locación."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
        >
          <div 
            ref={modalRef}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            <div className="space-y-4">
              <h3 id="demo-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">
                Demo Interactiva
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Estamos preparando una demo interactiva para mostrarte todas las funcionalidades de LegalTech AR. 
                Mientras tanto, podés solicitar una demostración personalizada con nuestro equipo.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setShowDemoModal(false);
                  const subject = encodeURIComponent("Solicitud de Demo");
                  const body = encodeURIComponent("Hola, me gustaría agendar una demostración personalizada.");
                  window.location.href = `mailto:soporte@legaltech.ar?subject=${subject}&body=${body}`;
                }}
                className="flex-1 bg-primary text-white hover:bg-primary/90"
              >
                Solicitar Demo Personalizada
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDemoModal(false)}
                className="flex-1"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

