"use client";

import { Settings } from "lucide-react";
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
    <div className="px-4 py-8 border-t border-slate-200 dark:border-slate-800 mt-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Preferencias de Notificación
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Elegí qué avisos querés recibir por email.
          </p>
        </div>
      </div>
      <div className="space-y-6 max-w-2xl">
        {/* Master toggle */}
        <NotificationToggle
          id="email-notifications"
          title="Notificaciones por Email"
          description="Habilitar todos los recordatorios y alertas automáticas por email."
          checked={preferences.emailNotifications}
          onChange={(checked) => onPreferenceChange("emailNotifications", checked)}
        />

        {/* Per-category toggles — only relevant when master is on */}
        <div
          className={
            masterOff
              ? "opacity-50 pointer-events-none space-y-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700"
              : "space-y-6 pl-4 border-l-2 border-primary/20"
          }
        >
          <NotificationToggle
            id="vencimiento-alerts"
            title="Recordatorios de Vencimientos"
            description="Recibir email diario (8:15 hs) cuando un vencimiento se acerca según su alerta configurada."
            checked={preferences.vencimientoAlerts !== false}
            onChange={(checked) => onPreferenceChange("vencimientoAlerts", checked)}
          />
          <NotificationToggle
            id="portal-activity-emails"
            title="Actividad del Portal Judicial"
            description="Recibir alertas cuando hay movimientos nuevos en tus expedientes del portal."
            checked={preferences.portalActivityEmails !== false}
            onChange={(checked) => onPreferenceChange("portalActivityEmails", checked)}
          />
          <NotificationToggle
            id="security-alerts"
            title="Alertas de Seguridad"
            description="Avisar sobre nuevos inicios de sesión en tu cuenta."
            checked={preferences.securityAlerts}
            onChange={(checked) => onPreferenceChange("securityAlerts", checked)}
          />
          <NotificationToggle
            id="product-updates"
            title="Actualizaciones de Producto"
            description="Nuevas funcionalidades y mejoras de DocuLex."
            checked={preferences.productUpdates}
            onChange={(checked) => onPreferenceChange("productUpdates", checked)}
          />
        </div>
      </div>
    </div>
  );
}
