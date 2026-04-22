"use client";

import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ComingSoonSection } from "@/components/settings/ComingSoonSection";
import { SupportBanner } from "@/components/settings/SupportBanner";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function IntegrationsSettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/integrations");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-parchment dark:bg-ink font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center pb-16">
          <div className="flex flex-col max-w-[1040px] w-full px-4 sm:px-6 lg:px-10">
            <SettingsHeader />

            <div className="mt-2">
              <SettingsTabs activeTab="integrations" />
            </div>

            <div className="mt-6">
              <ComingSoonSection
                title="Integraciones"
                description="Próximamente podrás conectar tu cuenta con servicios externos y gestionar integraciones de terceros."
                features={[
                  "Integración con Google Drive",
                  "Integración con Dropbox",
                  "API keys y tokens",
                  "Webhooks personalizados",
                  "Sincronización con calendarios",
                  "Conectores de CRM",
                ]}
              />
            </div>

            <div className="mt-10">
              <SupportBanner />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

