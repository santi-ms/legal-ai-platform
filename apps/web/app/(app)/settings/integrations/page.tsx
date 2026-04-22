"use client";

import { ComingSoonSection } from "@/components/settings/ComingSoonSection";
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
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
  );
}
