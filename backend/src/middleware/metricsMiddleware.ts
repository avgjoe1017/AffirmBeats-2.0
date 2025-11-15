/**
 * Metrics Middleware
 * 
 * Middleware to automatically collect metrics for all API requests.
 */

import type { Context, Next } from "hono";
import type { AppType } from "../types";
import { metricHelpers } from "../lib/metrics";

/**
 * Metrics middleware
 * Collects metrics for all API requests
 */
export async function metricsMiddleware(c: Context<AppType>, next: Next) {
  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  // Execute request
  await next();

  // Calculate duration
  const duration = Date.now() - startTime;
  const status = c.res.status;

  // Record metrics
  metricHelpers.apiRequest(method, path, status, duration);

  // Record error metrics for non-2xx responses
  if (status >= 400) {
    const errorCode = status >= 500 ? "INTERNAL_ERROR" : "CLIENT_ERROR";
    metricHelpers.apiError(method, path, errorCode);
  }
}

