/**
 * Sentry Error Tracking
 * 
 * Provides Sentry integration for error tracking and monitoring.
 * Falls back gracefully if Sentry is not configured.
 */

import { env } from "../env";
import { logger } from "./logger";

let sentryInitialized = false;

/**
 * Initialize Sentry
 */
export async function initSentry() {
  if (!env.SENTRY_DSN) {
    logger.warn("Sentry DSN not configured, error tracking will be disabled");
    return;
  }

  try {
    // Use @sentry/bun which is specifically designed for Bun runtime (no OpenTelemetry issues)
    const Sentry = await import("@sentry/bun");
    
    if (!Sentry || !Sentry.init) {
      throw new Error(`Sentry module not loaded correctly. Available keys: ${Object.keys(Sentry || {}).join(", ")}`);
    }
    
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV || "development",
      tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }

          // Remove sensitive request data
          if (event.request.data) {
            if (typeof event.request.data === "object") {
              const data = event.request.data as Record<string, unknown>;
              delete data.password;
              delete data.token;
              delete data.secret;
            }
          }
        }

        return event;
      },
    });

    sentryInitialized = true;
    logger.info("Sentry initialized", {
      environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
    });
  } catch (error) {
    logger.error("Failed to initialize Sentry", error);
  }
}

/**
 * Capture exception
 */
export async function captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    const Sentry = await import("@sentry/bun");
    if (Sentry && Sentry.captureException) {
      Sentry.captureException(error, {
        tags: context,
        extra: context,
      });
    }
  } catch (err) {
    logger.error("Failed to capture exception", err);
  }
}

/**
 * Capture message
 */
export async function captureMessage(message: string, level: "info" | "warning" | "error" = "error", context?: Record<string, unknown>): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    const Sentry = await import("@sentry/bun");
    if (Sentry && Sentry.captureMessage) {
      Sentry.captureMessage(message, {
        level,
        tags: context,
        extra: context,
      });
    }
  } catch (err) {
    logger.error("Failed to capture message", err);
  }
}

/**
 * Set user context
 */
export async function setUser(user: { id: string; email?: string; username?: string }): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    const Sentry = await import("@sentry/bun");
    if (Sentry && Sentry.setUser) {
      Sentry.setUser(user);
    }
  } catch (err) {
    logger.error("Failed to set user context", err);
  }
}

/**
 * Add breadcrumb
 */
export async function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: "info" | "warning" | "error";
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    const Sentry = await import("@sentry/bun");
    if (Sentry && Sentry.addBreadcrumb) {
      Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level || "info",
        data: breadcrumb.data,
      });
    }
  } catch (err) {
    logger.error("Failed to add breadcrumb", err);
  }
}

// Note: Sentry initialization is called from src/index.ts
// to ensure proper initialization order
