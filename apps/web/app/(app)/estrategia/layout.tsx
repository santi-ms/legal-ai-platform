import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doku Estratega | DocuLex",
  robots: { index: false, follow: false },
};

export default function EstrategiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
