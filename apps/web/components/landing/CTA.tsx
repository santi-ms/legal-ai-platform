import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CONTACT, mailto } from "@/app/lib/site";

export function CTA() {
  return (
    <section className="py-24 px-6 md:px-20 overflow-hidden">
      <div className="max-w-5xl mx-auto relative">
        <div
          className="absolute inset-0 bg-primary rounded-[40px] rotate-1"
          aria-hidden="true"
        />
        <div className="relative bg-background-dark text-white p-12 md:p-20 rounded-[40px] text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-black">
            ¿Listo para transformar tu práctica legal?
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Generá tu primer documento legal con IA en menos de 5 minutos. Sin
            formularios complicados, sin letra chica.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-primary text-white text-lg font-bold h-14 px-10 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark"
              >
                Crear cuenta gratis
              </Button>
            </Link>
            <a
              href={mailto(
                CONTACT.support,
                "Consulta — DocuLex",
                "Hola, me gustaría obtener más información sobre DocuLex."
              )}
              className="inline-flex items-center justify-center bg-transparent border-2 border-white/30 text-white text-lg font-bold h-14 px-10 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark"
            >
              Contactar al equipo
            </a>
          </div>

          <p className="text-xs text-slate-400">
            Sin tarjeta de crédito · Cancelá cuando quieras
          </p>
        </div>
      </div>
    </section>
  );
}
