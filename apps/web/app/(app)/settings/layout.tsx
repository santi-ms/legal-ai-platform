"use client";

import { ReactNode } from "react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { SupportBanner } from "@/components/settings/SupportBanner";

/**
 * Shell compartido para /settings y todas sus sub-páginas.
 * Next.js preserva este layout al navegar entre pestañas, así no hay
 * "flash" al cambiar de /settings a /settings/security, etc.
 *
 * Las páginas hijas solo renderizan su contenido interno.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-auto min-h-[100dvh] w-full flex-col overflow-x-hidden bg-parchment dark:bg-ink font-display text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center pb-16">
          <div className="flex flex-col max-w-[1040px] w-full px-4 sm:px-6 lg:px-10">
            <SettingsHeader />

            <div className="mt-2">
              <SettingsTabs />
            </div>

            {children}

            <div className="mt-10">
              <SupportBanner />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
