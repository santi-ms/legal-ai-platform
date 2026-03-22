import { AppShell } from "@/components/dashboard/AppShell";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
