"use client";

import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ComingSoonSection } from "@/components/settings/ComingSoonSection";
import { SupportBanner } from "@/components/settings/SupportBanner";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SecuritySettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/security");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <SettingsHeader />

            {/* Hero Section */}
            <div className="flex flex-wrap justify-between gap-3 p-4 mt-6">
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-slate-900 dark:text-white">
                  Ajustes del Sistema
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
                  Administra tu cuenta, suscripciones y preferencias de seguridad.
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <SettingsTabs activeTab="security" />

            {/* Coming Soon Section */}
            <ComingSoonSection
              title="Seguridad"
              description="Próximamente podrás gestionar la seguridad de tu cuenta, incluyendo cambio de contraseña y autenticación de dos factores."
              features={[
                "Cambio de contraseña",
                "Autenticación de dos factores (2FA)",
                "Sesiones activas",
                "Historial de inicios de sesión",
                "Dispositivos confiables",
                "Configuración de recuperación de cuenta",
              ]}
            />

            {/* Support Banner */}
            <SupportBanner />
          </div>
        </div>
      </div>
    </div>
  );
}

