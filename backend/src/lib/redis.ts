/**
 * Redis Client Utility
 * 
 * Provides Redis client for caching and rate limiting.
 * Falls back gracefully if Redis is not configured.
 */

import { env } from "../env";
import { logger } from "./logger";

// Dynamic import for metrics to avoid circular dependencies
let metricHelpers: typeof import("./metrics").metricHelpers | null = null;
async function getMetricHelpers() {
  if (!metricHelpers) {
    metricHelpers = (await import("./metrics")).metricHelpers;
  }
  return metricHelpers;
}

let redisClient: any = null;

/**
 * Initialize Redis client
 */
async function initRedis() {
  if (!env.REDIS_URL) {
    logger.warn("Redis URL not configured, Redis features will be disabled");
    return null;
  }

  try {
    // Dynamically import ioredis (only if Redis is configured)
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(env.REDIS_URL, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on("error", (error: Error) => {
      logger.error("Redis error", error);
    });

    redisClient.on("connect", () => {
      logger.info("Redis connected", { url: env.REDIS_URL });
    });

    redisClient.on("ready", () => {
      logger.info("Redis ready");
    });

    logger.info("Redis client initialized");
    return redisClient;
  } catch (error) {
    logger.error("Failed to initialize Redis", error);
    return null;
  }
}

/**
 * Get Redis client
 */
export async function getRedis() {
  if (!redisClient && env.REDIS_URL) {
    await initRedis();
  }
  return redisClient;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!env.REDIS_URL) {
    return false;
  }

  try {
    const client = await getRedis();
    if (!client) {
      return false;
    }
    await client.ping();
    return true;
  } catch (error) {
    logger.error("Redis availability check failed", error);
    return false;
  }
}

/**
 * Cache helper function
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  if (!env.REDIS_URL) {
    // If Redis is not configured, just fetch and return
    return fetcher();
  }

  try {
    const client = await getRedis();
    if (!client) {
      return fetcher();
    }

    // Try to get from cache
    const cached = await client.get(key);
    const helpers = await getMetricHelpers();
    if (cached) {
      logger.debug("Cache hit", { key });
      helpers.cacheOperation("hit", key);
      return JSON.parse(cached);
    }

    // Cache miss - fetch and cache
    logger.debug("Cache miss", { key });
    helpers.cacheOperation("miss", key);
    const data = await fetcher();
    await client.set(key, JSON.stringify(data), "EX", ttl);
    helpers.cacheOperation("set", key);
    return data;
  } catch (error) {
    logger.error("Redis cache error", error, { key });
    // Fallback to fetching without cache
    return fetcher();
  }
}

/**
 * Set cache value
 */
export async function setCache(key: string, value: unknown, ttl: number = 3600): Promise<void> {
  if (!env.REDIS_URL) {
    return;
  }

  try {
    const client = await getRedis();
    if (!client) {
      return;
    }

    await client.set(key, JSON.stringify(value), "EX", ttl);
    logger.debug("Cache set", { key, ttl });
    const helpers = await getMetricHelpers();
    helpers.cacheOperation("set", key);
  } catch (error) {
    logger.error("Redis cache set error", error, { key });
  }
}

/**
 * Delete cache value
 */
export async function deleteCache(key: string): Promise<void> {
  if (!env.REDIS_URL) {
    return;
  }

  try {
    const client = await getRedis();
    if (!client) {
      return;
    }

    await client.del(key);
    logger.debug("Cache deleted", { key });
    const helpers = await getMetricHelpers();
    helpers.cacheOperation("delete", key);
  } catch (error) {
    logger.error("Redis cache delete error", error, { key });
  }
}

/**
 * Delete cache by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!env.REDIS_URL) {
    return;
  }

  try {
    const client = await getRedis();
    if (!client) {
      return;
    }

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      logger.debug("Cache deleted by pattern", { pattern, count: keys.length });
      const helpers = await getMetricHelpers();
      for (const key of keys) {
        helpers.cacheOperation("delete", key);
      }
    }
  } catch (error) {
    logger.error("Redis cache delete pattern error", error, { pattern });
  }
}

/**
 * Initialize Redis on module load
 */
if (env.REDIS_URL) {
  initRedis().catch((error) => {
    logger.error("Failed to initialize Redis", error);
  });
}
