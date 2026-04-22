import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Importar datos | DocuLex",
  robots: { index: false, follow: false },
};

export default function ImportarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
