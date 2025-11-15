/**
 * AWS CloudWatch Metrics Integration
 * 
 * Sends metrics to AWS CloudWatch.
 * 
 * Usage:
 *   import { initCloudWatchMetrics } from "./lib/metrics/cloudwatch";
 *   await initCloudWatchMetrics();
 */

import { metrics } from "../metrics";
import { logger } from "../logger";
import { env } from "../../env";

let cloudwatchClient: any = null;
let cloudwatchEnabled = false;
let cloudwatchNamespace = "AffirmBeats";

/**
 * Initialize CloudWatch metrics client
 */
export async function initCloudWatchMetrics() {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    logger.warn("AWS credentials not configured, CloudWatch metrics disabled");
    return;
  }

  try {
    // Try to use @aws-sdk/client-cloudwatch (recommended)
    try {
      const { CloudWatchClient, PutMetricDataCommand } = await import("@aws-sdk/client-cloudwatch");
      
      cloudwatchClient = new CloudWatchClient({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });
      
      cloudwatchNamespace = env.CLOUDWATCH_NAMESPACE;
      cloudwatchEnabled = true;
      logger.info("CloudWatch metrics initialized", { 
        region: env.AWS_REGION,
        namespace: cloudwatchNamespace,
      });

      // Set up periodic metric flushing
      setInterval(async () => {
        await flushCloudWatchMetrics();
      }, 60000); // Flush every minute

      return cloudwatchClient;
    } catch (importError) {
      // Fallback to aws-sdk v2 if @aws-sdk/client-cloudwatch is not installed
      logger.warn("@aws-sdk/client-cloudwatch not found, trying aws-sdk v2");
      const { CloudWatch } = await import("aws-sdk");
      
      cloudwatchClient = new CloudWatch({
        region: env.AWS_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      });
      
      cloudwatchNamespace = env.CLOUDWATCH_NAMESPACE;
      cloudwatchEnabled = true;
      logger.info("CloudWatch metrics initialized (using aws-sdk v2)", { 
        region: env.AWS_REGION,
        namespace: cloudwatchNamespace,
      });

      // Set up periodic metric flushing
      setInterval(async () => {
        await flushCloudWatchMetricsV2();
      }, 60000); // Flush every minute

      return cloudwatchClient;
    }
  } catch (error) {
    logger.error("Failed to initialize CloudWatch metrics", error);
    cloudwatchEnabled = false;
  }
}

/**
 * Flush metrics to CloudWatch (using @aws-sdk/client-cloudwatch)
 */
async function flushCloudWatchMetrics() {
  if (!cloudwatchEnabled || !cloudwatchClient) {
    return;
  }

  try {
    const { PutMetricDataCommand } = await import("@aws-sdk/client-cloudwatch");
    const allMetrics = metrics.getAllMetrics();
    const metricsByName = metrics.getMetricsByName();

    // Convert metrics to CloudWatch format
    const metricData: Array<{
      MetricName: string;
      Value: number;
      Unit: string;
      Timestamp: Date;
      Dimensions?: Array<{ Name: string; Value: string }>;
    }> = [];

    for (const [name, metricList] of Object.entries(metricsByName)) {
      if (metricList.length === 0) continue;

      // Group metrics by tags
      const metricsByTags = new Map<string, Array<{ timestamp: number; value: number }>>();

      for (const metric of metricList) {
        const tagString = metric.tags
          ? Object.entries(metric.tags)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => `${key}:${value}`)
              .join(",")
          : "";

        if (!metricsByTags.has(tagString)) {
          metricsByTags.set(tagString, []);
        }

        metricsByTags.get(tagString)!.push({
          timestamp: metric.timestamp,
          value: metric.value,
        });
      }

      // Create metric data for each tag combination
      for (const [tagString, metricValues] of metricsByTags.entries()) {
        // Use the latest value for gauges, sum for counters
        const isCounter = name.includes(".count") || name.includes("_count");
        const metricValue = isCounter
          ? metricValues.reduce((a, b) => a + b.value, 0)
          : metricValues[metricValues.length - 1].value;

        const dimensions = tagString
          ? tagString.split(",").map((tag) => {
              const [key, value] = tag.split(":");
              return { Name: key, Value: value };
            })
          : undefined;

        // Determine unit
        const unit = name.includes(".duration") || name.includes("_duration")
          ? "Milliseconds"
          : isCounter
          ? "Count"
          : "None";

        metricData.push({
          MetricName: name.replace(/\./g, "_"), // CloudWatch uses underscores
          Value: metricValue,
          Unit: unit,
          Timestamp: new Date(metricValues[metricValues.length - 1].timestamp),
          Dimensions: dimensions,
        });
      }
    }

    if (metricData.length === 0) {
      return;
    }

    // CloudWatch allows up to 20 metrics per request
    const chunks = [];
    for (let i = 0; i < metricData.length; i += 20) {
      chunks.push(metricData.slice(i, i + 20));
    }

    // Send metrics in chunks
    for (const chunk of chunks) {
      const command = new PutMetricDataCommand({
        Namespace: cloudwatchNamespace,
        MetricData: chunk,
      });
      
      await cloudwatchClient.send(command);
    }

    logger.debug("Metrics sent to CloudWatch", { count: metricData.length });
  } catch (error) {
    logger.error("Error flushing metrics to CloudWatch", error);
  }
}

/**
 * Flush metrics to CloudWatch (using aws-sdk v2)
 */
async function flushCloudWatchMetricsV2() {
  if (!cloudwatchEnabled || !cloudwatchClient) {
    return;
  }

  try {
    const allMetrics = metrics.getAllMetrics();
    const metricsByName = metrics.getMetricsByName();

    // Convert metrics to CloudWatch format
    const metricData: Array<{
      MetricName: string;
      Value: number;
      Unit: string;
      Timestamp: Date;
      Dimensions?: Array<{ Name: string; Value: string }>;
    }> = [];

    for (const [name, metricList] of Object.entries(metricsByName)) {
      if (metricList.length === 0) continue;

      // Group metrics by tags
      const metricsByTags = new Map<string, Array<{ timestamp: number; value: number }>>();

      for (const metric of metricList) {
        const tagString = metric.tags
          ? Object.entries(metric.tags)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => `${key}:${value}`)
              .join(",")
          : "";

        if (!metricsByTags.has(tagString)) {
          metricsByTags.set(tagString, []);
        }

        metricsByTags.get(tagString)!.push({
          timestamp: metric.timestamp,
          value: metric.value,
        });
      }

      // Create metric data for each tag combination
      for (const [tagString, metricValues] of metricsByTags.entries()) {
        // Use the latest value for gauges, sum for counters
        const isCounter = name.includes(".count") || name.includes("_count");
        const metricValue = isCounter
          ? metricValues.reduce((a, b) => a + b.value, 0)
          : metricValues[metricValues.length - 1].value;

        const dimensions = tagString
          ? tagString.split(",").map((tag) => {
              const [key, value] = tag.split(":");
              return { Name: key, Value: value };
            })
          : undefined;

        // Determine unit
        const unit = name.includes(".duration") || name.includes("_duration")
          ? "Milliseconds"
          : isCounter
          ? "Count"
          : "None";

        metricData.push({
          MetricName: name.replace(/\./g, "_"), // CloudWatch uses underscores
          Value: metricValue,
          Unit: unit,
          Timestamp: new Date(metricValues[metricValues.length - 1].timestamp),
          Dimensions: dimensions,
        });
      }
    }

    if (metricData.length === 0) {
      return;
    }

    // CloudWatch allows up to 20 metrics per request
    const chunks = [];
    for (let i = 0; i < metricData.length; i += 20) {
      chunks.push(metricData.slice(i, i + 20));
    }

    // Send metrics in chunks
    for (const chunk of chunks) {
      await new Promise<void>((resolve, reject) => {
        cloudwatchClient.putMetricData(
          {
            Namespace: cloudwatchNamespace,
            MetricData: chunk,
          },
          (err: Error | null) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }

    logger.debug("Metrics sent to CloudWatch", { count: metricData.length });
  } catch (error) {
    logger.error("Error flushing metrics to CloudWatch", error);
  }
}

/**
 * Check if CloudWatch is enabled
 */
export function isCloudWatchEnabled(): boolean {
  return cloudwatchEnabled;
}

