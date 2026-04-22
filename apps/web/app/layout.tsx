import "./globals.css";
import "./starfield.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { SessionProvider } from "@/components/ui/session-provider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SITE, CONTACT, absoluteUrl } from "@/app/lib/site";

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: absoluteUrl("/favicon.svg"),
  description:
    "Plataforma SaaS para la generación automática de documentos legales con IA, orientada a abogados, estudios jurídicos y pymes en Argentina.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "AR",
    addressLocality: SITE.city,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: CONTACT.support,
    areaServed: "AR",
    availableLanguage: ["Spanish"],
  },
  sameAs: [],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE.name,
  applicationCategory: "LegalApplication",
  operatingSystem: "Web",
  description:
    "Generá contratos, NDAs, cartas documento y documentos legales con IA en minutos. Para abogados y estudios jurídicos en Argentina.",
  url: SITE.url,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "ARS",
    description:
      "Plan gratuito disponible. Planes pagos desde $24.999 ARS/mes.",
  },
  featureList: [
    "Generación de contratos con IA",
    "Cartas documento",
    "Acuerdos de confidencialidad (NDA)",
    "Contratos de locación",
    "Gestión de expedientes",
    "Chat con IA legal",
    "Análisis de riesgos contractuales",
  ],
  inLanguage: "es-AR",
};

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — Documentos Legales con IA`,
    template: `%s | ${SITE.name}`,
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
    SITE.name,
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  applicationName: SITE.name,
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(SITE.url),
  openGraph: {
    type: "website",
    locale: SITE.locale,
    title: `${SITE.name} — Documentos Legales con IA`,
    description:
      "Generá contratos, poderes y escrituras con validez jurídica en Argentina usando Inteligencia Artificial.",
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Documentos Legales con IA`,
    description:
      "Generá contratos, poderes y escrituras con validez jurídica en Argentina usando Inteligencia Artificial.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE.url,
  },
};

// Tipografía UI — Inter para todo (sans moderna)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`h-full ${inter.variable}`} suppressHydrationWarning>
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
      <body className="font-sans h-full antialiased">
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
