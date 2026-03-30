"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const navigation = [
  { name: "Inicio", href: "#inicio" },
  { name: "Cómo funciona", href: "#como-funciona" },
  { name: "Funciones", href: "#funciones" },
  { name: "Precios", href: "#precios" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <BrandLogo size={52} />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            DocuLex
          </h2>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.href)}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="hidden sm:block text-sm font-medium px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-primary/5 rounded-lg transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/auth/register"
            className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            Probar Gratis
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-700 dark:text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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
          <div className="flex flex-col gap-2 pt-4">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-left text-sm font-medium px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-primary/5 rounded-lg transition-colors"
              >
                {item.name}
              </button>
            ))}
            <Link
              href="/auth/login"
              className="text-left text-sm font-medium px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-primary/5 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

