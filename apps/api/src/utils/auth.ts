import jwt from "jsonwebtoken";
import { FastifyRequest } from "fastify";

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

/**
 * Extrae el token JWT del header Authorization y lo valida
 * Retorna null si no hay token o es inválido
 */
export function getUserFromRequest(request: FastifyRequest): AuthUser | null {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7); // Remover "Bearer "
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.warn("[auth] NEXTAUTH_SECRET no configurado");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    
    // NextAuth JWT tiene esta estructura en el token
    return {
      userId: decoded.id || decoded.sub,
      tenantId: decoded.tenantId,
      role: decoded.role || "user",
      email: decoded.email,
    };
  } catch (error) {
    // Token inválido o expirado
    return null;
  }
}

/**
 * Middleware helper que requiere autenticación
 * Retorna el usuario o lanza error 401
 */
export function requireAuth(request: FastifyRequest): AuthUser {
  const user = getUserFromRequest(request);
  
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  
  return user;
}
