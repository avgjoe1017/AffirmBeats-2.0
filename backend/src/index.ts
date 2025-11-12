import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";

import { auth } from "./auth";
import { env } from "./env";
import { uploadRouter } from "./routes/upload";
import { sampleRouter } from "./routes/sample";
import { preferencesRouter } from "./routes/preferences";
import { sessionsRouter } from "./routes/sessions";
import { ttsRouter } from "./routes/tts";
import { subscription } from "./routes/subscription";
import { type AppType } from "./types";
import { resetMonthlyCounters } from "./utils/subscriptionReset";

// AppType context adds user and session to the context, will be null if the user or session is null
const app = new Hono<AppType>();

console.log("🔧 Initializing Hono application...");
app.use("*", logger());
app.use("/*", cors());

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

// Better Auth handler
// Handles all authentication endpoints: /api/auth/sign-in, /api/auth/sign-up, etc.
console.log("🔐 Mounting Better Auth handler at /api/auth/*");
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Serve uploaded images statically
// Files in uploads/ directory are accessible at /uploads/* URLs
console.log("📁 Serving static files from uploads/ directory");
app.use("/uploads/*", serveStatic({ root: "./" }));

// Mount route modules
console.log("📤 Mounting upload routes at /api/upload");
app.route("/api/upload", uploadRouter);

console.log("📝 Mounting sample routes at /api/sample");
app.route("/api/sample", sampleRouter);

console.log("⚙️  Mounting preferences routes at /api/preferences");
app.route("/api/preferences", preferencesRouter);

console.log("🎵 Mounting sessions routes at /api/sessions");
app.route("/api/sessions", sessionsRouter);

console.log("🎤 Mounting TTS routes at /api/tts");
app.route("/api/tts", ttsRouter);

console.log("💳 Mounting subscription routes at /api/subscription");
app.route("/api/subscription", subscription);

// Health check endpoint
// Used by load balancers and monitoring tools to verify service is running
app.get("/health", (c) => {
  console.log("💚 Health check requested");
  return c.json({ status: "ok" });
});

// Scheduled task endpoint for monthly subscription resets
// This should be called daily via cron job or scheduled task
// Example cron: 0 2 * * * curl http://localhost:3000/api/admin/reset-subscriptions
app.post("/api/admin/reset-subscriptions", async (c) => {
  // TODO: Add authentication/authorization check in production
  // For now, this is a simple endpoint that can be secured later
  
  try {
    const count = await resetMonthlyCounters();
    return c.json({ 
      success: true, 
      message: `Reset ${count} subscription counter(s)`,
      count 
    });
  } catch (error) {
    console.error("❌ [Admin] Failed to reset subscriptions:", error);
    return c.json({ 
      success: false, 
      message: "Failed to reset subscriptions",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

// Start the server
console.log("⚙️  Starting server...");
serve({ fetch: app.fetch, port: Number(env.PORT) }, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🚀 Server is running on port ${env.PORT}`);
  console.log(`🔗 Base URL: http://localhost:${env.PORT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📚 Available endpoints:");
  console.log("  🔐 Auth:         /api/auth/*");
  console.log("  📤 Upload:       POST /api/upload/image");
  console.log("  📝 Sample:       GET/POST /api/sample");
  console.log("  ⚙️  Preferences:  GET/PATCH /api/preferences");
  console.log("  🎵 Sessions:     GET/POST /api/sessions");
  console.log("  🎤 TTS:          POST /api/tts/generate");
  console.log("  💳 Subscription: GET/POST /api/subscription");
  console.log("  💚 Health:       GET /health");
  console.log("  🔄 Admin:         POST /api/admin/reset-subscriptions");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
