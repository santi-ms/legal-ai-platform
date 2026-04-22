import { cn } from "@/app/lib/utils";

type Variant = "white" | "parchment" | "mesh" | "grid" | "ink";

interface Props {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Fondo reutilizable por sección. Centraliza la paleta editorial y evita
 * que cada sección reinvente el ritmo visual.
 *
 * Variantes:
 *  - "white"      — fondo neutro light/dark estándar.
 *  - "parchment"  — cálido (crema) en light, ink en dark. Sensación editorial.
 *  - "mesh"       — gradient blobs (primary + gold). Dinámico, ideal para Hero/CTA.
 *  - "grid"       — dotted grid. Sobrio, para secciones densas.
 *  - "ink"        — forzado a dark elegante (ink) con texto claro. Contraste visual.
 */
export function SectionBackground({
  variant = "white",
  className,
  children,
}: Props) {
  const bgClass = {
    white: "bg-white dark:bg-background-dark",
    parchment: "bg-parchment dark:bg-ink",
    mesh: "bg-white dark:bg-ink bg-mesh-primary dark:bg-mesh-dark",
    grid:
      "bg-white dark:bg-background-dark bg-dotted-grid bg-grid-24 [background-position:0_0]",
    ink: "bg-ink text-slate-100",
  }[variant];

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden",
        bgClass,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Blob decorativo mesh — absolute, no afecta layout. Úsese dentro de
 * una sección con `relative` + `overflow-hidden`. Acepta color y posición.
 */
export function MeshBlob({
  color = "primary",
  size = 480,
  className,
}: {
  color?: "primary" | "gold";
  size?: number;
  className?: string;
}) {
  const bgColor = color === "primary" ? "bg-primary/25" : "bg-gold/20";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "mesh-blob animate-mesh-drift",
        bgColor,
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}
