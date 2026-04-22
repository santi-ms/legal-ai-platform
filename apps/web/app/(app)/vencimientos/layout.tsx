import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vencimientos | DocuLex",
  robots: { index: false, follow: false },
};

export default function VencimientosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
