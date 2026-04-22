"use client";

import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

/**
 * Editorial header para /settings — usa el PageHeader compartido del
 * sistema de diseño para garantizar consistencia con el resto de la app.
 */
export function SettingsHeader() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10">
      <PageHeader
        icon={Settings2}
        iconGradient="slate"
        eyebrow="Configuración"
        title="Ajustes de cuenta"
        description="Tu perfil profesional, datos del estudio, preferencias y apariencia."
      />
    </div>
  );
}
