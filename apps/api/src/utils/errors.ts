/**
 * Centralized error utilities for consistent API error responses.
 */

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(404, `${resource} no encontrado`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class TenantIsolationError extends AppError {
  constructor() {
    super(404, 'Recurso no encontrado', 'NOT_FOUND'); // Intencionalmente 404, no 403
  }
}

/**
 * Helper: get tenantId + user from request, throw if missing.
 */
import type { FastifyRequest } from 'fastify';

export function requireAuth(request: FastifyRequest): { userId: string; tenantId: string; role: string } {
  const user = (request as any).user;
  if (!user?.tenantId || !user?.userId) {
    throw new UnauthorizedError();
  }
  return { userId: user.userId, tenantId: user.tenantId, role: user.role || 'user' };
}

export function requireAdmin(request: FastifyRequest): { userId: string; tenantId: string; role: string } {
  const auth = requireAuth(request);
  if (auth.role !== 'admin' && auth.role !== 'owner') {
    throw new ForbiddenError('Se requiere rol de administrador');
  }
  return auth;
}
