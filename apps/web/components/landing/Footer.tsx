import Link from "next/link";
import { Mail, Globe, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CONTACT, SITE, mailto } from "@/app/lib/site";

const footerLinks = {
  producto: [
    { name: "Funciones", href: "#funciones" },
    { name: "Precios", href: "#precios" },
    { name: "Seguridad", href: "#seguridad" },
    { name: "Preguntas frecuentes", href: "#faq" },
  ],
  compañía: [
    { name: "Contacto", href: mailto(CONTACT.support, "Contacto — DocuLex") },
    { name: "Ventas / Estudios", href: "#contacto" },
  ],
  legal: [
    { name: "Privacidad", href: "/privacidad" },
    { name: "Términos", href: "/terminos" },
    { name: "Cookies", href: "/privacidad#cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 pt-20 pb-10 px-6 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
        {/* Brand Column */}
        <div className="col-span-2">
          <div className="mb-6">
            <BrandLogo size={60} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">
            La nueva era de la abogacía en Argentina. Eficiencia, seguridad y
            validez jurídica en un solo lugar.
          </p>
          <div className="flex gap-4">
            <a
              href={`mailto:${CONTACT.support}`}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-600 dark:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label={`Email — ${CONTACT.support}`}
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href={SITE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-slate-600 dark:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Sitio web"
            >
              <Globe className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Producto */}
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">
            Producto
          </h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            {footerLinks.producto.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary rounded-sm"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Compañía */}
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">
            Compañía
          </h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            {footerLinks.compañía.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary rounded-sm"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-bold mb-6 text-slate-900 dark:text-slate-100">
            Legal
          </h4>
          <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            {footerLinks.legal.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary rounded-sm"
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
        <p>
          © {SITE.launchYear} {SITE.name}. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" aria-hidden="true" />
          <span>
            {SITE.city}, {SITE.country}
          </span>
        </div>
      </div>
    </footer>
  );
}
