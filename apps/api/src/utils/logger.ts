/**
 * Utilidad de logging centralizada
 * Reemplaza console.log/warn/error con logging condicional
 * En producción, los errores se envían a Sentry si SENTRY_DSN está configurado.
 */

import * as Sentry from "@sentry/node";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";
const hasSentry = Boolean(process.env.SENTRY_DSN);

interface LogContext {
  [key: string]: any;
}

/**
 * Logger centralizado para el backend
 */
export const logger = {
  /**
   * Log de información (desarrollo y producción)
   */
  info: (message: string, context?: LogContext) => {
    if (context) {
      console.log(`[INFO] ${message}`, isDev ? context : sanitizeContext(context));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },

  /**
   * Log de advertencias
   */
  warn: (message: string, context?: LogContext) => {
    const safeContext = isDev ? context : sanitizeContext(context);
    if (safeContext) {
      console.warn(`[WARN] ${message}`, safeContext);
    } else {
      console.warn(`[WARN] ${message}`);
    }
    if (isProd && hasSentry) {
      Sentry.withScope((scope) => {
        if (safeContext) scope.setExtras(safeContext as Record<string, unknown>);
        Sentry.captureMessage(message, "warning");
      });
    }
  },

  /**
   * Log de errores — siempre loguea, en producción envía a Sentry si está configurado
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const safeContext = isDev ? context : sanitizeContext(context);
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, safeContext);
    } else {
      const safeError = error instanceof Error
        ? { message: error.message, name: error.name, stack: error.stack?.substring(0, 500) }
        : error;
      console.error(`[ERROR] ${message}`, safeError, safeContext);
    }
    if (isProd && hasSentry) {
      Sentry.withScope((scope) => {
        scope.setTag("logger.message", message);
        if (safeContext) scope.setExtras(safeContext as Record<string, unknown>);
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(`${message}${error ? `: ${String(error)}` : ""}`, "error");
        }
      });
    }
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev || process.env.DEBUG === "true") {
      if (context) {
        console.debug(`[DEBUG] ${message}`, context);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },
};

/**
 * Sanitiza el contexto para remover información sensible
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return context;

  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "session",
  ];

  const sanitized: LogContext = { ...context };

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }

  // Sanitizar objetos anidados
  for (const key in sanitized) {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeContext(sanitized[key] as LogContext);
    }
  }

  return sanitized;
}

