import { HelpCircle } from "lucide-react";
import { CONTACT, mailto } from "@/app/lib/site";

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
      className="py-24 px-6 md:px-20 bg-white dark:bg-background-dark"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <HelpCircle className="w-3.5 h-3.5" />
            PREGUNTAS FRECUENTES
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Lo que más nos preguntan
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
            Si no encontrás tu respuesta acá, escribinos.
          </p>
        </div>

        {/* Accordion — <details>/<summary> nativo, accesible y sin JS */}
        <div className="space-y-3">
          {QUESTIONS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden transition-colors open:border-primary/30 open:bg-white dark:open:bg-slate-900"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-base font-semibold text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
                <span>{item.q}</span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <div className="px-6 pb-5 -mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        {/* Contact fallback */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ¿Otra pregunta?{" "}
            <a
              href={mailto(CONTACT.support, "Consulta — DocuLex")}
              className="text-primary hover:underline font-semibold"
            >
              Escribinos a {CONTACT.support}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
