import type { Metadata } from "next";
import InactivityLogout from "@/app/components/InactivityLogout";
import { AppShell } from "@/components/dashboard/AppShell";

export const metadata: Metadata = {
  title: "Admin | DocuLex",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <InactivityLogout />
      {children}
    </AppShell>
  );
}
