/**
 * Rate limiter en memoria para llamadas a los asistentes IA.
 *
 * Se usa en el preHandler de Fastify (server.ts) y se aísla acá para
 * poder testearlo sin levantar el server entero.
 */

export interface AiRateLimitEntry {
  count: number;
  resetAt: number;
}

export interface AiRateLimitResult {
  allowed: boolean;
  /** Segundos hasta que se libere la ventana (sólo cuando allowed=false) */
  retryAfterSeconds: number;
}

export interface ConsumeOptions {
  userId: string;
  store: Map<string, AiRateLimitEntry>;
  now: number;
  /** Máximo de requests permitidas dentro de la ventana */
  max: number;
  /** Tamaño de la ventana en milisegundos */
  windowMs: number;
}

export function consumeAiRateLimit(opts: ConsumeOptions): AiRateLimitResult {
  const { userId, store, now, max, windowMs } = opts;
  const key = `ai:${userId}`;
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count++;
  if (existing.count > max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function pruneExpiredEntries(store: Map<string, AiRateLimitEntry>, now: number): void {
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}
