import type { Metadata } from "next";
import InactivityLogout from "@/app/components/InactivityLogout";
import { AppShell } from "@/components/dashboard/AppShell";

export const metadata: Metadata = {
  title: "Vencimientos | DocuLex",
  robots: { index: false, follow: false },
};

export default function VencimientosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <InactivityLogout />
      {children}
    </AppShell>
  );
}
