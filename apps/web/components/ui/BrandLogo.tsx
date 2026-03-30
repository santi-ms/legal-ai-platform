import Image from "next/image";

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
 */
export function BrandLogo({ size = 40, className = "" }: BrandLogoProps) {
  const sharedProps = {
    // next/image necesita width y height como hints de optimización.
    // El ancho real se controla por CSS (width: auto + height fija).
    width: 320,
    height: size,
    style: { height: size, width: "auto" },
    priority: true,
    className: `object-contain ${className}`,
  };

  return (
    <>
      {/* Modo claro — logo negro sobre fondo blanco */}
      <Image
        src="/logo-negro.png"
        alt="DocuLex"
        {...sharedProps}
        className={`block dark:hidden object-contain ${className}`}
      />
      {/* Modo oscuro — logo blanco sobre fondo oscuro */}
      <Image
        src="/logo-blanco.png"
        alt="DocuLex"
        {...sharedProps}
        className={`hidden dark:block object-contain ${className}`}
      />
    </>
  );
}
