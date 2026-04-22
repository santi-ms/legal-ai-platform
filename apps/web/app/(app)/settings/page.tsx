"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { EstudioSection } from "@/components/settings/EstudioSection";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { SettingsActions } from "@/components/settings/SettingsActions";
import { SupportBanner } from "@/components/settings/SupportBanner";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  getUserProfile,
  updateUserProfile,
  getTenantProfile,
  updateTenantProfile,
  type UserProfile,
  type TenantProfile,
} from "@/app/lib/webApi";
import { AlertTriangle, ArrowLeft, Loader2, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  phone: string;
  matricula: string;
  especialidad: string;
  professionalRole: string;
}

interface EstudioFormData {
  name: string;
  cuit: string;
  address: string;
  phone: string;
  website: string;
}

interface NotificationPreferencesData {
  emailNotifications: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  vencimientoAlerts: boolean;
  portalActivityEmails: boolean;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    phone: "",
    matricula: "",
    especialidad: "",
    professionalRole: "",
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferencesData>({
    emailNotifications: true,
    securityAlerts: true,
    productUpdates: false,
    vencimientoAlerts: true,
    portalActivityEmails: true,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<{
    profile: ProfileFormData;
    notifications: NotificationPreferencesData;
  } | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Estudio state ──────────────────────────────────────────────────────────
  const [estudioData, setEstudioData] = useState<EstudioFormData>({
    name: "",
    cuit: "",
    address: "",
    phone: "",
    website: "",
  });
  const [initialEstudio, setInitialEstudio] = useState<EstudioFormData | null>(null);
  const [estudioHasChanges, setEstudioHasChanges] = useState(false);
  const [estudioSaving, setEstudioSaving] = useState(false);
  const [hasNoTenant, setHasNoTenant] = useState(false);
  const [tenantLogoUrl, setTenantLogoUrl] = useState<string | null>(null);

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
        phone: profile.phone || "",
        matricula: profile.matricula || "",
        especialidad: profile.especialidad || "",
        professionalRole: profile.professionalRole || "",
      };

      const initialNotifications: NotificationPreferencesData = {
        emailNotifications:  profile.notificationPreferences.emailNotifications  ?? true,
        securityAlerts:      profile.notificationPreferences.securityAlerts      ?? true,
        productUpdates:      profile.notificationPreferences.productUpdates      ?? false,
        vencimientoAlerts:   profile.notificationPreferences.vencimientoAlerts   ?? true,
        portalActivityEmails: profile.notificationPreferences.portalActivityEmails ?? true,
      };

      setProfileData(initialProfile);
      setNotificationPreferences(initialNotifications);
      setInitialData({ profile: initialProfile, notifications: initialNotifications });

      // Cargar datos del estudio si tiene tenant
      if (profile.tenantId) {
        try {
          const tenant = await getTenantProfile();
          const t: EstudioFormData = {
            name: tenant.name || "",
            cuit: tenant.cuit || "",
            address: tenant.address || "",
            phone: tenant.phone || "",
            website: tenant.website || "",
          };
          setEstudioData(t);
          setInitialEstudio(t);
          setTenantLogoUrl(tenant.logoUrl ?? null);
          setHasNoTenant(false);
        } catch {
          // Tenant no encontrado pero sigue adelante
          setHasNoTenant(false);
        }
      } else {
        setHasNoTenant(true);
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      if (session?.user) {
        const nameParts = session.user.name?.split(" ") || [];
        const fallbackProfile: ProfileFormData = {
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: session.user.email || "",
          bio: "",
          phone: "",
          matricula: "",
          especialidad: "",
          professionalRole: "",
        };
        setProfileData(fallbackProfile);
        setInitialData({
          profile: fallbackProfile,
          notifications: { emailNotifications: true, securityAlerts: true, productUpdates: false, vencimientoAlerts: true, portalActivityEmails: true },
        });
        setLoadError("No pudimos cargar tu perfil completo. Algunos datos pueden estar desactualizados.");
      } else {
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

  // ── Detectar cambios perfil ───────────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      const profileChanged =
        profileData.firstName !== initialData.profile.firstName ||
        profileData.lastName !== initialData.profile.lastName ||
        profileData.email !== initialData.profile.email ||
        profileData.bio !== initialData.profile.bio ||
        profileData.phone !== initialData.profile.phone ||
        profileData.matricula !== initialData.profile.matricula ||
        profileData.especialidad !== initialData.profile.especialidad ||
        profileData.professionalRole !== initialData.profile.professionalRole;

      const notificationsChanged =
        notificationPreferences.emailNotifications   !== initialData.notifications.emailNotifications   ||
        notificationPreferences.securityAlerts       !== initialData.notifications.securityAlerts       ||
        notificationPreferences.productUpdates       !== initialData.notifications.productUpdates       ||
        notificationPreferences.vencimientoAlerts    !== initialData.notifications.vencimientoAlerts    ||
        notificationPreferences.portalActivityEmails !== initialData.notifications.portalActivityEmails;

      setHasChanges(profileChanged || notificationsChanged);
    }
  }, [profileData, notificationPreferences, initialData]);

  // ── Detectar cambios estudio ──────────────────────────────────────────────
  useEffect(() => {
    if (initialEstudio) {
      const changed =
        estudioData.name !== initialEstudio.name ||
        estudioData.cuit !== initialEstudio.cuit ||
        estudioData.address !== initialEstudio.address ||
        estudioData.phone !== initialEstudio.phone ||
        estudioData.website !== initialEstudio.website;
      setEstudioHasChanges(changed);
    }
  }, [estudioData, initialEstudio]);

  // ── Redirección si no autenticado ─────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings");
    }
  }, [authLoading, isAuthenticated, router]);

  // ── Handlers perfil ───────────────────────────────────────────────────────
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
    if (!profileData.firstName.trim()) {
      setFormError("El nombre es requerido.");
      return;
    }
    if (!profileData.email.trim() || !profileData.email.includes("@")) {
      setFormError("El correo electrónico no es válido.");
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
          phone: profileData.phone.trim() || null,
          matricula: profileData.matricula.trim() || null,
          especialidad: profileData.especialidad || null,
          professionalRole: profileData.professionalRole || null,
        },
        notificationPreferences: {
          emailNotifications:  notificationPreferences.emailNotifications,
          securityAlerts:      notificationPreferences.securityAlerts,
          productUpdates:      notificationPreferences.productUpdates,
          vencimientoAlerts:   notificationPreferences.vencimientoAlerts,
          portalActivityEmails: notificationPreferences.portalActivityEmails,
        },
      });

      const updatedProfileData: ProfileFormData = {
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        email: updatedProfile.email,
        bio: updatedProfile.bio,
        phone: updatedProfile.phone || "",
        matricula: updatedProfile.matricula || "",
        especialidad: updatedProfile.especialidad || "",
        professionalRole: updatedProfile.professionalRole || "",
      };
      const updatedNotifications: NotificationPreferencesData = {
        emailNotifications:  updatedProfile.notificationPreferences.emailNotifications  ?? true,
        securityAlerts:      updatedProfile.notificationPreferences.securityAlerts      ?? true,
        productUpdates:      updatedProfile.notificationPreferences.productUpdates      ?? false,
        vencimientoAlerts:   updatedProfile.notificationPreferences.vencimientoAlerts   ?? true,
        portalActivityEmails: updatedProfile.notificationPreferences.portalActivityEmails ?? true,
      };

      setProfileData(updatedProfileData);
      setNotificationPreferences(updatedNotifications);
      setInitialData({ profile: updatedProfileData, notifications: updatedNotifications });
      setHasChanges(false);
      success("Perfil guardado exitosamente");

      if (session) router.refresh();
    } catch (err: any) {
      setFormError(err.message || "No pudimos guardar la configuración. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handlers estudio ──────────────────────────────────────────────────────
  const handleEstudioFieldChange = (field: keyof EstudioFormData, value: string) => {
    setEstudioData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEstudioSave = async () => {
    if (!estudioData.name.trim()) {
      showError("El nombre del estudio es requerido.");
      return;
    }
    setEstudioSaving(true);
    try {
      const updated = await updateTenantProfile({
        name: estudioData.name.trim(),
        cuit: estudioData.cuit.trim() || undefined,
        address: estudioData.address.trim() || undefined,
        phone: estudioData.phone.trim() || undefined,
        website: estudioData.website.trim() || undefined,
      });
      const t: EstudioFormData = {
        name: updated.name || "",
        cuit: updated.cuit || "",
        address: updated.address || "",
        phone: updated.phone || "",
        website: updated.website || "",
      };
      setEstudioData(t);
      setInitialEstudio(t);
      setEstudioHasChanges(false);
      success("Datos del estudio guardados");
    } catch (err: any) {
      showError(err.message || "No pudimos guardar los datos del estudio.");
    } finally {
      setEstudioSaving(false);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Soporte - Consulta sobre mi cuenta");
    const body = encodeURIComponent("Hola, necesito ayuda con mi cuenta.");
    window.location.href = `mailto:soporte@doculex.ar?subject=${subject}&body=${body}`;
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-parchment dark:bg-ink font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center pb-10">
          <div className="flex flex-col max-w-[1040px] w-full">
            <SettingsHeader />

            {/* Tabs editoriales */}
            <div className="mt-2">
              <SettingsTabs activeTab="profile" />
            </div>

            {/* Error de carga */}
            {loadError && (
              <div className="mx-4 mt-4 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{loadError}</p>
                  <button
                    onClick={loadProfile}
                    className="mt-1 text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* ── Perfil personal ─────────────────────────────────────── */}
            <ProfileSection
              formData={profileData}
              onFieldChange={handleProfileFieldChange}
            />

            {/* ── Datos del estudio ────────────────────────────────────── */}
            <EstudioSection
              formData={estudioData}
              onFieldChange={handleEstudioFieldChange}
              onSave={handleEstudioSave}
              isSaving={estudioSaving}
              hasChanges={estudioHasChanges}
              hasNoTenant={hasNoTenant}
              logoUrl={tenantLogoUrl}
              onLogoChange={setTenantLogoUrl}
            />

            {/* ── Apariencia ───────────────────────────────────────────── */}
            <AppearanceSection />

            {/* ── Notificaciones ───────────────────────────────────────── */}
            <NotificationPreferences
              preferences={notificationPreferences}
              onPreferenceChange={handlePreferenceChange}
            />

            {/* Error de formulario */}
            {formError && (
              <div className="mx-4 flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{formError}</p>
              </div>
            )}

            {/* Botones guardar perfil */}
            <SettingsActions
              onDiscard={handleDiscard}
              onSave={handleSave}
              hasChanges={hasChanges}
              isLoading={isLoading}
            />

            {/* Sesión */}
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

            <SupportBanner onContactSupport={handleContactSupport} />
          </div>
        </div>
      </div>
    </div>
  );
}
