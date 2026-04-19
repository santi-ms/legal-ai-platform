/**
 * Utilidad de logging centralizada
 * Reemplaza console.log/warn/error con logging condicional
 * En producción, los logs pueden enviarse a un servicio externo (Sentry, LogRocket, etc.)
 */

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

interface LogContext {
  [key: string]: any;
}

/**
 * Logger centralizado para el backend
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
    // if (isProd && process.env.LOG_SERVICE_URL) {
    //   sendToLogService('info', message, context);
    // }
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
    // En producción, podrías enviar a servicio de logging
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
        ? { message: error.message, name: error.name, stack: error.stack?.substring(0, 500) }
        : error;
      console.error(`[ERROR] ${message}`, safeError, safeContext);
    }
    // En producción, podrías enviar a servicio de logging (Sentry, etc.)
    // if (isProd && process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: safeContext });
    // }
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

