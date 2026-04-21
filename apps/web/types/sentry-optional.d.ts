/**
 * Shim mínimo de tipos para `@sentry/nextjs`.
 *
 * El paquete está declarado en package.json pero puede no estar instalado
 * en todos los entornos (dev local, PRs, CI liviano). Este shim permite
 * que los archivos `sentry.*.config.ts` y `next.config.mjs` compilen sin
 * el paquete presente. Cuando Sentry está instalado de verdad, sus tipos
 * reales reemplazan a este shim.
 */
declare module "@sentry/nextjs" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function init(options: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function captureException(error: unknown, context?: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function withSentryConfig<T>(config: T, options?: any): T;
}
