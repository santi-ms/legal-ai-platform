import { HelpCircle, ChevronDown } from "lucide-react";
import { CONTACT, mailto } from "@/app/lib/site";
import { Reveal, RevealStagger, StaggerItem } from "./motion";

// Mismo contenido que el JSON-LD de page.tsx para que Google detecte
// correspondencia entre structured data y contenido visible.
const QUESTIONS = [
  {
    q: "¿Qué tipos de documentos legales puedo generar con DocuLex?",
    a: "Podés generar contratos de locación (alquiler), contratos de prestación de servicios, acuerdos de confidencialidad (NDA), cartas documento, poderes notariales, contratos de trabajo y más. Todos adaptados a la normativa argentina vigente.",
  },
  {
    q: "¿Los documentos generados tienen validez legal en Argentina?",
    a: "Sí. Los documentos se generan respetando el Código Civil y Comercial y las leyes especiales vigentes en Argentina. Igualmente, recomendamos que un abogado revise los documentos antes de firmarlos.",
  },
  {
    q: "¿Cuánto tarda en generarse un documento legal?",
    a: "La generación de un documento completo tarda entre 30 segundos y 2 minutos, dependiendo de la complejidad. Podés generarlo mediante chat con IA o completando un formulario guiado.",
  },
  {
    q: "¿Necesito ser abogado para usar DocuLex?",
    a: "No. DocuLex está diseñado tanto para abogados y estudios jurídicos como para pymes y emprendedores que necesitan contratos y documentos legales sin tener conocimientos jurídicos previos.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Toda la información está encriptada en tránsito (TLS) y en reposo. Los documentos que subís a DocuLex no se usan para entrenar modelos de IA. Operamos bajo la Ley 25.326 de Protección de Datos Personales de Argentina.",
  },
  {
    q: "¿Tiene algún costo usar DocuLex?",
    a: "DocuLex tiene un plan gratuito para explorar la plataforma (5 documentos/mes). Los planes pagos arrancan desde $24.999/mes para abogados independientes y tenemos un plan Estudio para equipos jurídicos.",
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      className="relative py-28 px-6 md:px-20 bg-white dark:bg-background-dark"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header editorial */}
        <Reveal className="text-center mb-16 max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 text-gold-600 dark:text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <HelpCircle className="w-3.5 h-3.5" />
            Preguntas frecuentes
          </div>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.05]">
            Lo que más{" "}
            <span className="text-primary">nos preguntan</span>
            .
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
            Si no encontrás tu respuesta acá, escribinos.
          </p>
        </Reveal>

        {/* Accordion como lista editorial — separadores inferiores en vez de cards */}
        <RevealStagger className="border-t border-slate-200 dark:border-slate-800" stagger={0.05}>
          {QUESTIONS.map((item) => (
            <StaggerItem key={item.q}>
              <details className="group border-b border-slate-200 dark:border-slate-800 transition-colors">
                <summary className="flex items-start justify-between gap-6 cursor-pointer list-none py-6 md:py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
                  <span className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white leading-snug text-pretty pr-4 group-hover:text-primary transition-colors">
                    {item.q}
                  </span>
                  <span
                    className="flex-shrink-0 w-9 h-9 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-open:border-primary group-open:text-primary group-open:bg-primary/5 transition-all"
                    aria-hidden="true"
                  >
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180" />
                  </span>
                </summary>
                <div className="pb-6 md:pb-7 pr-12 text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed text-pretty -mt-1">
                  {item.a}
                </div>
              </details>
            </StaggerItem>
          ))}
        </RevealStagger>

        {/* Contact fallback */}
        <Reveal delay={0.2} className="mt-16 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿Otra pregunta?{" "}
            <a
              href={mailto(CONTACT.support, "Consulta — DocuLex")}
              className="text-primary hover:underline font-semibold"
            >
              Escribinos a {CONTACT.support}
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
