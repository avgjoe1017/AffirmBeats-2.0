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
import { logger } from "../lib/logger";
import { metricHelpers } from "../lib/metrics";
import { env } from "../env";
import { db } from "../db";

const ttsRouter = new Hono<AppType>();

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Voice ID mapping for different voice types
const VOICE_IDS = {
  neutral: "21m00Tcm4TlvDq8ikWAM", // Rachel - calm and clear
  confident: "VR6AewLTigWG4xSOukaG", // Arnold - confident
  whisper: "EXAVITQu4vr4xnSDxMaL", // Bella - soft and gentle
};

// Premium voices that require Pro subscription
const PREMIUM_VOICES = ["whisper"];

/**
 * Check if user has access to a premium voice
 */
async function canUsePremiumVoice(userId: string | null): Promise<boolean> {
  if (!userId) {
    return false; // Guest users can't use premium voices
  }

  const subscription = await db.userSubscription.findUnique({
    where: { userId },
  });

  return subscription?.tier === "pro";
}

// Request schema
const generateTTSRequestSchema = z.object({
  text: z.string().min(1),
  voiceType: z.enum(["neutral", "confident", "whisper"]),
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
  if (PREMIUM_VOICES.includes(voiceType)) {
    const session = c.get("session");
    const userId = session?.userId ?? null;
    const hasAccess = await canUsePremiumVoice(userId);
    
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
      voiceType: z.enum(["neutral", "confident", "whisper"]),
      pace: z.enum(["slow", "normal"]),
      affirmationSpacing: z.number().min(0).max(60).optional(), // Seconds between affirmations
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

    const { affirmations, voiceType, pace, affirmationSpacing = 8 } = c.req.valid("json");
    
    // Check premium voice access
    if (PREMIUM_VOICES.includes(voiceType)) {
      const session = c.get("session");
      const userId = session?.userId ?? null;
      const hasAccess = await canUsePremiumVoice(userId);
      
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

    // Generate cache key based on content
    const cacheKey = generateCacheKey(affirmations, voiceType, pace, affirmationSpacing);

    // Check cache first (database-backed, shared across all users)
    if (await hasCachedAudio(cacheKey)) {
      const cachedAudio = await getCachedAudio(cacheKey);
      if (cachedAudio) {
        const cacheHitDuration = Date.now() - sessionGenerationStartTime;
        logger.info("Using cached TTS audio", { 
          affirmationsCount: affirmations.length,
          voiceType,
          pace,
          duration: `${cacheHitDuration}ms`
        });
        // Record cache hit metric (duration is very short for cache hits)
        metricHelpers.cacheOperation("hit", cacheKey);
        metricHelpers.ttsGeneration(cacheHitDuration, voiceType);
        c.header("Content-Type", "audio/mpeg");
        c.header("Content-Length", cachedAudio.length.toString());
        c.header("X-Cache", "HIT");
        return c.body(cachedAudio);
      }
    }

    logger.info("Generating new TTS session audio", { 
      affirmationsCount: affirmations.length, 
      spacing: affirmationSpacing,
      voiceType,
      pace 
    });

    // Combine all affirmations with SSML break tags for actual silence
    // ElevenLabs supports SSML, so we can use <break> tags for precise timing
    // Wrap in <speak> tags for SSML support
    const breakTag = `<break time="${affirmationSpacing}s"/>`;
    const affirmationsWithBreaks = affirmations.map((aff, index) => {
      // Add break after each affirmation except the last one
      return index < affirmations.length - 1 ? `${aff}${breakTag}` : aff;
    }).join(" ");
    const combinedText = `<speak>${affirmationsWithBreaks}</speak>`;

    try {
      // Call ElevenLabs API
      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: combinedText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: pace === "slow" ? 0.85 : 1.0,
          },
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
        duration: `${sessionGenerationDuration}ms`
      });
      metricHelpers.ttsGeneration(sessionGenerationDuration, voiceType);

      // Convert ReadableStream to buffer
      const audioBuffer = await response.arrayBuffer();

      // Save to cache for future use (shared across all users)
      await saveCachedAudio(cacheKey, audioBuffer, affirmations, voiceType, pace, affirmationSpacing);

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

export { ttsRouter };
