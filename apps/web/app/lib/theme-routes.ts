/**
 * Rutas que pertenecen al dashboard interno autenticado (`apps/web/app/(app)/*`).
 *
 * En estas rutas el theme respeta la preferencia del usuario (`localStorage.theme`).
 * En cualquier otra ruta (landing, auth, onboarding, portal cliente, etc.) se
 * fuerza el modo oscuro para mantener una identidad visual consistente cara
 * al público.
 *
 * IMPORTANTE: este archivo se importa también desde un script inline que corre
 * antes de la hidratación de React. Mantener esta lista en sync con la lista
 * inline en `apps/web/app/layout.tsx` (no hay forma de compartir el array entre
 * ambos contextos sin complicar el build).
 */
export const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/documents",
  "/clients",
  "/expedientes",
  "/vencimientos",
  "/calendario",
  "/finanzas",
  "/importar",
  "/analytics",
  "/settings",
  "/admin",
  "/analysis",
  "/estrategia",
  "/juris",
] as const;

export function isAppRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}
