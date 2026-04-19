interface BrandLogoProps {
  /**
   * Altura en px. Controla el tamaño del logo (el ancho se ajusta automáticamente
   * según el aspect ratio de la imagen). Por defecto 40.
   */
  size?: number;
  className?: string;
}

/**
 * Logo oficial de DocuLex.
 * - Modo claro → LogoNegro.png (logo oscuro sobre fondo claro)
 * - Modo oscuro → LogoBlanco.png (logo blanco sobre fondo oscuro)
 *
 * El ancho se ajusta automáticamente al aspect ratio del logo.
 * Usa <img> en lugar de next/image para permitir tamaños reales sin compresión.
 */
export function BrandLogo({ size = 40, className = "" }: BrandLogoProps) {
  return (
    <>
      {/* Modo claro — logo negro sobre fondo blanco */}
      <img
        src="/logo-negro.png"
        alt="DocuLex"
        height={size}
        style={{ height: size, width: "auto" }}
        className={`block dark:hidden ${className}`}
      />
      {/* Modo oscuro — logo blanco sobre fondo oscuro */}
      <img
        src="/logo-blanco.png"
        alt="DocuLex"
        height={size}
        style={{ height: size, width: "auto" }}
        className={`hidden dark:block ${className}`}
      />
    </>
  );
}
