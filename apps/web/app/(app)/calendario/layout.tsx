import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendario de Vencimientos | DocuLex",
  robots: { index: false, follow: false },
};

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
