import type { Metadata } from "next";
import InactivityLogout from "@/app/components/InactivityLogout";
import { AppShell } from "@/components/dashboard/AppShell";

/**
 * Layout compartido para todos los módulos autenticados.
 *
 * Envuelve AppShell (sidebar + header + modales globales) a nivel de
 * route group, de modo que navegar entre módulos (ej. /analysis → /documents)
 * NO remonte la shell. Sin esto, cada layout hermano crea su propia instancia
 * de sidebar y se percibe como un "reload" al cambiar de sección.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <InactivityLogout />
      {children}
    </AppShell>
  );
}
