import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Zap,
  Shield,
  Clock,
  Users,
  Briefcase,
  MessageSquare,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Software Legal para Abogados en Argentina | DocuLex",
  description:
    "DocuLex es el software de gestión legal con IA para abogados y estudios jurídicos en Argentina. Generá contratos, gestioná expedientes y clientes. Probá gratis.",
  keywords: [
    "software legal para abogados",
    "programa para abogados Argentina",
    "gestión de expedientes legales",
    "generador de contratos abogados",
    "estudio jurídico software",
    "automatización legal Argentina",
    "legal tech abogados",
    "sistema de gestión jurídica",
    "contratos online abogados",
    "DocuLex abogados",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://doculex.com.ar/para-abogados",
    title: "Software Legal para Abogados en Argentina | DocuLex",
    description:
      "La plataforma de legal tech para abogados y estudios jurídicos en Argentina. Generá contratos, gestioná expedientes y clientes con IA.",
    siteName: "DocuLex",
  },
  alternates: {
    canonical: "https://doculex.com.ar/para-abogados",
  },
};

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "DocuLex para Abogados",
  description:
    "Software legal con IA para abogados y estudios jurídicos en Argentina. Generación automática de contratos, gestión de expedientes y clientes.",
  url: "https://doculex.com.ar/para-abogados",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://doculex.com.ar" },
      { "@type": "ListItem", position: 2, name: "Para Abogados", item: "https://doculex.com.ar/para-abogados" },
    ],
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: Zap,
    title: "Generá contratos en minutos",
    description:
      "Describí el documento que necesitás y la IA lo genera automáticamente. Contratos de locación, prestación de servicios, NDAs, cartas documento y más.",
  },
  {
    icon: Briefcase,
    title: "Gestión de expedientes",
    description:
      "Organizá tus casos con expedientes digitales. Asociá documentos, clientes y plazos. Recibí alertas por email antes de que venzan los plazos procesales.",
  },
  {
    icon: Users,
    title: "Base de clientes centralizada",
    description:
      "Gestioná personas físicas y jurídicas con toda su información en un solo lugar. Historial de documentos y expedientes por cliente.",
  },
  {
    icon: Shield,
    title: "Normativa argentina actualizada",
    description:
      "Todos los documentos se generan respetando el Código Civil y Comercial y leyes especiales vigentes. Sin necesidad de verificar cada cláusula.",
  },
  {
    icon: MessageSquare,
    title: "Chat con IA legal",
    description:
      "Consultá dudas sobre cláusulas, pedí modificaciones o generá nuevas versiones del documento conversando en lenguaje natural.",
  },
  {
    icon: Clock,
    title: "Ahorrá horas de trabajo",
    description:
      "Lo que antes tomaba horas ahora se resuelve en minutos. Más tiempo para asesorar a tus clientes, menos tiempo en redacción repetitiva.",
  },
];

const DOCUMENT_TYPES = [
  "Contratos de locación (alquiler)",
  "Contratos de prestación de servicios",
  "Acuerdos de confidencialidad (NDA)",
  "Cartas documento",
  "Contratos de trabajo",
  "Poderes notariales",
  "Contratos de compraventa",
  "Acuerdos de socios",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ParaAbogadosPage() {
  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden min-h-screen font-display">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-28 pb-20 px-6 md:px-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20 mb-6">
            <Star className="w-3.5 h-3.5" />
            Legal Tech para profesionales del derecho
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter mb-6">
            El software legal que{" "}
            <span className="text-primary">abogados argentinos</span>{" "}
            estaban esperando
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Generá contratos con IA, gestioná expedientes con plazos y alertas, y
            organizá tu cartera de clientes, todo desde una sola plataforma pensada
            para la práctica legal en Argentina.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold text-lg h-14 px-8 rounded-xl hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              Empezar gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-lg h-14 px-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Ver todas las funciones
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Sin tarjeta de crédito · Plan gratuito disponible
          </p>
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section className="py-20 px-6 md:px-20 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Todo lo que un estudio jurídico necesita
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Desde la generación del primer documento hasta el seguimiento del expediente
              y la gestión del cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tipos de documentos ── */}
      <section className="py-20 px-6 md:px-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Generá cualquier contrato o documento legal
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              Más de 8 tipos de documentos legales adaptados a la normativa argentina,
              con cláusulas generadas por IA y revisables antes de descargar.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Crear mi cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {DOCUMENT_TYPES.map((doc) => (
              <div
                key={doc}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {doc}
                </span>
                <div className="ml-auto">
                  <FileText className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-20 px-6 md:px-20 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
            Empezá a usar DocuLex hoy
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Plan gratuito para que lo pruebes sin compromiso. Para estudios jurídicos,
            planes desde USD 29/mes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold text-lg h-14 px-8 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:ventas@doculex.ar?subject=Consulta%20sobre%20DocuLex%20para%20mi%20estudio"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 font-semibold text-lg h-14 px-8 rounded-xl hover:bg-white/20 transition-colors"
            >
              Hablar con ventas
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
