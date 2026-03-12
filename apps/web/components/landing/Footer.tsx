"use client";

import Link from "next/link";
import { Gavel, Mail, Globe, MapPin } from "lucide-react";

const footerLinks = {
  producto: [
    { name: "Funciones", href: "#funciones" },
    { name: "Plantillas", href: "#plantillas" },
    { name: "Precios", href: "#precios" },
    { name: "API", href: "#api" },
  ],
  compañía: [
    { name: "Sobre nosotros", href: "#sobre-nosotros" },
    { name: "Blog", href: "#blog" },
    { name: "Carreras", href: "#carreras" },
    { name: "Contacto", href: "#contacto" },
  ],
  legal: [
    { name: "Privacidad", href: "#privacidad" },
    { name: "Términos", href: "#terminos" },
    { name: "Cookies", href: "#cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 pt-20 pb-10 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
        {/* Brand Column */}
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-primary p-2 rounded-lg">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              LegalTech AR
            </h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">
            La nueva era de la abogacía en Argentina. Eficiencia, seguridad y validez jurídica en un solo lugar.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-600 dark:text-slate-400"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href="#"
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
                <Link
                  href={link.href}
                  className="hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
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
                <Link
                  href={link.href}
                  className="hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
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
                <Link
                  href={link.href}
                  className="hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <p>© 2024 LegalTech AR. Todos los derechos reservados.</p>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>Buenos Aires, Argentina</span>
        </div>
      </div>
    </footer>
  );
}

