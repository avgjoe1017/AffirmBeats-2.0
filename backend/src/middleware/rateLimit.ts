/**
 * Rate Limiting Middleware
 * 
 * Simple in-memory rate limiter for protecting expensive endpoints.
 * For production, consider using Redis or a more robust solution.
 */

import type { Context, Next } from "hono";
import type { AppType } from "../types";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory store (clears on server restart)
// For production, use Redis or similar
const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    const record = store[key];
    if (record && record.resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

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
    const record = store[key];

    // Check if record exists and is still valid
    if (record && record.resetAt > now) {
      // Check if limit exceeded
      if (record.count >= limit) {
        const resetIn = Math.ceil((record.resetAt - now) / 1000);
        console.log(`⛔ [RateLimit] ${key} exceeded limit of ${limit} requests`);
        return c.json(
          {
            error: message || "Rate limit exceeded",
            message: `Too many requests. Please try again in ${resetIn} second${resetIn !== 1 ? "s" : ""}.`,
            retryAfter: resetIn,
          },
          429
        );
      }

      // Increment counter
      record.count++;
    } else {
      // Create new record or reset expired one
      store[key] = {
        count: 1,
        resetAt: now + windowMs,
      };
    }

    // Add rate limit headers (get fresh record after potential update)
    const currentRecord = store[key]!;
    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", Math.max(0, limit - currentRecord.count).toString());
    c.header("X-RateLimit-Reset", Math.ceil(currentRecord.resetAt / 1000).toString());

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

