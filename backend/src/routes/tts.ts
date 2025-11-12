import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppType } from "../types";
import { stream } from "hono/streaming";
import { rateLimiters } from "../middleware/rateLimit";

const ttsRouter = new Hono<AppType>();

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Voice ID mapping for different voice types
const VOICE_IDS = {
  neutral: "21m00Tcm4TlvDq8ikWAM", // Rachel - calm and clear
  confident: "VR6AewLTigWG4xSOukaG", // Arnold - confident
  whisper: "EXAVITQu4vr4xnSDxMaL", // Bella - soft and gentle
};

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
    return c.json({ message: "ElevenLabs API key not configured" }, 500);
  }

  const { text, voiceType } = c.req.valid("json");
  const voiceId = VOICE_IDS[voiceType];

  console.log(`🎤 [TTS] Generating audio for voice: ${voiceType} (${voiceId})`);

  try {
    // Call ElevenLabs API
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
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
      console.error("❌ [TTS] ElevenLabs API error:", errorText);
      return c.json({ message: "Failed to generate audio" }, 500);
    }

    // Stream the audio response
    console.log("✅ [TTS] Audio generated successfully, streaming to client");

    // Convert ReadableStream to Uint8Array buffer
    const audioBuffer = await response.arrayBuffer();

    // Set appropriate headers for audio streaming
    c.header("Content-Type", "audio/mpeg");
    c.header("Content-Length", audioBuffer.byteLength.toString());

    return c.body(audioBuffer);
  } catch (error) {
    console.error("❌ [TTS] Error generating audio:", error);
    return c.json({ message: "Internal server error" }, 500);
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
      pace: z.enum(["slow", "normal", "fast"]),
    })
  ),
  async (c) => {
    if (!ELEVENLABS_API_KEY) {
      return c.json({ message: "ElevenLabs API key not configured" }, 500);
    }

    const { affirmations, voiceType, pace } = c.req.valid("json");
    const voiceId = VOICE_IDS[voiceType];

    console.log(`🎵 [TTS] Generating session audio with ${affirmations.length} affirmations`);

    // Combine all affirmations with pauses based on pace
    const pauseMarkers = {
      slow: "... ... ...",
      normal: "... ...",
      fast: "...",
    };
    const combinedText = affirmations.join(` ${pauseMarkers[pace]} `);

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
            speed: pace === "slow" ? 0.85 : pace === "fast" ? 1.15 : 1.0,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [TTS] ElevenLabs API error:", errorText);
        return c.json({ message: "Failed to generate audio" }, 500);
      }

      console.log("✅ [TTS] Session audio generated successfully");

      // Convert ReadableStream to buffer
      const audioBuffer = await response.arrayBuffer();

      // Set appropriate headers for audio streaming
      c.header("Content-Type", "audio/mpeg");
      c.header("Content-Length", audioBuffer.byteLength.toString());

      return c.body(audioBuffer);
    } catch (error) {
      console.error("❌ [TTS] Error generating session audio:", error);
      return c.json({ message: "Internal server error" }, 500);
    }
  }
);

export { ttsRouter };
