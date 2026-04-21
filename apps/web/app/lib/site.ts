/**
 * Constantes globales del sitio — URL canónica, emails de contacto, redes.
 * Toda la landing y metadata deben consumir estas constantes en lugar de
 * hardcodear strings. Así evitamos inconsistencias como dos canonicals
 * distintos o dos emails de soporte distintos.
 */

const rawSiteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://doculex.com.ar";

// Normalizamos: sin trailing slash, con https://.
export const SITE_URL = rawSiteUrl.replace(/\/$/, "");

export const SITE = {
  name: "DocuLex",
  shortDescription:
    "Documentos legales con IA para abogados y estudios jurídicos en Argentina.",
  longDescription:
    "Generá contratos, NDAs, cartas documento y más con validez jurídica en Argentina. IA entrenada en normativa local. Para abogados, estudios jurídicos y pymes.",
  url: SITE_URL,
  locale: "es_AR",
  country: "Argentina",
  city: "Buenos Aires",
  launchYear: new Date().getFullYear(),
} as const;

export const CONTACT = {
  support: "soporte@doculex.ar",
  sales: "ventas@doculex.ar",
  legal: "legal@doculex.ar",
} as const;

/** Construye un mailto con subject/body encoded. */
export function mailto(to: string, subject: string, body?: string): string {
  const params = new URLSearchParams();
  params.set("subject", subject);
  if (body) params.set("body", body);
  return `mailto:${to}?${params.toString()}`;
}

/** Saca el path absoluto para metadata.openGraph.url y similares. */
export function absoluteUrl(path: string = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}
