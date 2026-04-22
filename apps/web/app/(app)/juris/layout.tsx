import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doku Juris | DocuLex",
  robots: { index: false, follow: false },
};

export default function JurisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
