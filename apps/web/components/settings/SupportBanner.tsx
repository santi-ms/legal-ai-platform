"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface SupportBannerProps {
  onContactSupport?: () => void;
  className?: string;
}

export function SupportBanner({ onContactSupport, className }: SupportBannerProps) {
  return (
    <div className={cn("px-4 pb-12", className)}>
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-indigo-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-xl font-bold">¿Necesitas ayuda con tu cuenta?</h4>
            <p className="text-white/80 text-sm">
              Nuestro equipo de soporte está disponible 24/7 para ayudarte.
            </p>
          </div>
          <Button
            onClick={onContactSupport}
            variant="outline"
            className="bg-white text-primary px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap hover:bg-slate-100 transition-colors border-0"
          >
            Contactar Soporte
          </Button>
        </div>
      </div>
    </div>
  );
}

