/**
 * Prometheus Metrics Exporter
 * 
 * Exports metrics in Prometheus format for scraping.
 * 
 * Usage:
 *   import { exportPrometheusMetrics } from "./lib/metrics/prometheus";
 *   app.get("/metrics", async (c) => {
 *     const metrics = await exportPrometheusMetrics();
 *     return c.text(metrics, 200, { "Content-Type": "text/plain" });
 *   });
 */

import { metrics } from "../metrics";
import { logger } from "../logger";

/**
 * Export metrics in Prometheus format
 */
export function exportPrometheusMetrics(): string {
  const allMetrics = metrics.getAllMetrics();
  const metricsByName = metrics.getMetricsByName();

  const lines: string[] = [];

  // Add help and type comments for each metric
  for (const [name, metricList] of Object.entries(metricsByName)) {
    if (metricList.length === 0) continue;

    // Determine metric type based on name
    const isCounter = name.includes(".count") || name.includes("_count");
    const isHistogram = name.includes(".duration") || name.includes("_duration");
    const isGauge = name.includes(".value") || name.includes("_value");

    const metricType = isCounter ? "counter" : isHistogram ? "histogram" : isGauge ? "gauge" : "counter";

    // Add help and type
    lines.push(`# HELP ${name} ${name}`);
    lines.push(`# TYPE ${name} ${metricType}`);

    // Group metrics by tags to aggregate values
    const metricsByTags = new Map<string, number[]>();

    for (const metric of metricList) {
      const tagString = metric.tags
        ? Object.entries(metric.tags)
            .sort(([a], [b]) => a.localeCompare(b)) // Sort for consistent ordering
            .map(([key, value]) => `${key}="${String(value).replace(/"/g, '\\"')}"`)
            .join(",")
        : "";

      if (!metricsByTags.has(tagString)) {
        metricsByTags.set(tagString, []);
      }

      metricsByTags.get(tagString)!.push(metric.value);
    }

    // Add aggregated metrics (Prometheus expects counters to be cumulative)
    for (const [tagString, values] of metricsByTags.entries()) {
      const labelString = tagString ? `{${tagString}}` : "";

      // For counters, sum the values
      // For histograms/gauges, use the latest value
      const metricValue = isCounter
        ? values.reduce((a, b) => a + b, 0)
        : values[values.length - 1]; // Use latest value for gauges

      lines.push(`${name}${labelString} ${metricValue}`);
    }
  }

  return lines.join("\n") + "\n";
}

/**
 * Get Prometheus metrics endpoint handler
 */
export function getPrometheusMetricsHandler() {
  return async (c: any) => {
    try {
      const metrics = exportPrometheusMetrics();
      return c.text(metrics, 200, {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      });
    } catch (error) {
      logger.error("Failed to export Prometheus metrics", error);
      return c.text("# Error exporting metrics\n", 500, {
        "Content-Type": "text/plain",
      });
    }
  };
}

