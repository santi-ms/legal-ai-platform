"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const navigation = [
  { name: "Inicio", href: "#inicio" },
  { name: "Cómo funciona", href: "#como-funciona" },
  { name: "Funciones", href: "#funciones" },
  { name: "Seguridad", href: "#seguridad" },
  { name: "Precios", href: "#precios" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
          aria-label="DocuLex — inicio"
        >
          <BrandLogo size={50} />
        </Link>

        {/* Desktop Navigation — usa anchor nativo, smooth-scroll via CSS */}
        <div className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary rounded-sm"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="hidden sm:block text-sm font-medium px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-primary/5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/register"
            className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Probar gratis
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-700 dark:text-slate-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
        <div className="md:hidden mt-4 pb-4 border-t border-primary/10">
          <div className="flex flex-col gap-1 pt-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={closeMobile}
                className="text-left text-sm font-medium px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-primary/5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {item.name}
              </a>
            ))}
            <Link
              href="/auth/login"
              onClick={closeMobile}
              className="text-left text-sm font-medium px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-primary/5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
