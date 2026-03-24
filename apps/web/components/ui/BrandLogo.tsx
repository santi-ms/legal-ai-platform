import Image from "next/image";

interface BrandLogoProps {
  /** Tamaño en px (ancho y alto). Por defecto 40. */
  size?: number;
  className?: string;
}

/**
 * Logo oficial de DocuLex.
 * Para reemplazar el logo: colocá el archivo en /public/logo.png (o .svg)
 * y actualizá el src aquí.
 */
export function BrandLogo({ size = 40, className = "" }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="DocuLex"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
