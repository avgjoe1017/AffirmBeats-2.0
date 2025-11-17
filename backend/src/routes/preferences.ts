import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetPreferencesResponse,
  updatePreferencesRequestSchema,
  type UpdatePreferencesRequest,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";
import { getCached, deleteCache } from "../lib/redis";
import { logger } from "../lib/logger";

const preferencesRouter = new Hono<AppType>();

// ============================================
// GET /api/preferences - Get user preferences
// ============================================
preferencesRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ 
      error: "UNAUTHORIZED",
      code: "UNAUTHORIZED",
      message: "Please sign in to access your preferences.",
    }, 401);
  }

  logger.info("Getting preferences", { userId: user.id });

  // Get or create preferences (with caching)
  const preferences = await getCached(
    `preferences:${user.id}`,
    async () => {
      let pref = await db.userPreferences.findUnique({
        where: { userId: user.id },
      });

      if (!pref) {
        logger.info("Creating default preferences", { userId: user.id });
        pref = await db.userPreferences.create({
          data: {
            userId: user.id,
            voice: "neutral",
            pace: "normal",
            noise: "rain",
            pronounStyle: "you",
            intensity: "gentle",
          },
        });
      }

      return pref;
    },
    3600 // Cache for 1 hour
  );

  return c.json({
    voice: preferences.voice as "neutral" | "confident" | "premium1" | "premium2" | "premium3" | "premium4" | "premium5" | "premium6" | "premium7" | "premium8",
    pace: preferences.pace as "slow" | "normal",
    noise: preferences.noise as "rain" | "brown" | "none",
    pronounStyle: preferences.pronounStyle as "you" | "i",
    intensity: preferences.intensity as "gentle" | "assertive",
  } satisfies GetPreferencesResponse);
});

// ============================================
// PATCH /api/preferences - Update user preferences
// ============================================
preferencesRouter.patch("/", zValidator("json", updatePreferencesRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ 
      error: "UNAUTHORIZED",
      code: "UNAUTHORIZED",
      message: "Please sign in to access your preferences.",
    }, 401);
  }

  const updates: UpdatePreferencesRequest = c.req.valid("json");
  logger.info("Updating preferences", { userId: user.id, updates });

  // Upsert preferences
  const preferences = await db.userPreferences.upsert({
    where: { userId: user.id },
    update: updates,
    create: {
      userId: user.id,
      voice: updates.voice ?? "neutral",
      pace: updates.pace ?? "normal",
      noise: updates.noise ?? "rain",
      pronounStyle: updates.pronounStyle ?? "you",
      intensity: updates.intensity ?? "gentle",
    },
  });

  // Invalidate cache
  await deleteCache(`preferences:${user.id}`);

  logger.info("Preferences updated", { userId: user.id });

  return c.json({
    voice: preferences.voice as "neutral" | "confident" | "premium1" | "premium2" | "premium3" | "premium4" | "premium5" | "premium6" | "premium7" | "premium8",
    pace: preferences.pace as "slow" | "normal",
    noise: preferences.noise as "rain" | "brown" | "none",
    pronounStyle: preferences.pronounStyle as "you" | "i",
    intensity: preferences.intensity as "gentle" | "assertive",
  } satisfies GetPreferencesResponse);
});

export { preferencesRouter };
