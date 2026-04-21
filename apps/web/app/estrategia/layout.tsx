import type { Metadata } from "next";
import InactivityLogout from "@/app/components/InactivityLogout";
import { AppShell } from "@/components/dashboard/AppShell";

export const metadata: Metadata = {
  title: "Doku Estratega | DocuLex",
  robots: { index: false, follow: false },
};

export default function EstrategiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <InactivityLogout />
      {children}
    </AppShell>
  );
}
