import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  type GetPreferencesResponse,
  updatePreferencesRequestSchema,
  type UpdatePreferencesRequest,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";

const preferencesRouter = new Hono<AppType>();

// ============================================
// GET /api/preferences - Get user preferences
// ============================================
preferencesRouter.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  console.log(`📋 [Preferences] Getting preferences for user: ${user.id}`);

  // Get or create preferences
  let preferences = await db.userPreferences.findUnique({
    where: { userId: user.id },
  });

  if (!preferences) {
    console.log(`📝 [Preferences] Creating default preferences for user: ${user.id}`);
    preferences = await db.userPreferences.create({
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

  return c.json({
    voice: preferences.voice as "neutral" | "confident" | "whisper",
    pace: preferences.pace as "slow" | "normal" | "fast",
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
    return c.json({ message: "Unauthorized" }, 401);
  }

  const updates = c.req.valid("json");
  console.log(`📝 [Preferences] Updating preferences for user: ${user.id}`, updates);

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

  return c.json({
    voice: preferences.voice as "neutral" | "confident" | "whisper",
    pace: preferences.pace as "slow" | "normal" | "fast",
    noise: preferences.noise as "rain" | "brown" | "none",
    pronounStyle: preferences.pronounStyle as "you" | "i",
    intensity: preferences.intensity as "gentle" | "assertive",
  } satisfies GetPreferencesResponse);
});

export { preferencesRouter };
