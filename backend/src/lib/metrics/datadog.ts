/**
 * DataDog Metrics Integration
 * 
 * Sends metrics to DataDog via StatsD or HTTP API.
 * 
 * Usage:
 *   import { initDataDogMetrics } from "./lib/metrics/datadog";
 *   await initDataDogMetrics();
 */

import { metrics } from "../metrics";
import { logger } from "../logger";
import { env } from "../../env";

let datadogClient: any = null;
let datadogEnabled = false;

/**
 * Initialize DataDog metrics client
 */
export async function initDataDogMetrics() {
  if (!env.DATADOG_API_KEY) {
    logger.warn("DataDog API key not configured, DataDog metrics disabled");
    return;
  }

  try {
    // DataDog can be integrated via:
    // 1. StatsD (recommended for high-volume)
    // 2. HTTP API (for batch metrics)
    // 3. Agent (for local development)

    // For now, we'll use HTTP API for simplicity
    datadogEnabled = true;
    logger.info("DataDog metrics initialized", { site: env.DATADOG_SITE });

    // Set up periodic metric flushing
    setInterval(async () => {
      await flushDataDogMetrics();
    }, 60000); // Flush every minute

    return datadogClient;
  } catch (error) {
    logger.error("Failed to initialize DataDog metrics", error);
    datadogEnabled = false;
  }
}

/**
 * Flush metrics to DataDog
 */
async function flushDataDogMetrics() {
  if (!datadogEnabled) {
    return;
  }

  try {
    const datadogUrl = `https://api.${env.DATADOG_SITE}/api/v1/series`;

    const allMetrics = metrics.getAllMetrics();
    const metricsByName = metrics.getMetricsByName();

    // Convert metrics to DataDog format
    const series: Array<{
      metric: string;
      points: Array<[number, number]>;
      tags?: string[];
      type?: string;
    }> = [];

    for (const [name, metricList] of Object.entries(metricsByName)) {
      if (metricList.length === 0) continue;

      // Group metrics by tags
      const metricsByTags = new Map<string, Array<{ timestamp: number; value: number }>>();

      for (const metric of metricList) {
        const tagString = metric.tags
          ? Object.entries(metric.tags)
              .map(([key, value]) => `${key}:${value}`)
              .join(",")
          : "";

        if (!metricsByTags.has(tagString)) {
          metricsByTags.set(tagString, []);
        }

        metricsByTags.get(tagString)!.push({
          timestamp: Math.floor(metric.timestamp / 1000),
          value: metric.value,
        });
      }

      // Create series for each tag combination
      for (const [tagString, metricValues] of metricsByTags.entries()) {
        const points = metricValues.map((m) => [m.timestamp, m.value] as [number, number]);
        const tags = tagString ? tagString.split(",") : [];

        // Determine metric type
        const isCounter = name.includes(".count") || name.includes("_count");
        const isGauge = name.includes(".duration") || name.includes("_duration");

        series.push({
          metric: name.replace(/\./g, "_"), // DataDog uses underscores
          points,
          tags: tags.length > 0 ? tags : undefined,
          type: isCounter ? "count" : isGauge ? "gauge" : "count",
        });
      }
    }

    if (series.length === 0) {
      return;
    }

    // Send metrics to DataDog
    const response = await fetch(datadogUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": env.DATADOG_API_KEY!,
      },
      body: JSON.stringify({
        series,
      }),
    });

    if (!response.ok) {
      logger.warn("Failed to send metrics to DataDog", {
        status: response.status,
        statusText: response.statusText,
      });
    } else {
      logger.debug("Metrics sent to DataDog", { count: series.length });
    }
  } catch (error) {
    logger.error("Error flushing metrics to DataDog", error);
  }
}

/**
 * Check if DataDog is enabled
 */
export function isDataDogEnabled(): boolean {
  return datadogEnabled;
}

