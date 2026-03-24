import "./globals.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SessionProvider } from "@/components/ui/session-provider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata = {
  title: {
    default: "DocuLex — Documentos Legales con IA",
    template: "%s | DocuLex",
  },
  description:
    "Generá contratos, poderes y escrituras con validez jurídica en Argentina usando Inteligencia Artificial. Rápido, seguro y preciso.",
  keywords: [
    "documentos legales", "contratos con IA", "abogados Argentina",
    "estudio jurídico", "generador de contratos", "DocuLex",
  ],
  authors: [{ name: "DocuLex" }],
  creator: "DocuLex",
  applicationName: "DocuLex",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://legaltech-ar.vercel.app"
  ),
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: "DocuLex — Documentos Legales con IA",
    description:
      "Generá contratos, poderes y escrituras con validez jurídica en Argentina usando Inteligencia Artificial.",
    siteName: "DocuLex",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocuLex — Documentos Legales con IA",
    description:
      "Generá contratos, poderes y escrituras con validez jurídica en Argentina usando Inteligencia Artificial.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Tipografía moderna y seria
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <style>{`
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              <ErrorBoundary>
                <main className="min-h-screen">
                  {children}
                </main>
              </ErrorBoundary>
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
