import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { UseCases } from "@/components/landing/UseCases";
import { Comparison } from "@/components/landing/Comparison";
import { Security } from "@/components/landing/Security";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { ContactForm } from "@/components/landing/ContactForm";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

/**
 * Shell de la landing — Server Component. Solo los componentes con
 * interactividad (Navbar, Hero modal, ContactForm) se hidratan como
 * Client Components anidados; el resto llega como HTML puro.
 *
 * Orden intencional:
 * 1. Hero            — promesa + CTAs
 * 2. HowItWorks      — cómo funciona en 3 pasos
 * 3. Features        — los 3 asistentes IA
 * 4. UseCases        — para quién es, segmentado
 * 5. Comparison      — ahorro de tiempo vs. hacerlo a mano
 * 6. Security        — confidencialidad y cumplimiento (clave para legal)
 * 7. Pricing         — planes
 * 8. FAQ             — preguntas frecuentes (visibles + JSON-LD)
 * 9. ContactForm     — captura de leads del plan Estudio
 * 10. CTA            — cierre
 * 11. Footer
 */
export function LandingPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 overflow-x-hidden min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <UseCases />
      <Comparison />
      <Security />
      <Pricing />
      <FAQ />
      <ContactForm />
      <CTA />
      <Footer />
    </div>
  );
}
