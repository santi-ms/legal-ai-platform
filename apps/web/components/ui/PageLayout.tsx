"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import { PageHeader } from "./PageHeader";
import type { LucideIcon } from "lucide-react";
import type { GradientKey } from "@/app/lib/design-tokens";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  /** Kicker editorial — uppercase dorado, opcional. */
  eyebrow?: string;
  /** H1 de página. */
  title: string;
  /** Subtítulo o descripción. */
  description?: string;
  /** Icono opcional con gradiente a la izquierda del título. */
  icon?: LucideIcon;
  iconGradient?: GradientKey;
  /** Acciones alineadas a la derecha (CTA, filtros, etc.). */
  actions?: React.ReactNode;
  /** Breadcrumbs — se renderizan arriba del título. */
  breadcrumbs?: Breadcrumb[];
  /** Badge opcional al lado del título. */
  badge?: {
    label: string;
    tone?: "default" | "warning" | "danger" | "success" | "info" | "gold";
  };
  /** Ancho máximo del contenido — por defecto sin límite (full). */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Contenido principal. */
  children: React.ReactNode;
  /** Clase extra para el wrapper. */
  className?: string;
  /** Clase extra para el contenedor de contenido (debajo del header). */
  contentClassName?: string;
  /** Si false, omite el header interno (útil cuando la página lo renderiza ella misma). */
  renderHeader?: boolean;
}

const MAX_WIDTH_CLASS: Record<NonNullable<PageLayoutProps["maxWidth"]>, string> = {
  sm:  "max-w-3xl",
  md:  "max-w-4xl",
  lg:  "max-w-5xl",
  xl:  "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-none",
};

/**
 * PageLayout — wrapper editorial unificado para todas las páginas del sistema
 * autenticado. Aplica:
 *   · Padding responsivo (px-6 md:px-10 py-8 md:py-10)
 *   · Ancho máximo configurable (por defecto full, con safe padding)
 *   · Header con eyebrow/título/subtítulo/actions/breadcrumbs usando PageHeader
 *   · Tipografía editorial (Inter extrabold tracking-tight) vía PageHeader
 *
 * Uso típico:
 *   <PageLayout
 *     eyebrow="Gestión"
 *     title="Mis documentos"
 *     description="Todos los documentos generados, ordenados por fecha."
 *     actions={<Button>Nuevo</Button>}
 *   >
 *     {contenido}
 *   </PageLayout>
 */
export function PageLayout({
  eyebrow,
  title,
  description,
  icon,
  iconGradient,
  actions,
  breadcrumbs,
  badge,
  maxWidth = "full",
  children,
  className,
  contentClassName,
  renderHeader = true,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        "flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 md:py-10",
        className,
      )}
    >
      <div className={cn("mx-auto w-full", MAX_WIDTH_CLASS[maxWidth])}>
        {renderHeader && (
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            icon={icon}
            iconGradient={iconGradient}
            actions={actions}
            breadcrumbs={breadcrumbs}
            badge={badge}
          />
        )}
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}
