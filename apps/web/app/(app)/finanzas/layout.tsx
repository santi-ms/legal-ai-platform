import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finanzas | DocuLex",
  robots: { index: false, follow: false },
};

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
