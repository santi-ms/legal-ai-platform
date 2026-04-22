"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AuthSidePanel, type AuthPanelVariant } from "./AuthSidePanel";
import { Reveal } from "@/components/landing/motion";

interface AuthShellProps {
  /** Variante del panel lateral */
  variant: AuthPanelVariant;
  /** Título grande arriba del contenido (h1) */
  title: ReactNode;
  /** Subtítulo descriptivo */
  subtitle?: ReactNode;
  /** Eyebrow pequeño arriba del título (opcional) */
  eyebrow?: string;
  /** Link secundario en el header móvil: "¿Ya tenés cuenta? Iniciar sesión" */
  topRight?: ReactNode;
  /** Máx ancho del contenido principal. Default "max-w-md" */
  contentMaxWidth?: string;
  children: ReactNode;
}

/**
 * Layout split-screen para todas las páginas de autenticación.
 *
 * Consistencia visual con la landing:
 * - Panel izquierdo `bg-ink` con mesh blobs + noise SVG
 * - Panel derecho `bg-parchment` con textura sutil + el formulario centrado
 * - Entrada animada con `<Reveal>` de los primitivos de motion
 * - Tipografía Inter extrabold tracking-tight en el título
 * - Mobile: el panel lateral se oculta, queda un topbar compacto con wordmark
 */
export function AuthShell({
  variant,
  title,
  subtitle,
  eyebrow,
  topRight,
  contentMaxWidth = "max-w-md",
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-parchment dark:bg-background-dark texture-noise">
      {/* Panel lateral editorial — solo desktop */}
      <AuthSidePanel variant={variant} />

      {/* Columna derecha: wordmark móvil + contenido */}
      <div className="flex-1 flex flex-col relative">
        {/* Topbar móvil — solo visible en < lg */}
        <header className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-20">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-ink dark:text-white"
          >
            doculex<span className="text-gold-500">.</span>
          </Link>
          {topRight}
        </header>

        {/* Topbar desktop con back-link y slot top-right */}
        <div className="hidden lg:flex items-center justify-between px-12 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-ink dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver al inicio
          </Link>
          {topRight}
        </div>

        {/* Área principal con el formulario centrado */}
        <main className="flex-1 flex items-center justify-center px-6 py-10 lg:px-12 lg:py-14">
          <Reveal
            y={16}
            className={`w-full ${contentMaxWidth} space-y-8`}
          >
            <header className="space-y-3">
              {eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] text-balance">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-pretty">
                  {subtitle}
                </p>
              )}
            </header>

            {children}
          </Reveal>
        </main>

        {/* Back-link móvil (abajo) */}
        <div className="lg:hidden px-6 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
