"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { SettingsActions } from "@/components/settings/SettingsActions";
import { SupportBanner } from "@/components/settings/SupportBanner";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/app/lib/webApi";
import { AlertTriangle, ArrowLeft, Loader2, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
}

interface NotificationPreferencesData {
  emailNotifications: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferencesData>({
    emailNotifications: true,
    securityAlerts: true,
    productUpdates: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<{
    profile: ProfileFormData;
    notifications: NotificationPreferencesData;
  } | null>(null);

  // loadError: falla al cargar el perfil desde la API
  const [loadError, setLoadError] = useState<string | null>(null);

  // formError: error de validación o falla al guardar
  const [formError, setFormError] = useState<string | null>(null);

  // ── Carga del perfil ──────────────────────────────────────────────────────
  const loadProfile = async () => {
    setLoadError(null);
    try {
      setIsLoading(true);
      const profile = await getUserProfile();

      const initialProfile: ProfileFormData = {
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        bio: profile.bio || "",
      };

      const initialNotifications: NotificationPreferencesData = {
        emailNotifications: profile.notificationPreferences.emailNotifications ?? true,
        securityAlerts: profile.notificationPreferences.securityAlerts ?? true,
        productUpdates: profile.notificationPreferences.productUpdates ?? false,
      };

      setProfileData(initialProfile);
      setNotificationPreferences(initialNotifications);
      setInitialData({
        profile: initialProfile,
        notifications: initialNotifications,
      });
    } catch (err: any) {
      console.error("Error loading profile:", err);

      // Fallback a datos de sesión si están disponibles
      if (session?.user) {
        const nameParts = session.user.name?.split(" ") || [];
        const fallbackProfile: ProfileFormData = {
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: session.user.email || "",
          bio: "",
        };
        setProfileData(fallbackProfile);
        setInitialData({
          profile: fallbackProfile,
          notifications: {
            emailNotifications: true,
            securityAlerts: true,
            productUpdates: false,
          },
        });
        // Mostramos el error pero permitimos operar con datos de sesión
        setLoadError("No pudimos cargar tu perfil completo. Algunos datos pueden estar desactualizados.");
      } else {
        // Sin datos de sesión: bloquear con error claro y opción de reintentar
        setLoadError("No pudimos cargar tu perfil. Revisá tu conexión e intentá de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // ── Detectar cambios ──────────────────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      const profileChanged =
        profileData.firstName !== initialData.profile.firstName ||
        profileData.lastName !== initialData.profile.lastName ||
        profileData.email !== initialData.profile.email ||
        profileData.bio !== initialData.profile.bio;

      const notificationsChanged =
        notificationPreferences.emailNotifications !== initialData.notifications.emailNotifications ||
        notificationPreferences.securityAlerts !== initialData.notifications.securityAlerts ||
        notificationPreferences.productUpdates !== initialData.notifications.productUpdates;

      setHasChanges(profileChanged || notificationsChanged);
    }
  }, [profileData, notificationPreferences, initialData]);

  // ── Redirección si no autenticado ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProfileFieldChange = (field: string, value: string) => {
    setFormError(null);
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setNotificationPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleDiscard = () => {
    if (initialData) {
      setProfileData(initialData.profile);
      setNotificationPreferences(initialData.notifications);
      setHasChanges(false);
      setFormError(null);
      success("Cambios descartados");
    }
  };

  const handleSave = async () => {
    setFormError(null);

    // Validación inline — no toasts
    if (!profileData.firstName.trim()) {
      setFormError("El nombre es requerido para guardar los cambios.");
      return;
    }
    if (!profileData.email.trim() || !profileData.email.includes("@")) {
      setFormError("El correo electrónico no es válido. Verificá que tenga el formato correcto.");
      return;
    }

    setIsLoading(true);
    try {
      const fullName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim();

      const updatedProfile = await updateUserProfile({
        profile: {
          name: fullName,
          email: profileData.email.trim(),
          bio: profileData.bio.trim() || null,
        },
        notificationPreferences: {
          emailNotifications: notificationPreferences.emailNotifications,
          securityAlerts: notificationPreferences.securityAlerts,
          productUpdates: notificationPreferences.productUpdates,
        },
      });

      const updatedProfileData: ProfileFormData = {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        email: updatedProfile.email,
        bio: updatedProfile.bio,
      };

      const updatedNotifications: NotificationPreferencesData = {
        emailNotifications: updatedProfile.notificationPreferences.emailNotifications,
        securityAlerts: updatedProfile.notificationPreferences.securityAlerts,
        productUpdates: updatedProfile.notificationPreferences.productUpdates,
      };

      setProfileData(updatedProfileData);
      setNotificationPreferences(updatedNotifications);
      setInitialData({
        profile: updatedProfileData,
        notifications: updatedNotifications,
      });
      setHasChanges(false);
      success("Configuración guardada exitosamente");

      // Refresca datos del servidor sin reload destructivo
      if (session) {
        router.refresh();
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setFormError(err.message || "No pudimos guardar la configuración. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Soporte - Consulta sobre mi cuenta");
    const body = encodeURIComponent("Hola, necesito ayuda con mi cuenta.");
    window.location.href = `mailto:soporte@legaltech.ar?subject=${subject}&body=${body}`;
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  // ── Guards de render ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
            <div className="flex flex-col gap-4 p-4 mt-6">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al panel
                </Button>
              </div>
              <div className="flex min-w-72 flex-col gap-3">
                <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-slate-900 dark:text-white">
                  Ajustes del sistema
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
                  Administrá tu cuenta, suscripciones y preferencias de seguridad.
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <SettingsTabs activeTab="profile" />

            {/* Error de carga — con opción de reintentar */}
            {loadError && (
              <div className="mx-4 mt-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {loadError}
                  </p>
                  <button
                    onClick={loadProfile}
                    className="mt-1 text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Profile Section */}
            <ProfileSection
              formData={profileData}
              onFieldChange={handleProfileFieldChange}
            />

            {/* Notification Preferences */}
            <NotificationPreferences
              preferences={notificationPreferences}
              onPreferenceChange={handlePreferenceChange}
            />

            {/* Error de formulario — validación o falla al guardar */}
            {formError && (
              <div className="mx-4 flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{formError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <SettingsActions
              onDiscard={handleDiscard}
              onSave={handleSave}
              hasChanges={hasChanges}
              isLoading={isLoading}
            />

            <section className="mx-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Sesión actual</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Cerrá la sesión de este dispositivo si terminaste de usar tu cuenta.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </Button>
              </div>
            </section>

            {/* Support Banner */}
            <SupportBanner onContactSupport={handleContactSupport} />
          </div>
        </div>
      </div>
    </div>
  );
}
