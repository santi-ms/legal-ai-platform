"use client";

import { Bell } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { NotificationToggle } from "./NotificationToggle";

interface NotificationPreferencesProps {
  preferences: {
    emailNotifications: boolean;
    securityAlerts: boolean;
    productUpdates: boolean;
    vencimientoAlerts?: boolean;
    portalActivityEmails?: boolean;
  };
  onPreferenceChange: (key: string, value: boolean) => void;
}

export function NotificationPreferences({
  preferences,
  onPreferenceChange,
}: NotificationPreferencesProps) {
  const masterOff = !preferences.emailNotifications;

  return (
    <SectionCard
      icon={Bell}
      iconGradient="amber"
      eyebrow="Avisos"
      title="Preferencias de notificación"
      description="Elegí qué avisos querés recibir por email."
    >
      <div className="space-y-6 max-w-3xl">
        {/* Master toggle */}
        <NotificationToggle
          id="email-notifications"
          title="Notificaciones por email"
          description="Habilitar todos los recordatorios y alertas automáticas por email."
          checked={preferences.emailNotifications}
          onChange={(checked) => onPreferenceChange("emailNotifications", checked)}
        />

        {/* Per-category toggles — only relevant when master is on */}
        <div
          className={
            masterOff
              ? "opacity-50 pointer-events-none space-y-6 pl-5 border-l-2 border-slate-200 dark:border-slate-700"
              : "space-y-6 pl-5 border-l-2 border-gradient-to-b from-amber-400 to-orange-500 border-amber-300 dark:border-amber-600/40"
          }
        >
          <NotificationToggle
            id="vencimiento-alerts"
            title="Recordatorios de vencimientos"
            description="Recibir email diario (8:15 hs) cuando un vencimiento se acerca según su alerta configurada."
            checked={preferences.vencimientoAlerts !== false}
            onChange={(checked) => onPreferenceChange("vencimientoAlerts", checked)}
          />
          <NotificationToggle
            id="portal-activity-emails"
            title="Actividad del portal judicial"
            description="Recibir alertas cuando hay movimientos nuevos en tus expedientes del portal."
            checked={preferences.portalActivityEmails !== false}
            onChange={(checked) => onPreferenceChange("portalActivityEmails", checked)}
          />
          <NotificationToggle
            id="security-alerts"
            title="Alertas de seguridad"
            description="Avisar sobre nuevos inicios de sesión en tu cuenta."
            checked={preferences.securityAlerts}
            onChange={(checked) => onPreferenceChange("securityAlerts", checked)}
          />
          <NotificationToggle
            id="product-updates"
            title="Actualizaciones de producto"
            description="Nuevas funcionalidades y mejoras de DocuLex."
            checked={preferences.productUpdates}
            onChange={(checked) => onPreferenceChange("productUpdates", checked)}
          />
        </div>
      </div>
    </SectionCard>
  );
}
