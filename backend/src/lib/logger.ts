/**
 * Structured Logging Utility
 * 
 * Provides structured logging for the backend with different log levels.
 * In production, logs can be sent to services like Logtail, CloudWatch, etc.
 */

import { env } from "../env";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    this.logLevel = (env.LOG_LEVEL as LogLevel) || 
                   (env.NODE_ENV === "production" ? "info" : "debug");
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog("error")) {
      const errorContext = error instanceof Error 
        ? { ...context, error: error.message, stack: error.stack }
        : { ...context, error: String(error) };
      console.error(this.formatMessage("error", message, errorContext));

      // Send to Sentry if available (async, don't block)
      if (error instanceof Error) {
        import("./sentry").then(({ captureException }) => {
          captureException(error, context).catch(() => {
            // Sentry not available, ignore
          });
        }).catch(() => {
          // Sentry not available, ignore
        });
      } else {
        import("./sentry").then(({ captureMessage }) => {
          captureMessage(message, "error", errorContext).catch(() => {
            // Sentry not available, ignore
          });
        }).catch(() => {
          // Sentry not available, ignore
        });
      }
    }
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

/**
 * Helper functions for common logging scenarios
 */
export const loggers = {
  /**
   * Log API request
   */
  request: (method: string, path: string, statusCode: number, duration: number) => {
    logger.info("API request", {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
    });
  },

  /**
   * Log API error
   */
  apiError: (method: string, path: string, error: Error, statusCode?: number) => {
    logger.error("API error", error, {
      method,
      path,
      statusCode,
    });
  },

  /**
   * Log database operation
   */
  dbOperation: (operation: string, table: string, duration: number) => {
    logger.debug("Database operation", {
      operation,
      table,
      duration: `${duration}ms`,
    });
  },

  /**
   * Log database error
   */
  dbError: (operation: string, table: string, error: Error) => {
    logger.error("Database error", error, {
      operation,
      table,
    });
  },

  /**
   * Log authentication event
   */
  authEvent: (event: string, userId?: string, context?: LogContext) => {
    logger.info("Authentication event", {
      event,
      userId,
      ...context,
    });
  },

  /**
   * Log session creation
   */
  sessionCreated: (sessionId: string, userId: string, goal: string) => {
    logger.info("Session created", {
      sessionId,
      userId,
      goal,
    });
  },

  /**
   * Log session error
   */
  sessionError: (sessionId: string, userId: string, error: Error) => {
    logger.error("Session error", error, {
      sessionId,
      userId,
    });
  },

  /**
   * Log TTS generation
   */
  ttsGenerated: (sessionId: string, duration: number, voiceType: string) => {
    logger.info("TTS generated", {
      sessionId,
      duration: `${duration}ms`,
      voiceType,
    });
  },

  /**
   * Log TTS error
   */
  ttsError: (sessionId: string, error: Error) => {
    logger.error("TTS error", error, {
      sessionId,
    });
  },

  /**
   * Log subscription event
   */
  subscriptionEvent: (event: string, userId: string, tier: string, context?: LogContext) => {
    logger.info("Subscription event", {
      event,
      userId,
      tier,
      ...context,
    });
  },
};
