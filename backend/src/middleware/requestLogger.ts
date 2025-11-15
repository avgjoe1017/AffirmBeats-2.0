/**
 * Request Logger Middleware
 * 
 * Logs all incoming requests with context information.
 * Useful for debugging and monitoring.
 */

import type { Context, Next } from "hono";
import type { AppType } from "../types";
import { logger } from "../lib/logger";

/**
 * Request logger middleware
 * Logs all incoming requests with context
 */
export async function requestLogger(c: Context<AppType>, next: Next) {
  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const user = c.get("user");

  // Log request
  logger.debug("Incoming request", {
    method,
    path,
    userId: user?.id || "anonymous",
    userEmail: user?.email || undefined,
    ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown",
    userAgent: c.req.header("user-agent") || undefined,
  });

  // Execute request
  await next();

  // Calculate duration
  const duration = Date.now() - startTime;
  const status = c.res.status;

  // Log response
  logger.debug("Request completed", {
    method,
    path,
    status,
    duration: `${duration}ms`,
    userId: user?.id || "anonymous",
  });

  // Log slow requests
  if (duration > 1000) {
    logger.warn("Slow request detected", {
      method,
      path,
      duration: `${duration}ms`,
      status,
      userId: user?.id || "anonymous",
    });
  }
}

