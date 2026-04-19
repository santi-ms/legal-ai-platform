import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

// ─── FAQ Schema (rich results en Google) ─────────────────────────────────────

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Qué tipos de documentos legales puedo generar con DocuLex?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Podés generar contratos de locación (alquiler), contratos de prestación de servicios, acuerdos de confidencialidad (NDA), cartas documento, poderes notariales, contratos de trabajo y más. Todos adaptados a la normativa argentina vigente.",
      },
    },
    {
      "@type": "Question",
      name: "¿Los documentos generados tienen validez legal en Argentina?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Los documentos se generan respetando el Código Civil y Comercial y las leyes especiales vigentes en Argentina. Igualmente, recomendamos que un abogado revise los documentos antes de firmarlos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto tarda en generarse un documento legal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La generación de un documento completo tarda entre 30 segundos y 2 minutos, dependiendo de la complejidad. Podés generarlo mediante chat con IA o completando un formulario guiado.",
      },
    },
    {
      "@type": "Question",
      name: "¿Necesito ser abogado para usar DocuLex?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. DocuLex está diseñado tanto para abogados y estudios jurídicos como para pymes y emprendedores que necesitan contratos y documentos legales sin tener conocimientos jurídicos previos.",
      },
    },
    {
      "@type": "Question",
      name: "¿Mis datos están seguros?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. Toda la información está encriptada y almacenada de forma segura. No compartimos ni usamos tus datos para entrenar modelos de inteligencia artificial.",
      },
    },
    {
      "@type": "Question",
      name: "¿Tiene algún costo usar DocuLex?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DocuLex tiene un plan gratuito para explorar la plataforma. Para uso profesional ilimitado, los planes de pago arrancan desde USD 29/mes para abogados independientes y USD 89/mes para estudios jurídicos.",
      },
    },
  ],
};

// ─── Home-specific metadata (overrides root default) ─────────────────────────

export const metadata: Metadata = {
  title: "Generá Documentos Legales con IA | DocuLex",
  description:
    "Creá contratos, NDAs, cartas documento y escrituras con validez jurídica en Argentina usando IA. Para abogados, estudios jurídicos y pymes. Empezá gratis.",
  keywords: [
    "generador de contratos Argentina",
    "documentos legales con IA",
    "software legal para abogados",
    "contrato de confidencialidad NDA",
    "carta documento online",
    "plantillas legales Argentina",
    "automatización legal",
    "legal tech Argentina",
    "estudio jurídico software",
    "contratos online Argentina",
    "DocuLex",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://doculex.com.ar",
    title: "Generá Documentos Legales con IA | DocuLex",
    description:
      "Creá contratos, NDAs, cartas documento y más en minutos. Plataforma legal SaaS para abogados y estudios jurídicos en Argentina.",
    siteName: "DocuLex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Generá Documentos Legales con IA | DocuLex",
    description:
      "Creá contratos, NDAs, cartas documento y más en minutos. Para abogados, estudios y pymes en Argentina.",
  },
  alternates: {
    canonical: "https://doculex.com.ar",
  },
};

// Server Component — puede renderizar Client Components hijos sin problema.
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPage />
    </>
  );
}
