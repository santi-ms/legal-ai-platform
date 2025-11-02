"use client";

import Link from "next/link";
import {
  FileText,
  Scale,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 px-4">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-emerald-600/20 blur-[120px] opacity-20 -z-10"></div>
        
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Generación Legal con{" "}
                  <span className="text-emerald-500">IA</span>
                </h1>
                <p className="text-xl text-neutral-300 leading-relaxed">
                  Contratos, NDAs y cartas documento listos para firmar en minutos. 
                  Cumple normativa argentina con la potencia de GPT-5.
                </p>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Cumple normativa AR</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>SSL + GDPR</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>24/7 Disponible</span>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-200"
                >
                  Iniciar Sesión
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Registrarse Gratis
                </Link>
              </div>
            </div>

            {/* Right content - Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-emerald-500 mb-2">500+</div>
                <div className="text-sm text-neutral-400">Documentos generados</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-emerald-500 mb-2">95%</div>
                <div className="text-sm text-neutral-400">Tiempo ahorrado</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-emerald-500 mb-2">24</div>
                <div className="text-sm text-neutral-400">Jurisdicciones</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-emerald-500 mb-2">GPT-5</div>
                <div className="text-sm text-neutral-400">IA más avanzada</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Todo lo que necesitas para tu práctica legal
            </h2>
            <p className="text-xl text-neutral-400">
              Herramientas profesionales diseñadas específicamente para el mercado argentino
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Contratos Inteligentes",
                description: "Genera contratos de servicios, NDAs y acuerdos comerciales con cláusulas específicas por jurisdicción."
              },
              {
                icon: Scale,
                title: "Cumplimiento Legal",
                description: "Todos los documentos cumplen con la normativa argentina vigente y están listos para firmar."
              },
              {
                icon: Zap,
                title: "Velocidad Extrema",
                description: "De idea a documento firmado en menos de 5 minutos. Sin esperas, sin demoras."
              },
              {
                icon: Shield,
                title: "Seguridad Total",
                description: "Tus datos están protegidos con encriptación de grado militar y cumplimiento GDPR."
              },
              {
                icon: Clock,
                title: "Disponible 24/7",
                description: "Genera documentos cuando los necesites, sin horarios ni limitaciones."
              },
              {
                icon: CheckCircle2,
                title: "Calidad Garantizada",
                description: "Revisión automática por IA especializada en derecho argentino."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-200">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-emerald-600/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl p-12">
            <h2 className="text-4xl font-bold mb-6">
              ¿Listo para revolucionar tu práctica legal?
            </h2>
            <p className="text-xl text-neutral-300 mb-8">
              Únete a cientos de profesionales que ya confían en Legal AI Platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/documents/new"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-200"
              >
                Crear mi primer documento
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/documents"
                className="inline-flex items-center justify-center px-8 py-4 bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white font-semibold rounded-lg transition-all duration-200"
              >
                Ver ejemplos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-neutral-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-500" />
                <span className="text-xl font-bold">Legal AI Platform</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Generación automática de documentos legales con IA para el mercado argentino.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/documents/new" className="hover:text-white transition-colors">Crear Documento</Link></li>
                <li><Link href="/documents" className="hover:text-white transition-colors">Mis Documentos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Precios</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-white transition-colors">Términos de Uso</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cumplimiento</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-white transition-colors">Centro de Ayuda</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Estado del Sistema</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-neutral-500">
              © 2024 Legal AI Platform. Todos los derechos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded-full">
                v0.1 · GPT-5
              </span>
              <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded-full">
                Cumple normativa AR
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}