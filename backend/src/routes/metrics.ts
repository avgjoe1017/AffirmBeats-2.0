/**
 * Metrics API Routes
 * 
 * Provides endpoints for accessing application metrics.
 * In production, consider using Prometheus, DataDog, or similar services.
 */

import { Hono } from "hono";
import { type AppType } from "../types";
import { metrics, metricHelpers } from "../lib/metrics";
import { logger } from "../lib/logger";
import { exportPrometheusMetrics } from "../lib/metrics/prometheus";

const metricsRouter = new Hono<AppType>();

/**
 * GET /api/metrics
 * Get all metrics (for monitoring/debugging)
 * 
 * Note: In production, this should be protected and rate-limited.
 * Consider using Prometheus or similar for production metrics.
 */
metricsRouter.get("/", async (c) => {
  const user = c.get("user");
  
  logger.debug("Metrics requested", { userId: user?.id || "anonymous" });

  // Get metrics summary
  const allMetrics = metrics.getAllMetrics();
  const metricsByName = metrics.getMetricsByName();

  // Calculate summary statistics
  const summary: Record<string, {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  }> = {};

  for (const [name, metricList] of Object.entries(metricsByName)) {
    const stats = metrics.getSummary(name);
    if (stats) {
      summary[name] = stats;
    }
  }

  return c.json({
    timestamp: new Date().toISOString(),
    totalMetrics: allMetrics.length,
    metrics: metricsByName,
    summary,
  });
});

/**
 * GET /api/metrics/:name
 * Get metrics for a specific name
 */
metricsRouter.get("/:name", async (c) => {
  const name = c.req.param("name");
  const since = c.req.query("since");
  
  logger.debug("Metric requested", { name, since });

  const sinceTimestamp = since ? parseInt(since, 10) : undefined;
  const metricList = metrics.getMetrics(name, sinceTimestamp);
  const stats = metrics.getSummary(name, sinceTimestamp);

  return c.json({
    name,
    metrics: metricList,
    summary: stats,
  });
});

/**
 * GET /api/metrics/prometheus
 * Get metrics in Prometheus format (for scraping)
 * 
 * Note: In production, this should be protected and rate-limited.
 */
metricsRouter.get("/prometheus", async (c) => {
  const user = c.get("user");
  
  logger.debug("Prometheus metrics requested", { userId: user?.id || "anonymous" });

  try {
    const prometheusMetrics = exportPrometheusMetrics();
    return c.text(prometheusMetrics, 200, {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    });
  } catch (error) {
    logger.error("Failed to export Prometheus metrics", error);
    return c.text("# Error exporting metrics\n", 500, {
      "Content-Type": "text/plain",
    });
  }
});

/**
 * POST /api/metrics/clear
 * Clear all metrics (for testing/debugging)
 * 
 * Note: In production, this should be protected.
 */
metricsRouter.post("/clear", async (c) => {
  const user = c.get("user");
  
  logger.warn("Metrics cleared", { userId: user?.id || "anonymous" });
  
  metrics.clear();

  return c.json({
    success: true,
    message: "Metrics cleared",
  });
});

export { metricsRouter };

