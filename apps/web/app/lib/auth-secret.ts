/**
 * Resuelve el NEXTAUTH_SECRET de forma segura.
 *
 * - En producción: falla de arranque si falta o si es un valor dev ("dev-*").
 * - En desarrollo: permite el fallback hardcoded para no romper el DX local.
 *
 * Importante: NUNCA devolver el fallback en producción — de otro modo un
 * atacante puede forjar JWTs válidos con el valor público del repo.
 */
const DEV_FALLBACK = "dev-secret-change-in-production";

export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret || secret.startsWith("dev-")) {
    if (isProd) {
      throw new Error(
        "NEXTAUTH_SECRET must be set to a non-dev value in production. " +
          "Generate one with `openssl rand -base64 32` and set it as an env var.",
      );
    }
    return DEV_FALLBACK;
  }

  return secret;
}

/**
 * Check no-throwing, útil para middleware/edge runtime donde no podemos
 * matar la request. Devuelve null si el secret no es válido en producción.
 */
export function getAuthSecretOrNull(): string | null {
  try {
    return getAuthSecret();
  } catch {
    return null;
  }
}
