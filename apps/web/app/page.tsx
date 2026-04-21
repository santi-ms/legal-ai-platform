import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { SITE, absoluteUrl } from "@/app/lib/site";

// ─── FAQ Schema (rich results en Google) ─────────────────────────────────────
// Las mismas preguntas se renderizan visibles en <FAQ /> para que el contenido
// exista en el DOM y Google no lo considere solo structured data huérfano.

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
        text: "Sí. Toda la información está encriptada en tránsito (TLS) y en reposo. Los documentos que subís a DocuLex no se usan para entrenar modelos de IA. Operamos bajo la Ley 25.326 de Protección de Datos Personales de Argentina.",
      },
    },
    {
      "@type": "Question",
      name: "¿Tiene algún costo usar DocuLex?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "DocuLex tiene un plan gratuito para explorar la plataforma (5 documentos/mes). Los planes pagos arrancan desde $24.999/mes para abogados independientes y tenemos un plan Estudio para equipos jurídicos.",
      },
    },
  ],
};

// ─── Home-specific metadata (overrides root default) ─────────────────────────

const pageTitle = "Generá Documentos Legales con IA | DocuLex";
const pageDesc =
  "Creá contratos, NDAs, cartas documento y escrituras con validez jurídica en Argentina usando IA. Para abogados, estudios jurídicos y pymes. Empezá gratis.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDesc,
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
    locale: SITE.locale,
    url: absoluteUrl("/"),
    title: pageTitle,
    description: pageDesc,
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDesc,
  },
  alternates: {
    canonical: absoluteUrl("/"),
  },
};

// Server Component — renderiza el shell estático completo. Solo los bits
// interactivos (Navbar mobile menu, Hero demo modal, FAQ accordion,
// ContactForm) se cargan como Client Components anidados.
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
