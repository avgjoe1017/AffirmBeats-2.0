/**
 * Metrics Collection
 * 
 * Simple metrics collection for monitoring application performance.
 * In production, consider using Prometheus, DataDog, or similar services.
 */

import { logger } from "./logger";

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory
  private readonly flushInterval = 60000; // Flush every minute (for future use)

  /**
   * Record a metric
   */
  record(name: string, value: number, tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log important metrics
    if (value > 1000 || name.includes("error") || name.includes("failure")) {
      logger.debug("Metric recorded", { name, value, tags });
    }
  }

  /**
   * Increment a counter
   */
  increment(name: string, tags?: Record<string, string>) {
    this.record(name, 1, tags);
  }

  /**
   * Record a timing metric (duration in milliseconds)
   */
  timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record(name, duration, { ...tags, unit: "ms" });
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, since?: number): Metric[] {
    const filtered = this.metrics.filter(
      (m) => m.name === name && (!since || m.timestamp >= since)
    );
    return filtered;
  }

  /**
   * Get summary statistics for a metric
   */
  getSummary(name: string, since?: number): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const metrics = this.getMetrics(name, since);
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: metrics.length,
      sum,
      avg,
      min,
      max,
    };
  }

  /**
   * Get all metrics (for debugging/monitoring)
   */
  getAllMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Get metrics grouped by name
   */
  getMetricsByName(): Record<string, Metric[]> {
    const grouped: Record<string, Metric[]> = {};
    for (const metric of this.metrics) {
      if (!grouped[metric.name]) {
        grouped[metric.name] = [];
      }
      grouped[metric.name].push(metric);
    }
    return grouped;
  }
}

export const metrics = new MetricsCollector();

/**
 * Helper functions for common metrics
 */
export const metricHelpers = {
  /**
   * Record API request metric
   */
  apiRequest: (method: string, path: string, statusCode: number, duration: number) => {
    metrics.timing("api.request.duration", duration, {
      method,
      path,
      status: statusCode.toString(),
    });
    metrics.increment("api.request.count", {
      method,
      path,
      status: statusCode.toString(),
    });
  },

  /**
   * Record API error metric
   */
  apiError: (method: string, path: string, errorCode: string) => {
    metrics.increment("api.error.count", {
      method,
      path,
      error: errorCode,
    });
  },

  /**
   * Record database operation metric
   */
  dbOperation: (operation: string, table: string, duration: number) => {
    metrics.timing("db.operation.duration", duration, {
      operation,
      table,
    });
    metrics.increment("db.operation.count", {
      operation,
      table,
    });
  },

  /**
   * Record database error metric
   */
  dbError: (operation: string, table: string, error: string) => {
    metrics.increment("db.error.count", {
      operation,
      table,
      error,
    });
  },

  /**
   * Record cache hit/miss metric
   */
  cacheOperation: (operation: "hit" | "miss" | "set" | "delete", key: string) => {
    metrics.increment("cache.operation.count", {
      operation,
      key: key.substring(0, 50), // Truncate long keys
    });
  },

  /**
   * Record TTS generation metric
   */
  ttsGeneration: (duration: number, voiceType: string) => {
    metrics.timing("tts.generation.duration", duration, {
      voice: voiceType,
    });
    metrics.increment("tts.generation.count", {
      voice: voiceType,
    });
  },

  /**
   * Record session creation metric
   */
  sessionCreation: (goal: string, duration: number) => {
    metrics.timing("session.creation.duration", duration, {
      goal,
    });
    metrics.increment("session.creation.count", {
      goal,
    });
  },

  /**
   * Record rate limit hit metric
   */
  rateLimitHit: (key: string, limit: number) => {
    metrics.increment("rate_limit.hit.count", {
      key: key.substring(0, 50),
      limit: limit.toString(),
    });
  },
};

