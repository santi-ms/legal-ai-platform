"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { SettingsActions } from "@/components/settings/SettingsActions";
import { SupportBanner } from "@/components/settings/SupportBanner";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/app/lib/webApi";

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

  // Load profile data from API
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const loadProfile = async () => {
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
          showError(err.message || "Error al cargar el perfil");
          
          // Fallback to session data if API fails
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
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadProfile();
    }
  }, [isAuthenticated, authLoading, session, showError]);

  // Check for changes
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleProfileFieldChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePreferenceChange = (key: keyof NotificationPreferencesData, value: boolean) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDiscard = () => {
    if (initialData) {
      setProfileData(initialData.profile);
      setNotificationPreferences(initialData.notifications);
      setHasChanges(false);
      success("Cambios descartados");
    }
  };

  const handleSave = async () => {
    // Validation
    if (!profileData.firstName.trim()) {
      showError("El nombre es requerido");
      return;
    }
    if (!profileData.email.trim() || !profileData.email.includes("@")) {
      showError("El email es inválido");
      return;
    }

    setIsLoading(true);
    try {
      // Combine firstName and lastName into name
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

      // Update state with response
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

      // Refresh session to update user name/email in NextAuth
      if (session) {
        await fetch("/api/auth/session?update", { method: "GET" });
        window.location.reload(); // Force refresh to update session
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      const errorMessage = err.message || "Error al guardar la configuración";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    // TODO: Implement support contact
    window.open("mailto:support@legaltech.ar", "_blank");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // El useEffect maneja la redirección
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
            <SettingsTabs activeTab="profile" />

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

            {/* Action Buttons */}
            <SettingsActions
              onDiscard={handleDiscard}
              onSave={handleSave}
              hasChanges={hasChanges}
              isLoading={isLoading}
            />

            {/* Support Banner */}
            <SupportBanner onContactSupport={handleContactSupport} />
          </div>
        </div>
      </div>
    </div>
  );
}

