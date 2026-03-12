"use client";

import { Settings } from "lucide-react";
import { NotificationToggle } from "./NotificationToggle";

interface NotificationPreferencesProps {
  preferences: {
    emailNotifications: boolean;
    securityAlerts: boolean;
    productUpdates: boolean;
  };
  onPreferenceChange: (key: string, value: boolean) => void;
}

export function NotificationPreferences({
  preferences,
  onPreferenceChange,
}: NotificationPreferencesProps) {
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
            Elige qué avisos quieres recibir.
          </p>
        </div>
      </div>
      <div className="space-y-6 max-w-2xl">
        <NotificationToggle
          id="email-notifications"
          title="Notificaciones por Email"
          description="Recibe resúmenes diarios de actividad."
          checked={preferences.emailNotifications}
          onChange={(checked) => onPreferenceChange("emailNotifications", checked)}
        />
        <NotificationToggle
          id="security-alerts"
          title="Alertas de Seguridad"
          description="Avisar sobre nuevos inicios de sesión."
          checked={preferences.securityAlerts}
          onChange={(checked) => onPreferenceChange("securityAlerts", checked)}
        />
        <NotificationToggle
          id="product-updates"
          title="Actualizaciones de Producto"
          description="Nuevas funcionalidades y mejoras."
          checked={preferences.productUpdates}
          onChange={(checked) => onPreferenceChange("productUpdates", checked)}
        />
      </div>
    </div>
  );
}

