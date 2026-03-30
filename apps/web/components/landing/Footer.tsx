"use client";

import Link from "next/link";
import { Mail, Globe, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

// Helper para crear mailto links con encoding correcto
const createMailtoLink = (subject: string) => {
  const encodedSubject = encodeURIComponent(subject);
  return `mailto:soporte@legaltech.ar?subject=${encodedSubject}`;
};

const footerLinks = {
  producto: [
    { name: "Funciones", href: "#funciones", isAnchor: true }, // Existe en Features
    { name: "Plantillas", href: createMailtoLink("Consulta sobre Plantillas"), isAnchor: false },
    { name: "Precios", href: createMailtoLink("Consulta sobre Precios"), isAnchor: false },
    { name: "API", href: createMailtoLink("Consulta sobre API"), isAnchor: false },
  ],
  compañía: [
    { name: "Sobre nosotros", href: createMailtoLink("Consulta sobre la empresa"), isAnchor: false },
    { name: "Blog", href: createMailtoLink("Consulta sobre Blog"), isAnchor: false },
    { name: "Carreras", href: createMailtoLink("Consulta sobre Carreras"), isAnchor: false },
    { name: "Contacto", href: createMailtoLink("Contacto"), isAnchor: false },
  ],
  legal: [
    { name: "Privacidad", href: createMailtoLink("Consulta sobre Privacidad"), isAnchor: false },
    { name: "Términos", href: createMailtoLink("Consulta sobre Términos"), isAnchor: false },
    { name: "Cookies", href: createMailtoLink("Consulta sobre Cookies"), isAnchor: false },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 pt-20 pb-10 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
        {/* Brand Column */}
        <div className="col-span-2">
          <div className="mb-6">
            <BrandLogo size={150} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">
            La nueva era de la abogacía en Argentina. Eficiencia, seguridad y validez jurídica en un solo lugar.
          </p>
          <div className="flex gap-4">
            <a
              href="mailto:soporte@legaltech.ar"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-600 dark:text-slate-400"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="https://legaltech.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-600 dark:text-slate-400"
              aria-label="Website"
            >
              <Globe className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Producto */}
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">Producto</h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            {footerLinks.producto.map((link) => (
              <li key={link.name}>
                {link.isAnchor ? (
                  <Link
                    href={link.href}
                    className="hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.querySelector(link.href);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Compañía */}
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">Compañía</h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            {footerLinks.compañía.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">Legal</h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            {footerLinks.legal.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <p>© 2024 DocuLex. Todos los derechos reservados.</p>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>Buenos Aires, Argentina</span>
        </div>
      </div>
    </footer>
  );
}

