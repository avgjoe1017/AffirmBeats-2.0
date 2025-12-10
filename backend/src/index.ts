import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";

import { auth } from "./auth";
import { env } from "./env";
import { uploadRouter } from "./routes/upload";
import { sampleRouter } from "./routes/sample";
import { preferencesRouter } from "./routes/preferences";
import { sessionsRouter, seedDefaultSessions } from "./routes/sessions";
import { ttsRouter } from "./routes/tts";
import { subscription } from "./routes/subscription";
import { audioRouter } from "./routes/audio";
import { metricsRouter } from "./routes/metrics";
import { adminRouter } from "./routes/admin";
import { webhooks } from "./routes/webhooks";
import { legal } from "./routes/legal";
import { type AppType } from "./types";
import { resetMonthlyCounters } from "./utils/subscriptionReset";
import { logger } from "./lib/logger";
import { initSentry } from "./lib/sentry";
import { isRedisAvailable } from "./lib/redis";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { metricsMiddleware } from "./middleware/metricsMiddleware";
import { adminAuth } from "./middleware/adminAuth";
import { isSupabaseConfigured, getSupabaseClient } from "./lib/supabase";

// AppType context adds user and session to the context, will be null if the user or session is null
export const app = new Hono<AppType>();

// Initialize Sentry if configured
initSentry().catch((error) => {
  logger.error("Failed to initialize Sentry", error);
});

// Initialize production metrics integrations if configured
if (env.NODE_ENV === "production" || env.NODE_ENV === "staging") {
  // Initialize DataDog metrics if configured
  if (env.DATADOG_API_KEY) {
    import("./lib/metrics/datadog")
      .then(({ initDataDogMetrics }) => initDataDogMetrics())
      .catch((error) => {
        logger.error("Failed to initialize DataDog metrics", error);
      });
  }

  // Initialize CloudWatch metrics if configured
  if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
    import("./lib/metrics/cloudwatch")
      .then(({ initCloudWatchMetrics }) => initCloudWatchMetrics())
      .catch((error) => {
        logger.error("Failed to initialize CloudWatch metrics", error);
      });
  }
}

logger.info("Initializing Hono application");
app.use("*", honoLogger());
// CORS configuration - allow all origins for development, including network IPs
app.use("/*", cors({
  origin: "*", // Allow all origins (for development)
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  exposeHeaders: ["Content-Type"],
  credentials: true,
}));

// Request logger middleware (before routes for timing)
app.use("*", requestLogger);

// Metrics middleware (before routes for timing)
app.use("*", metricsMiddleware);

/** Authentication middleware
 * Extracts session from request headers and attaches user/session to context
 * All routes can access c.get("user") and c.get("session")
 */
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null); // type: typeof auth.$Infer.Session.user | null
  c.set("session", session?.session ?? null); // type: typeof auth.$Infer.Session.session | null
  return next();
});

// Error handler (must be registered after routes but before server starts)
// This will catch all errors that occur in routes
app.onError(errorHandler);

// Better Auth handler
// Handles all authentication endpoints: /api/auth/sign-in, /api/auth/sign-up, etc.
logger.info("Mounting Better Auth handler at /api/auth/*");
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Serve uploaded images statically
// Files in uploads/ directory are accessible at /uploads/* URLs
logger.info("Serving static files from uploads/ directory");
app.use("/uploads/*", serveStatic({ root: "./" }));

// Serve admin dashboard HTML pages (protected with adminAuth)
function serveAdminPage(page: string) {
  return async (c: any) => {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      
      // Get backend directory (one level up from src)
      let backendDir: string;
      if (typeof import.meta !== "undefined" && "dir" in import.meta && import.meta.dir) {
        // Bun: import.meta.dir points to backend/src
        backendDir = path.join(import.meta.dir, "..");
      } else if (typeof __dirname !== "undefined") {
        // Node.js: __dirname points to backend/src
        backendDir = path.join(__dirname, "..");
      } else {
        // Fallback
        backendDir = process.cwd();
      }
      
      const filePath = path.join(backendDir, "public", `admin-${page}.html`);
      const html = await fs.readFile(filePath, "utf-8");
      return c.html(html);
    } catch (error) {
      logger.error(`Failed to serve admin ${page} page`, error);
      return c.text(`Admin ${page} page not found`, 404);
    }
  };
}

logger.info("Serving admin pages at /admin (protected)");
// Login page (no auth required)
app.get("/admin/login", serveAdminPage("login"));
// Protected admin pages
app.get("/admin", adminAuth, serveAdminPage("dashboard"));
app.get("/admin/affirmations", adminAuth, serveAdminPage("affirmations"));
app.get("/admin/users", adminAuth, serveAdminPage("users"));
app.get("/admin/logs", adminAuth, serveAdminPage("logs"));
app.get("/admin/templates", adminAuth, serveAdminPage("templates"));
app.get("/admin/default-sessions", adminAuth, serveAdminPage("default-sessions"));
app.get("/admin/voice-settings", adminAuth, serveAdminPage("voice-settings"));
app.get("/admin/config", adminAuth, serveAdminPage("config"));

// Mount route modules
logger.info("Mounting upload routes at /api/upload");
app.route("/api/upload", uploadRouter);

logger.info("Mounting sample routes at /api/sample");
app.route("/api/sample", sampleRouter);

logger.info("Mounting preferences routes at /api/preferences");
app.route("/api/preferences", preferencesRouter);

logger.info("Mounting sessions routes at /api/sessions");
app.route("/api/sessions", sessionsRouter);

logger.info("Mounting TTS routes at /api/tts");
app.route("/api/tts", ttsRouter);

logger.info("Mounting subscription routes at /api/subscription");
app.route("/api/subscription", subscription);

logger.info("Mounting audio routes at /api/audio");
app.route("/api/audio", audioRouter);

logger.info("Mounting metrics routes at /api/metrics");
app.route("/api/metrics", metricsRouter);

logger.info("Mounting admin routes at /api/admin");
app.route("/api/admin", adminRouter);

logger.info("Mounting webhook routes at /api/webhooks");
app.route("/api/webhooks", webhooks);

logger.info("Mounting legal routes at /api/legal");
app.route("/api/legal", legal);

// Health check endpoint
// Used by load balancers and monitoring tools to verify service is running
app.get("/health", async (c) => {
  logger.debug("Health check requested");
  
  const startTime = Date.now();
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "unknown",
    uptime: process.uptime(),
    checks: {
      database: "unknown",
      redis: "unknown",
      supabase: "unknown",
      // Add more checks as needed (external APIs, etc.)
    },
    metrics: {
      // Basic metrics snapshot
      totalRequests: 0,
      errorRate: 0,
    },
  };

  try {
    // Check database connectivity
    const { db } = await import("./db");
    const dbStartTime = Date.now();
    // Use a simple query to test connectivity
    if (env.DATABASE_URL.startsWith("file:")) {
      // SQLite
      await db.$queryRawUnsafe("SELECT 1");
    } else {
      // PostgreSQL or other
      await db.$queryRaw`SELECT 1`;
    }
    const dbDuration = Date.now() - dbStartTime;
    health.checks.database = "ok";
    logger.debug("Database health check passed", { duration: `${dbDuration}ms` });
  } catch (error) {
    logger.error("Database health check failed", error);
    health.checks.database = "error";
    health.status = "degraded";
  }

  // Check Redis connectivity
  try {
    const redisStartTime = Date.now();
    const redisAvailable = await isRedisAvailable();
    const redisDuration = Date.now() - redisStartTime;
    health.checks.redis = redisAvailable ? "ok" : "unavailable";
    logger.debug("Redis health check completed", { 
      available: redisAvailable, 
      duration: `${redisDuration}ms` 
    });
  } catch (error) {
    logger.error("Redis health check failed", error);
    health.checks.redis = "error";
    // Don't degrade status if Redis is unavailable (it's optional)
  }

  // Check Supabase Storage connectivity
  try {
    if (isSupabaseConfigured()) {
      const supabaseStartTime = Date.now();
      const supabase = getSupabaseClient();
      if (supabase) {
        // Test access to one bucket to verify connectivity
        const { error } = await supabase.storage
          .from("binaural")
          .list("", { limit: 1 });
        
        const supabaseDuration = Date.now() - supabaseStartTime;
        if (!error) {
          health.checks.supabase = "ok";
          logger.debug("Supabase health check passed", { duration: `${supabaseDuration}ms` });
        } else {
          health.checks.supabase = "error";
          health.status = "degraded";
          logger.warn("Supabase health check failed", { error: error.message });
        }
      } else {
        health.checks.supabase = "unavailable";
        health.status = "degraded";
      }
    } else {
      health.checks.supabase = "not_configured";
      // Don't degrade status if Supabase is not configured (it's optional with fallback)
    }
  } catch (error) {
    logger.error("Supabase health check failed", error);
    health.checks.supabase = "error";
    health.status = "degraded";
    // Degrade status since Supabase is important for audio delivery
  }

  // Add basic metrics snapshot
  try {
    const { metrics } = await import("./lib/metrics");
    const apiRequestStats = metrics.getSummary("api.request.count");
    const apiErrorStats = metrics.getSummary("api.error.count");
    
    if (apiRequestStats) {
      health.metrics.totalRequests = apiRequestStats.count;
    }
    
    if (apiRequestStats && apiErrorStats) {
      health.metrics.errorRate = apiErrorStats.count / apiRequestStats.count;
    }
  } catch (error) {
    logger.debug("Failed to get metrics snapshot", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't fail health check if metrics are unavailable
  }

  const duration = Date.now() - startTime;
  logger.debug("Health check completed", { 
    status: health.status, 
    duration: `${duration}ms` 
  });

  const statusCode = health.status === "ok" ? 200 : 503;
  return c.json(health, statusCode);
});

// Scheduled task endpoint for monthly subscription resets
// This should be called daily via cron job or scheduled task
// Example cron: 0 2 * * * curl http://localhost:3000/api/admin/reset-subscriptions
app.post("/api/admin/reset-subscriptions", async (c) => {
  // TODO: Add authentication/authorization check in production
  // For now, this is a simple endpoint that can be secured later
  
  try {
    const count = await resetMonthlyCounters();
    logger.info("Monthly subscription counters reset", { count });
    return c.json({ 
      success: true, 
      message: `Reset ${count} subscription counter(s)`,
      count 
    });
  } catch (error) {
    logger.error("Failed to reset subscription counters", error);
    return c.json({ 
      success: false, 
      message: "Failed to reset subscriptions",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Start the server (skip when running tests)
if (!process.env.VITEST) {
  logger.info("Starting server", { port: env.PORT, environment: env.NODE_ENV });
  
  // Use Bun's native server for better network binding support
  // This ensures the server is accessible on all network interfaces (0.0.0.0)
  const port = Number(env.PORT);
  
  // Check if we're running in Bun (which has better network binding)
  if (typeof Bun !== "undefined") {
    // Use Bun.serve for native network binding
    Bun.serve({
      fetch: app.fetch,
      port: port,
      hostname: "0.0.0.0", // Listen on all network interfaces
    });
    
    // Get network IP addresses for logging (async, fire-and-forget)
    (async () => {
      try {
        const os = await import("os");
        const networkInterfaces = os.networkInterfaces();
        const networkIPs: string[] = [];
        for (const interfaceName of Object.keys(networkInterfaces)) {
          const addresses = networkInterfaces[interfaceName];
          if (addresses) {
            for (const addr of addresses) {
              if (addr.family === "IPv4" && !addr.internal) {
                networkIPs.push(addr.address);
              }
            }
          }
        }
        
        logger.info("Server started successfully (Bun native)", {
          port: env.PORT,
          environment: env.NODE_ENV,
          localhost: `http://localhost:${env.PORT}`,
          networkIPs: networkIPs.map(ip => `http://${ip}:${env.PORT}`),
          networkAccessible: true,
          hostname: "0.0.0.0",
        });
        
        // Seed default sessions after server starts
        await seedDefaultSessions();
      } catch {
        logger.info("Server started successfully (Bun native)", {
          port: env.PORT,
          environment: env.NODE_ENV,
          localhost: `http://localhost:${env.PORT}`,
          networkAccessible: true,
          hostname: "0.0.0.0",
        });
        
        // Seed default sessions after server starts
        await seedDefaultSessions();
      }
    })();
    
    // Log available endpoints in development
    if (env.NODE_ENV === "development") {
      logger.debug("Available endpoints", {
        auth: "/api/auth/*",
        upload: "POST /api/upload/image",
        sample: "GET/POST /api/sample",
        preferences: "GET/PATCH /api/preferences",
        sessions: "GET/POST /api/sessions",
        tts: "POST /api/tts/generate",
        subscription: "GET/POST /api/subscription",
        health: "GET /health",
        admin: "POST /api/admin/reset-subscriptions",
      });
    }
  } else {
    // Fallback to @hono/node-server for Node.js
    serve({ 
      fetch: app.fetch, 
      port: port,
      // @hono/node-server may not support hostname, but try it
      ...(typeof (serve as any).hostname !== "undefined" ? { hostname: "0.0.0.0" } : {}),
    }, () => {
      logger.info("Server started successfully (Node.js)", {
        port: env.PORT,
        environment: env.NODE_ENV,
        baseUrl: `http://localhost:${env.PORT}`,
        networkAccessible: true,
      });
      
      // Log available endpoints in development
      if (env.NODE_ENV === "development") {
        logger.debug("Available endpoints", {
          auth: "/api/auth/*",
          upload: "POST /api/upload/image",
          sample: "GET/POST /api/sample",
          preferences: "GET/PATCH /api/preferences",
          sessions: "GET/POST /api/sessions",
          tts: "POST /api/tts/generate",
          subscription: "GET/POST /api/subscription",
          health: "GET /health",
          admin: "POST /api/admin/reset-subscriptions",
        });
      }
    });
  }
}
