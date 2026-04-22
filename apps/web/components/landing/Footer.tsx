import Link from "next/link";
import { Mail, Globe, MapPin } from "lucide-react";
import { CONTACT, SITE, mailto } from "@/app/lib/site";

const footerLinks = {
  producto: [
    { name: "Funciones", href: "#funciones" },
    { name: "Cómo funciona", href: "#como-funciona" },
    { name: "Precios", href: "#precios" },
    { name: "Seguridad", href: "#seguridad" },
    { name: "Preguntas frecuentes", href: "#faq" },
  ],
  compañía: [
    { name: "Contacto", href: mailto(CONTACT.support, "Contacto — DocuLex") },
    { name: "Ventas / Estudios", href: "#contacto" },
    { name: "Casos de uso", href: "#casos-de-uso" },
  ],
  legal: [
    { name: "Privacidad", href: "/privacidad" },
    { name: "Términos", href: "/terminos" },
    { name: "Cookies", href: "/privacidad#cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-ink text-slate-300 pt-24 pb-10 px-6 md:px-20 overflow-hidden isolate">
      {/* Noise */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Mesh blob gold */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/10 rounded-full blur-[140px]"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Wordmark serif gigante */}
        <div className="mb-16 border-b border-white/10 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <p className="font-display text-6xl md:text-8xl font-light tracking-tight text-white leading-none">
                doculex<span className="text-gold">.</span>
              </p>
              <p className="mt-5 text-white/60 max-w-md leading-relaxed text-pretty">
                La nueva era de la abogacía en {SITE.country}. Eficiencia,
                seguridad y validez jurídica en un solo lugar.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={`mailto:${CONTACT.support}`}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-gold/40 hover:text-gold-400 hover:bg-white/[0.07] transition-all text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                aria-label={`Email — ${CONTACT.support}`}
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href={SITE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-gold/40 hover:text-gold-400 hover:bg-white/[0.07] transition-all text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                aria-label="Sitio web"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-16">
          {/* Producto */}
          <div>
            <h4 className="text-[11px] font-bold mb-5 text-gold-400 uppercase tracking-[0.18em]">
              Producto
            </h4>
            <ul className="space-y-3.5 text-sm text-white/60">
              {footerLinks.producto.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white rounded-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Compañía */}
          <div>
            <h4 className="text-[11px] font-bold mb-5 text-gold-400 uppercase tracking-[0.18em]">
              Compañía
            </h4>
            <ul className="space-y-3.5 text-sm text-white/60">
              {footerLinks.compañía.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white rounded-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-bold mb-5 text-gold-400 uppercase tracking-[0.18em]">
              Legal
            </h4>
            <ul className="space-y-3.5 text-sm text-white/60">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white rounded-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto directo */}
          <div>
            <h4 className="text-[11px] font-bold mb-5 text-gold-400 uppercase tracking-[0.18em]">
              Contacto
            </h4>
            <ul className="space-y-3.5 text-sm text-white/60">
              <li>
                <a
                  href={`mailto:${CONTACT.support}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {CONTACT.support}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  {SITE.city}, {SITE.country}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p className="flex items-center gap-2 flex-wrap justify-center">
            <span>
              © {SITE.launchYear} {SITE.name}
            </span>
            <span aria-hidden="true">·</span>
            <span>Todos los derechos reservados</span>
            <span aria-hidden="true">·</span>
            <span>Hecho en {SITE.country}</span>
          </p>
          <p className="text-white/30 tracking-widest uppercase">
            v1.0 · MVP
          </p>
        </div>
      </div>
    </footer>
  );
}
