/**
 * Rate Limiting Middleware
 * 
 * Rate limiter using Redis for production, with in-memory fallback.
 * Automatically uses Redis if available, falls back to in-memory store if not.
 */

import type { Context, Next } from "hono";
import type { AppType } from "../types";
import { getRedis, isRedisAvailable } from "../lib/redis";
import { logger } from "../lib/logger";
import { metricHelpers } from "../lib/metrics";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (fallback if Redis is not available)
const inMemoryStore: RateLimitStore = {};

// Clean up old entries every 5 minutes (only for in-memory store)
setInterval(() => {
  const now = Date.now();
  Object.keys(inMemoryStore).forEach((key) => {
    const record = inMemoryStore[key];
    if (record && record.resetAt < now) {
      delete inMemoryStore[key];
    }
  });
}, 5 * 60 * 1000);

// Note: Redis rate limiting functions are now inline in the rateLimit middleware
// This simplifies the implementation and reduces function calls

/**
 * Rate limit middleware factory
 * 
 * @param options Rate limit configuration
 * @returns Hono middleware function
 */
export function rateLimit(options: {
  windowMs: number; // Time window in milliseconds
  limit: number; // Max requests per window
  keyGenerator?: (c: Context<AppType>) => string; // Custom key generator
  message?: string; // Custom error message
}) {
  const { windowMs, limit, keyGenerator, message } = options;

  return async (c: Context<AppType>, next: Next) => {
    // Generate key for this request
    const key = keyGenerator
      ? keyGenerator(c)
      : c.get("user")?.id || c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "anonymous";

    const now = Date.now();
    const useRedis = await isRedisAvailable();
    let record: { count: number; resetAt: number } | null = null;
    let currentCount = 0;

    if (useRedis) {
      // Use Redis for rate limiting
      try {
        const redis = await getRedis();
        if (redis) {
          const redisKey = `ratelimit:${key}`;
          const ttl = Math.ceil(windowMs / 1000);
          
          // Try to get existing record
          const data = await redis.get(redisKey);
          if (data) {
            record = JSON.parse(data);
          }

          if (!record || record.resetAt <= now) {
            // Create new record or reset expired one
            record = {
              count: 1,
              resetAt: now + windowMs,
            };
            await redis.set(redisKey, JSON.stringify(record), "EX", ttl);
            currentCount = 1;
          } else {
            // Increment counter and update record
            currentCount = record.count + 1;
            record.count = currentCount;
            
            // Update record in Redis
            await redis.set(redisKey, JSON.stringify(record), "EX", ttl);
          }
        }
      } catch (error) {
        logger.error("Redis rate limit error, falling back to in-memory", error, { key });
        // Fall through to in-memory fallback
      }
    }

    // Fallback to in-memory store if Redis is not available or failed
    if (!useRedis || !record) {
      record = inMemoryStore[key] ?? null;
      
      if (!record || record.resetAt <= now) {
        // Create new record or reset expired one
        record = {
          count: 1,
          resetAt: now + windowMs,
        };
        inMemoryStore[key] = record;
        currentCount = 1;
      } else {
        // Increment counter
        record.count++;
        currentCount = record.count;
      }
    }

        // Check if limit exceeded
        if (currentCount > limit) {
          const resetIn = Math.ceil((record.resetAt - now) / 1000);
          logger.warn("Rate limit exceeded", { key, limit, currentCount, resetIn });
          metricHelpers.rateLimitHit(key, limit);
          return c.json(
            {
              error: message || "Rate limit exceeded",
              code: "RATE_LIMIT_EXCEEDED",
              message: `Too many requests. Please try again in ${resetIn} second${resetIn !== 1 ? "s" : ""}.`,
              retryAfter: resetIn,
            },
            429
          );
        }

    // Add rate limit headers
    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", Math.max(0, limit - currentCount).toString());
    c.header("X-RateLimit-Reset", Math.ceil(record.resetAt / 1000).toString());

    await next();
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // TTS endpoints - expensive, limit heavily
  tts: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // 10 requests per 15 minutes
    keyGenerator: (c) => {
      const user = c.get("user");
      return user ? `tts:user:${user.id}` : `tts:ip:${c.req.header("x-forwarded-for") || "unknown"}`;
    },
    message: "TTS rate limit exceeded. Please wait before generating more audio.",
  }),

  // OpenAI endpoints - very expensive, limit heavily
  openai: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20, // 20 requests per hour
    keyGenerator: (c) => {
      const user = c.get("user");
      return user ? `openai:user:${user.id}` : `openai:ip:${c.req.header("x-forwarded-for") || "unknown"}`;
    },
    message: "AI generation rate limit exceeded. Please wait before generating more sessions.",
  }),

  // General API endpoints - moderate limit
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // 100 requests per 15 minutes
    keyGenerator: (c) => {
      const user = c.get("user");
      return user ? `api:user:${user.id}` : `api:ip:${c.req.header("x-forwarded-for") || "unknown"}`;
    },
    message: "API rate limit exceeded. Please slow down your requests.",
  }),
};

