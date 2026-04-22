"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { cn } from "@/app/lib/utils";

const navigation = [
  { name: "Inicio", href: "#inicio" },
  { name: "Cómo funciona", href: "#como-funciona" },
  { name: "Funciones", href: "#funciones" },
  { name: "Seguridad", href: "#seguridad" },
  { name: "Precios", href: "#precios" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Morphing nav: al scrollear > 24px el navbar se contrae en pill flotante.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
      <nav
        className={cn(
          "w-full border backdrop-blur-md pointer-events-auto",
          "transition-[max-width,border-radius,background-color,border-color,box-shadow,padding] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? // Cuando el menú mobile está abierto, se baja el radius a 24px
              // para que el dropdown no quede recortado por el pill circular.
              mobileMenuOpen
              ? "max-w-[1400px] rounded-3xl border-slate-800/80 bg-ink/95 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] px-5 md:px-7 py-3"
              : "max-w-[960px] rounded-full border-slate-800/80 bg-ink/90 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] px-5 md:px-7 py-2.5"
            : "max-w-[1400px] rounded-[20px] border-slate-200/60 dark:border-slate-800/60 bg-background-light/70 dark:bg-background-dark/70 shadow-[0_0_0_rgba(0,0,0,0)] px-5 md:px-10 py-3.5"
        )}
      >
        <div className="flex items-center justify-between gap-6">
          {/* Logo — siempre 50px, se escala con transform para animar suave */}
          <Link
            href="/"
            className={cn(
              "relative flex items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md shrink-0 origin-left",
              "transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              scrolled ? "scale-[0.78]" : "scale-100"
            )}
            aria-label="DocuLex — inicio"
          >
            <span className="relative block" style={{ height: 50 }}>
              {/* Versión temática (visible al tope) */}
              <span
                className={cn(
                  "block transition-opacity duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  scrolled ? "opacity-0" : "opacity-100"
                )}
              >
                <BrandLogo size={50} />
              </span>
              {/* Versión blanca (visible sobre pill oscura) */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 flex items-center transition-opacity duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  scrolled ? "opacity-100" : "opacity-0"
                )}
              >
                <BrandLogo size={50} invert />
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div
            className={cn(
              "hidden md:flex items-center transition-[gap,font-size] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              scrolled ? "gap-7 text-[13px]" : "gap-8 text-sm"
            )}
          >
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "font-medium tracking-[-0.005em] transition-colors duration-[600ms] focus-visible:outline-none rounded-sm",
                  scrolled
                    ? "text-slate-200 hover:text-white"
                    : "text-slate-700 dark:text-slate-300 hover:text-primary"
                )}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Link
              href="/auth/login"
              className={cn(
                "hidden sm:block text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                scrolled
                  ? "text-slate-200 hover:bg-white/5"
                  : "text-slate-700 dark:text-slate-300 hover:bg-primary/5"
              )}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className={cn(
                "bg-primary text-white text-sm font-bold rounded-lg transition-[padding,box-shadow] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:shadow-lg hover:shadow-primary/30",
                scrolled ? "px-4 py-2" : "px-5 py-2.5"
              )}
            >
              Probar gratis
            </Link>

            {/* Mobile menu button */}
            <button
              className={cn(
                "md:hidden p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                scrolled ? "text-slate-200" : "text-slate-700 dark:text-slate-300"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            className={cn(
              "md:hidden mt-4 pb-2 border-t",
              scrolled ? "border-slate-700/60" : "border-primary/10"
            )}
          >
            <div className="flex flex-col gap-1 pt-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "text-left text-sm font-medium px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    scrolled
                      ? "text-slate-200 hover:bg-white/5"
                      : "text-slate-700 dark:text-slate-300 hover:bg-primary/5"
                  )}
                >
                  {item.name}
                </a>
              ))}
              <Link
                href="/auth/login"
                onClick={closeMobile}
                className={cn(
                  "text-left text-sm font-medium px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  scrolled
                    ? "text-slate-200 hover:bg-white/5"
                    : "text-slate-700 dark:text-slate-300 hover:bg-primary/5"
                )}
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
