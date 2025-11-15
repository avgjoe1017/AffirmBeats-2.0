/**
 * Error Handler
 * 
 * Centralized error handling for all routes.
 * Catches errors, logs them, and returns appropriate responses.
 */

import type { Context } from "hono";
import type { AppType } from "../types";
import { logger } from "../lib/logger";
import { HTTPException } from "hono/http-exception";

/**
 * Error handler for Hono
 * Handles all errors that occur in routes
 */
export function errorHandler(error: Error, c: Context<AppType>) {
  // Handle HTTPException (from Hono)
  if (error instanceof HTTPException) {
    logger.warn("HTTP exception", {
      status: error.status,
      message: error.message,
      path: c.req.path,
      method: c.req.method,
      userId: c.get("user")?.id || "anonymous",
    });
    
    return c.json(
      {
        error: "HTTP_EXCEPTION",
        code: "HTTP_EXCEPTION",
        message: error.message,
        status: error.status,
      },
      error.status
    );
  }

  // Handle validation errors (from Zod)
  if (error && typeof error === "object" && "issues" in error) {
    logger.warn("Validation error", {
      issues: (error as { issues: unknown[] }).issues,
      path: c.req.path,
      method: c.req.method,
      userId: c.get("user")?.id || "anonymous",
    });

    return c.json(
      {
        error: "VALIDATION_ERROR",
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: (error as { issues: unknown[] }).issues,
      },
      400
    );
  }

  // Handle unknown errors
  logger.error("Unhandled error", error instanceof Error ? error : new Error(String(error)), {
    path: c.req.path,
    method: c.req.method,
    userId: c.get("user")?.id || "anonymous",
    headers: Object.fromEntries(c.req.raw.headers.entries()),
  });

  return c.json(
    {
      error: "INTERNAL_ERROR",
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    500
  );
}

