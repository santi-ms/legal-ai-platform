/**
 * Construye una instancia de Fastify en modo test:
 *   - logger: false (para que la salida de los tests sea legible)
 *   - sin .listen(), se invoca vía app.inject({ ... })
 *
 * Debe importarse después de `./env.ts` para que las env vars estén en su
 * lugar cuando se resuelvan los módulos de rutas.
 */

import type { FastifyInstance } from "fastify";

let appPromise: Promise<FastifyInstance> | null = null;

export async function getTestApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = (async () => {
      const { buildServer } = await import("../../src/app.js");
      const app = await buildServer({ logger: false });
      await app.ready();
      return app;
    })();
  }
  return appPromise;
}

export async function closeTestApp() {
  if (appPromise) {
    const app = await appPromise;
    await app.close();
    appPromise = null;
  }
}

/**
 * Defaults para todo request de test. Incluye el header x-requested-with:xhr
 * requerido por el CSRF hook del servidor.
 */
export function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "x-requested-with": "xhr",
    "content-type": "application/json",
  };
}
