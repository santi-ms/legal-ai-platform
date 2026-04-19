/**
 * Utilidad de logging centralizada para el frontend
 * Reemplaza console.log/warn/error con logging condicional
 * En producción, los logs pueden enviarse a un servicio externo (Sentry, LogRocket, etc.)
 */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

interface LogContext {
  [key: string]: any;
}

/**
 * Logger centralizado para el frontend
 */
export const logger = {
  /**
   * Log de información (solo en desarrollo)
   */
  info: (message: string, context?: LogContext) => {
    if (isDev) {
      if (context) {
        console.log(`[INFO] ${message}`, context);
      } else {
        console.log(`[INFO] ${message}`);
      }
    }
    // En producción, podrías enviar a servicio de logging
  },

  /**
   * Log de advertencias (siempre se loguean, pero sin información sensible en prod)
   */
  warn: (message: string, context?: LogContext) => {
    if (isDev) {
      if (context) {
        console.warn(`[WARN] ${message}`, context);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    } else {
      // En producción, loguear sin información sensible
      const safeContext = sanitizeContext(context);
      console.warn(`[WARN] ${message}`, safeContext);
    }
  },

  /**
   * Log de errores (siempre se loguean, pero sin información sensible en prod)
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    if (isDev) {
      if (error instanceof Error) {
        console.error(`[ERROR] ${message}`, error, context);
      } else if (error) {
        console.error(`[ERROR] ${message}`, error, context);
      } else {
        console.error(`[ERROR] ${message}`, context);
      }
    } else {
      // En producción, loguear sin información sensible
      const safeContext = sanitizeContext(context);
      const safeError = error instanceof Error 
        ? { message: error.message, name: error.name }
        : error;
      console.error(`[ERROR] ${message}`, safeError, safeContext);
    }
    // En producción, podrías enviar a servicio de logging (Sentry, etc.)
    // if (isProd && typeof window !== 'undefined' && (window as any).Sentry) {
    //   (window as any).Sentry.captureException(error, { extra: safeContext });
    // }
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev || process.env.NEXT_PUBLIC_DEBUG === "true") {
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
    "accessToken",
    "refreshToken",
  ];

  const sanitized: LogContext = { ...context };

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }

  // Sanitizar objetos anidados
  for (const key in sanitized) {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeContext(sanitized[key] as LogContext) as any;
    }
  }

  return sanitized;
}

