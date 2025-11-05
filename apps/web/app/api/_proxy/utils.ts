import jwt from "jsonwebtoken";

/**
 * Genera un JWT válido desde el token de NextAuth
 * El backend espera un JWT con: id, email, role, tenantId
 * 
 * IMPORTANTE: Este código solo se ejecuta server-side en Route Handlers.
 * NUNCA se expone al cliente ni se incluye en bundles del cliente.
 */
export function generateJWT(token: any): string {
  // Usar NEXTAUTH_SECRET (server-only) para firmar el JWT
  // Este secret nunca se expone al cliente
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET no configurado (server-side)");
  }

  const user = token.user || token;
  const payload = {
    id: user.id || user.sub,
    sub: user.id || user.sub,
    email: user.email,
    role: user.role || "user",
    tenantId: user.tenantId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2 horas
  };

  return jwt.sign(payload, secret);
}
