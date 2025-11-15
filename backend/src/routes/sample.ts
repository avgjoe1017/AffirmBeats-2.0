import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetSampleResponse,
  postSampleRequestSchema,
  type PostSampleResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { logger } from "../lib/logger";

// Sample routes demonstrating common patterns
// These serve as examples for building your own API endpoints
const sampleRouter = new Hono<AppType>();

// ============================================
// GET /api/sample - Public endpoint
// ============================================
// Example of a simple public endpoint that anyone can access
// No authentication required
sampleRouter.get("/", (c) => {
  logger.debug("Public sample endpoint accessed");
  return c.json({ message: "Hello, world!" } satisfies GetSampleResponse);
});

// ============================================
// GET /api/sample/protected - Protected endpoint
// ============================================
// Example of a protected endpoint that requires authentication
// Returns 401 if user is not logged in
sampleRouter.get("/protected", (c) => {
  const user = c.get("user");
  logger.debug("Protected sample endpoint accessed", { userId: user?.id || "anonymous" });

  if (!user) {
    logger.warn("Unauthorized access attempt to protected endpoint", { 
      endpoint: "/api/sample/protected" 
    });
    return c.json({ 
      error: "UNAUTHORIZED",
      code: "UNAUTHORIZED",
      message: "Unauthorized" 
    }, 401);
  }

  logger.info("Authorized access to protected endpoint", { 
    userId: user.id,
    userEmail: user.email 
  });
  return c.json({ message: "Hello, world!" } satisfies GetSampleResponse);
});

// ============================================
// POST /api/sample - Sample POST with validation
// ============================================
// Example of a POST endpoint with Zod validation
// Request body must match postSampleRequestSchema
// Try sending: { "value": "ping" } to get "pong" response
sampleRouter.post("/", zValidator("json", postSampleRequestSchema), async (c) => {
  const { value } = c.req.valid("json"); // Fully type-safe input value
  const user = c.get("user");
  
  logger.info("Sample POST request received", { 
    value,
    userId: user?.id || "anonymous" 
  });

  if (value === "ping") {
    logger.debug("Ping-pong response triggered", { userId: user?.id || "anonymous" });
    return c.json({ message: "pong" });
  }

  logger.debug("Returning default response", { userId: user?.id || "anonymous" });
  return c.json({ message: "Hello, world!" } satisfies PostSampleResponse);
});

export { sampleRouter };
