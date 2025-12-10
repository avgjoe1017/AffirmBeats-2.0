import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { rateLimiters } from "../middleware/rateLimit";
import {
  generateCacheKey,
  hasCachedAudio,
  getCachedAudio,
  saveCachedAudio,
} from "../utils/ttsCache";
import {
  getCachedAffirmationAudio,
} from "../utils/affirmationAudio";
import { logger } from "../lib/logger";
import { metricHelpers } from "../lib/metrics";
import { env } from "../env";
import { db } from "../db";
import { isSupabaseConfigured, getSignedUrl, STORAGE_BUCKETS } from "../lib/supabase";

const ttsRouter = new Hono<AppType>();

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Voice ID mapping for different voice types
const VOICE_IDS = {
  neutral: "ZqvIIuD5aI9JFejebHiH", // Mira (F) - Meditation, Calming Down, Relaxing
  confident: "xGDJhCwcqw94ypljc95Z", // Archer (M) - Guided Meditation & Narration
  premium1: "qxTFXDYbGcR8GaHSjczg", // James (M)
  premium2: "BpjGufoPiobT79j2vtj4", // Priyanka (F)
  premium3: "eUdJpUEN3EslrgE24PKx", // Rhea (F)
  premium4: "7JxUWWyYwXK8kmqmKEnT", // Chuck (M)
  premium5: "wdymxIQkYn7MJCYCQF2Q", // Zara (F)
  premium6: "zA6D7RyKdc2EClouEMkP", // Almee (F)
  premium7: "KGZeK6FsnWQdrkDHnDNA", // Kristen (F)
  premium8: "wgHvco1wiREKN0BdyVx5", // Drew (M)
};

// Premium voices that require Pro subscription
const PREMIUM_VOICES = ["premium1", "premium2", "premium3", "premium4", "premium5", "premium6", "premium7", "premium8"];

/**
 * Goal-based voice configuration
 * Different voice settings optimized for each goal type
 */
const VOICE_CONFIG_BY_GOAL = {
  sleep: {
    stability: 0.80,        // Most stable
    similarity_boost: 0.60, // Natural
    style: 0.0,
    speed: 0.75,            // Slower for sleep (ElevenLabs min: 0.7)
    use_speaker_boost: true
  },
  calm: {
    stability: 0.75,
    similarity_boost: 0.65,
    style: 0.0,
    speed: 0.70,            // Slower for calm
    use_speaker_boost: true
  },
  focus: {
    stability: 0.72,
    similarity_boost: 0.68,
    style: 0.0,
    speed: 0.75,            // Moderate for focus
    use_speaker_boost: true
  },
  manifest: {
    stability: 0.70,
    similarity_boost: 0.70,
    style: 0.0,
    speed: 0.80,            // Slightly faster for manifest
    use_speaker_boost: true
  }
} as const;

/**
 * Get voice settings for a given goal
 * Falls back to default settings if goal is not provided or invalid
 */
function getVoiceSettings(goal?: string, pace?: "slow" | "normal") {
  // Default settings (used if goal is not provided or invalid)
  const defaultSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    speed: pace === "slow" ? 0.85 : 1.0,
  };

  // If no goal provided, use defaults
  if (!goal || !(goal in VOICE_CONFIG_BY_GOAL)) {
    return defaultSettings;
  }

  // Get goal-specific config
  const goalConfig = VOICE_CONFIG_BY_GOAL[goal as keyof typeof VOICE_CONFIG_BY_GOAL];
  
  // Apply pace adjustment to goal-based speed
  // Goal configs have base speeds, but we still respect pace preference
  // For pace "slow", reduce speed by ~10%, for "normal" use goal speed
  // Ensure speed stays within ElevenLabs limits (0.7 - 1.2)
  const paceMultiplier = pace === "slow" ? 0.90 : 1.0;
  const adjustedSpeed = Math.max(0.7, Math.min(1.2, goalConfig.speed * paceMultiplier));

  // Return only parameters supported by ElevenLabs API
  // Supported: stability, similarity_boost, speed
  // Note: style and use_speaker_boost are not supported by the API
  return {
    stability: goalConfig.stability,
    similarity_boost: goalConfig.similarity_boost,
    speed: adjustedSpeed,
  };
}

/**
 * Check if user has access to a premium voice
 * Default sessions (starting with "default-") always have access to premium voices
 */
async function canUsePremiumVoice(userId: string | null, sessionId?: string): Promise<boolean> {
  // Default sessions always have access to premium voices
  if (sessionId && sessionId.startsWith("default-")) {
    return true;
  }

  if (!userId) {
    return false; // Guest users can't use premium voices (except for default sessions)
  }

  const subscription = await db.userSubscription.findUnique({
    where: { userId },
  });

  return subscription?.tier === "pro";
}

// Request schema
const generateTTSRequestSchema = z.object({
  text: z.string().min(1),
  voiceType: z.enum(["neutral", "confident", "premium1", "premium2", "premium3", "premium4", "premium5", "premium6", "premium7", "premium8"]),
});

/**
 * POST /api/tts/generate
 * Generate text-to-speech audio using ElevenLabs
 */
ttsRouter.post("/generate", rateLimiters.tts, zValidator("json", generateTTSRequestSchema), async (c) => {
  if (!ELEVENLABS_API_KEY) {
    return c.json({ 
      error: "TTS_ERROR",
      code: "TTS_ERROR",
      message: "Text-to-speech service is temporarily unavailable. Please try again later.",
    }, 503);
  }

  const { text, voiceType } = c.req.valid("json");
  
  // Check premium voice access
  // Note: sessionId is not available in this endpoint, but default sessions
  // should be handled via the playlist endpoint which calls generateAffirmationAudio
  if (PREMIUM_VOICES.includes(voiceType)) {
    const session = c.get("session");
    const userId = session?.userId ?? null;
    // Try to get sessionId from request body if available (for generate-session)
    const body = c.req.valid("json") as any;
    const sessionId = body?.sessionId || null;
    const hasAccess = await canUsePremiumVoice(userId, sessionId);
    
    if (!hasAccess) {
      return c.json({
        error: "SUBSCRIPTION_REQUIRED",
        code: "SUBSCRIPTION_REQUIRED",
        message: "This voice requires a Pro subscription. Please upgrade to access premium voices.",
      }, 403);
    }
  }

  const voiceId = VOICE_IDS[voiceType];
  const generationStartTime = Date.now();

  logger.info("Generating TTS audio", { voiceType, voiceId });

  try {
    // Call ElevenLabs API
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("ElevenLabs API error", new Error(errorText), { 
        status: response.status, 
        voiceType 
      });
      return c.json({ 
        error: "TTS_ERROR",
        code: "TTS_ERROR",
        message: "Failed to generate audio. Please try again.",
        details: { provider: "ElevenLabs", status: response.status },
      }, 500);
    }

    // Stream the audio response
    const generationDuration = Date.now() - generationStartTime;
    logger.info("TTS audio generated successfully", { voiceType, duration: `${generationDuration}ms` });
    metricHelpers.ttsGeneration(generationDuration, voiceType);

    // Convert ReadableStream to Uint8Array buffer
    const audioBuffer = await response.arrayBuffer();

    // Set appropriate headers for audio streaming
    c.header("Content-Type", "audio/mpeg");
    c.header("Content-Length", audioBuffer.byteLength.toString());

    return c.body(audioBuffer);
  } catch (error) {
    logger.error("Error generating TTS audio", error, { voiceType });
    return c.json({ 
      error: "INTERNAL_ERROR",
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred while generating audio. Please try again.",
    }, 500);
  }
});

/**
 * POST /api/tts/generate-session
 * Generate complete audio session with affirmations and background
 */
ttsRouter.post(
  "/generate-session",
  rateLimiters.tts,
    zValidator(
      "json",
      z.object({
        affirmations: z.array(z.string()),
        voiceType: z.enum(["neutral", "confident", "premium1", "premium2", "premium3", "premium4", "premium5", "premium6", "premium7", "premium8"]),
        pace: z.enum(["slow", "normal"]),
        affirmationSpacing: z.number().min(0).max(60).optional(), // Seconds between affirmations
        goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(), // Goal for voice configuration
      })
    ),
  async (c) => {
    if (!ELEVENLABS_API_KEY) {
      return c.json({ 
        error: "TTS_ERROR",
        code: "TTS_ERROR",
        message: "Text-to-speech service is temporarily unavailable. Please try again later.",
      }, 503);
    }

    const { affirmations, voiceType, pace, affirmationSpacing = 8, goal } = c.req.valid("json");
    
    // Check premium voice access
    if (PREMIUM_VOICES.includes(voiceType)) {
      const session = c.get("session");
      const userId = session?.userId ?? null;
      // Try to get sessionId from request body if available
      const body = c.req.valid("json") as any;
      const sessionId = body?.sessionId || null;
      const hasAccess = await canUsePremiumVoice(userId, sessionId);
      
      if (!hasAccess) {
        return c.json({
          error: "SUBSCRIPTION_REQUIRED",
          code: "SUBSCRIPTION_REQUIRED",
          message: "This voice requires a Pro subscription. Please upgrade to access premium voices.",
        }, 403);
      }
    }
    
    const voiceId = VOICE_IDS[voiceType];
    const sessionGenerationStartTime = Date.now();

    // Get goal-based voice settings
    const voiceSettings = getVoiceSettings(goal, pace);

    // Generate cache key based on content (including goal for proper caching)
    const cacheKey = generateCacheKey(affirmations, voiceType, pace, affirmationSpacing, goal);

    // Check cache first (database-backed, shared across all users)
    if (await hasCachedAudio(cacheKey)) {
      const cachedAudio = await getCachedAudio(cacheKey);
      if (cachedAudio) {
        const cacheHitDuration = Date.now() - sessionGenerationStartTime;
        logger.info("Using cached TTS audio", { 
          affirmationsCount: affirmations.length,
          voiceType,
          pace,
          goal,
          duration: `${cacheHitDuration}ms`
        });
        // Record cache hit metric (duration is very short for cache hits)
        metricHelpers.cacheOperation("hit", cacheKey);
        metricHelpers.ttsGeneration(cacheHitDuration, voiceType);
        c.header("Content-Type", "audio/mpeg");
        c.header("Content-Length", cachedAudio.length.toString());
        c.header("X-Cache", "HIT");
        // Convert Buffer to ArrayBuffer for Hono compatibility
        const arrayBuffer = new ArrayBuffer(cachedAudio.length);
        new Uint8Array(arrayBuffer).set(cachedAudio);
        return c.body(arrayBuffer);
      }
    }

    logger.info("Generating new TTS session audio", { 
      affirmationsCount: affirmations.length, 
      spacing: affirmationSpacing,
      voiceType,
      pace,
      goal,
      voiceSettings
    });

    // Combine all affirmations with SSML break tags for actual silence
    // ElevenLabs supports SSML, so we can use <break> tags for precise timing
    // Wrap in <speak> tags for SSML support
    // Use proper SSML format with explicit time attribute
    const breakTag = `<break time="${affirmationSpacing}s"/>`;
    const affirmationsWithBreaks = affirmations.map((aff, index) => {
      // Add break after each affirmation except the last one
      // Ensure proper spacing between affirmations
      if (index < affirmations.length - 1) {
        return `${aff.trim()}${breakTag}`;
      }
      return aff.trim();
    }).join(" ");
    // Wrap in speak tags and ensure proper SSML formatting
    const combinedText = `<speak>${affirmationsWithBreaks}</speak>`;

    try {
      // Call ElevenLabs API
      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: combinedText,
          model_id: "eleven_monolingual_v1",
          voice_settings: voiceSettings,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("ElevenLabs API error for session audio", new Error(errorText), { 
          status: response.status,
          affirmationsCount: affirmations.length 
        });
        return c.json({ 
          error: "TTS_ERROR",
          code: "TTS_ERROR",
          message: "Failed to generate session audio. Please try again.",
          details: { provider: "ElevenLabs", status: response.status },
        }, 500);
      }

      const sessionGenerationDuration = Date.now() - sessionGenerationStartTime;
      logger.info("TTS session audio generated successfully", { 
        affirmationsCount: affirmations.length,
        voiceType,
        pace,
        goal,
        duration: `${sessionGenerationDuration}ms`
      });
      metricHelpers.ttsGeneration(sessionGenerationDuration, voiceType);

      // Convert ReadableStream to buffer
      const audioBuffer = await response.arrayBuffer();

      // Save to cache for future use (shared across all users)
      await saveCachedAudio(cacheKey, audioBuffer, affirmations, voiceType, pace, affirmationSpacing, goal);

      // Set appropriate headers for audio streaming
      c.header("Content-Type", "audio/mpeg");
      c.header("Content-Length", audioBuffer.byteLength.toString());
      c.header("X-Cache", "MISS");

      return c.body(audioBuffer);
    } catch (error) {
      logger.error("Error generating TTS session audio", error, { 
        affirmationsCount: affirmations.length 
      });
      return c.json({ 
        error: "INTERNAL_ERROR",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while generating session audio. Please try again.",
      }, 500);
    }
  }
);

/**
 * GET /api/tts/cache/:cacheKey
 * Serve a cached TTS audio file by its cache key
 */
ttsRouter.get("/cache/:cacheKey", async (c) => {
  try {
    const cacheKey = c.req.param("cacheKey");
    
    // Validate cache key format (should be SHA-256 hex string, 64 characters)
    if (!/^[a-f0-9]{64}$/i.test(cacheKey)) {
      return c.json({ 
        error: "INVALID_CACHE_KEY",
        message: "Invalid cache key format. Must be a 64-character hexadecimal string.",
      }, 400);
    }

    const cachedAudio = await getCachedAudio(cacheKey);
    
    if (!cachedAudio) {
      return c.json({ 
        error: "NOT_FOUND",
        message: "Cached audio file not found.",
      }, 404);
    }

    // Set appropriate headers for audio streaming
    c.header("Content-Type", "audio/mpeg");
    c.header("Content-Length", cachedAudio.length.toString());
    c.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    
    // Convert Buffer to ArrayBuffer for Hono compatibility
    const arrayBuffer = new ArrayBuffer(cachedAudio.length);
    new Uint8Array(arrayBuffer).set(cachedAudio);
    return c.body(arrayBuffer);
  } catch (error) {
    logger.error("Error serving cached TTS audio", error, { 
      cacheKey: c.req.param("cacheKey") 
    });
    return c.json({ 
      error: "INTERNAL_ERROR",
      message: "Failed to serve cached audio.",
    }, 500);
  }
});

/**
 * GET /api/tts/affirmation/:cacheKey
 * Serve a cached individual affirmation audio file by its cache key
 */
ttsRouter.get("/affirmation/:cacheKey", async (c) => {
  try {
    const cacheKey = c.req.param("cacheKey");
    
    // Validate cache key format (should be SHA-256 hex string, 64 characters)
    if (!/^[a-f0-9]{64}$/i.test(cacheKey)) {
      return c.json({ 
        error: "INVALID_CACHE_KEY",
        message: "Invalid cache key format. Must be a 64-character hexadecimal string.",
      }, 400);
    }

    // Try Supabase Storage first (if configured)
    if (isSupabaseConfigured()) {
      const signedUrl = await getSignedUrl(STORAGE_BUCKETS.AFFIRMATIONS, `${cacheKey}.mp3`, 3600);
      if (signedUrl) {
        logger.info("Redirecting affirmation audio to Supabase Storage", { cacheKey });
        return c.redirect(signedUrl, 302);
      }
      // If Supabase fails, fall through to local file serving
      logger.warn("Supabase affirmation audio not found, falling back to local", { cacheKey });
    }

    const cachedAudio = await getCachedAffirmationAudio(cacheKey);
    
    if (!cachedAudio) {
      return c.json({ 
        error: "NOT_FOUND",
        message: "Cached affirmation audio file not found.",
      }, 404);
    }

    // Set appropriate headers for audio streaming
    c.header("Content-Type", "audio/mpeg");
    c.header("Content-Length", cachedAudio.length.toString());
    c.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    
    // Convert Buffer to ArrayBuffer for Hono compatibility
    const arrayBuffer = new ArrayBuffer(cachedAudio.length);
    new Uint8Array(arrayBuffer).set(cachedAudio);
    return c.body(arrayBuffer);
  } catch (error) {
    logger.error("Error serving cached affirmation audio", error, { 
      cacheKey: c.req.param("cacheKey") 
    });
    return c.json({ 
      error: "INTERNAL_ERROR",
      message: "Failed to serve cached affirmation audio.",
    }, 500);
  }
});

/**
 * GET /api/tts/cache
 * List all cached TTS files with metadata
 */
ttsRouter.get("/cache", async (c) => {
  try {
    const entries = await db.ttsCache.findMany({
      orderBy: { lastAccessedAt: "desc" },
      take: 100, // Limit to 100 most recent entries
    });

    const baseUrl = `${c.req.header("x-forwarded-proto") || "http"}://${c.req.header("host") || "localhost:3000"}`;
    
    const cacheList = entries.map((entry) => ({
      cacheKey: entry.cacheKey,
      fileSize: entry.fileSize,
      affirmationsCount: entry.affirmationsCount,
      voiceType: entry.voiceType,
      pace: entry.pace,
      affirmationSpacing: entry.affirmationSpacing,
      createdAt: entry.createdAt.toISOString(),
      lastAccessedAt: entry.lastAccessedAt.toISOString(),
      accessCount: entry.accessCount,
      url: `${baseUrl}/api/tts/cache/${entry.cacheKey}`, // Direct URL to play the audio
    }));

    return c.json({
      success: true,
      count: cacheList.length,
      entries: cacheList,
    });
  } catch (error) {
    logger.error("Error listing TTS cache", error);
    return c.json({ 
      error: "INTERNAL_ERROR",
      message: "Failed to list cached audio files.",
    }, 500);
  }
});

export { ttsRouter };
