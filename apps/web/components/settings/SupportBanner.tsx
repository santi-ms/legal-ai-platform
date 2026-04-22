"use client";

import { LifeBuoy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface SupportBannerProps {
  onContactSupport?: () => void;
  className?: string;
}

export function SupportBanner({ onContactSupport, className }: SupportBannerProps) {
  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      const subject = encodeURIComponent("Soporte - Consulta sobre mi cuenta");
      const body = encodeURIComponent("Hola, necesito ayuda con mi cuenta.");
      window.location.href = `mailto:soporte@legaltech.ar?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div className={cn(className)}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-ink to-slate-900 text-white shadow-soft">
        {/* Accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/20 blur-3xl"
        />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 text-ink flex items-center justify-center shadow-soft">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300">
                Soporte
              </p>
              <h4 className="text-lg sm:text-xl font-bold tracking-tight">
                ¿Necesitás ayuda con tu cuenta?
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                Nuestro equipo está listo para ayudarte con cualquier consulta.
              </p>
            </div>
          </div>
          <Button
            onClick={handleContactSupport}
            className="inline-flex items-center gap-2 bg-white text-ink px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap hover:bg-slate-100 transition-colors shadow-soft"
          >
            Contactar soporte
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
