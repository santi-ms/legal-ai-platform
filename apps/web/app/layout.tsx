import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SessionProvider } from "@/components/ui/session-provider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DocuLex",
  url: "https://doculex.com.ar",
  logo: "https://doculex.com.ar/favicon.ico",
  description:
    "Plataforma SaaS para la generación automática de documentos legales con IA, orientada a abogados, estudios jurídicos y pymes en Argentina.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "AR",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "soporte@doculex.ar",
  },
  sameAs: [],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DocuLex",
  applicationCategory: "LegalApplication",
  operatingSystem: "Web",
  description:
    "Generá contratos, NDAs, cartas documento y documentos legales con IA en minutos. Para abogados y estudios jurídicos en Argentina.",
  url: "https://doculex.com.ar",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Plan gratuito disponible. Planes Pro y Estudio desde USD 29/mes.",
  },
  featureList: [
    "Generación de contratos con IA",
    "Cartas documento",
    "Acuerdos de confidencialidad (NDA)",
    "Contratos de locación",
    "Gestión de expedientes",
    "Chat con IA legal",
  ],
  inLanguage: "es-AR",
};

export const metadata: Metadata = {
  title: {
    default: "DocuLex — Documentos Legales con IA",
    template: "%s | DocuLex",
  },
  description:
    "Generá contratos, poderes y escrituras con validez jurídica en Argentina usando Inteligencia Artificial. Rápido, seguro y preciso.",
  keywords: [
    "documentos legales Argentina",
    "generador de contratos online",
    "contratos con inteligencia artificial",
    "software legal para abogados",
    "estudio jurídico digital",
    "carta documento online",
    "contrato de confidencialidad NDA",
    "legal tech Argentina",
    "automatización legal",
    "plantillas legales",
    "DocuLex",
  ],
  authors: [{ name: "DocuLex" }],
  creator: "DocuLex",
  applicationName: "DocuLex",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://doculex.com.ar"
  ),
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: "DocuLex — Documentos Legales con IA",
    description:
      "Generá contratos, poderes y escrituras con validez jurídica en Argentina usando Inteligencia Artificial.",
    siteName: "DocuLex",
    url: "https://doculex.com.ar",
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
  alternates: {
    canonical: "https://doculex.com.ar",
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
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
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
