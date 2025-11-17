/**
 * Individual Affirmation Audio Generation System
 * 
 * Generates and caches TTS audio for individual affirmations.
 * Uses content-addressable storage (hash-based) for deduplication.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "../db";
import { logger } from "../lib/logger";
import { env } from "../env";

const getProjectRoot = () => {
  if (typeof import.meta !== "undefined" && "dir" in import.meta && import.meta.dir) {
    return path.join(import.meta.dir, "..", "..", "..");
  }
  if (typeof __dirname !== "undefined") {
    return path.join(__dirname, "..", "..", "..");
  }
  return process.cwd();
};

const projectRoot = getProjectRoot();
const AFFIRMATION_AUDIO_DIR = path.join(projectRoot, "backend", "cache", "affirmations");

// Ensure cache directory exists
if (!fs.existsSync(AFFIRMATION_AUDIO_DIR)) {
  fs.mkdirSync(AFFIRMATION_AUDIO_DIR, { recursive: true });
  if (process.env.NODE_ENV === "development") {
    logger.info(`📁 [Affirmation Audio] Created cache directory: ${AFFIRMATION_AUDIO_DIR}`);
  }
}

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// Voice ID mapping
const VOICE_IDS = {
  neutral: "ZqvIIuD5aI9JFejebHiH", // Mira (F)
  confident: "xGDJhCwcqw94ypljc95Z", // Archer (M)
  premium1: "qxTFXDYbGcR8GaHSjczg", // James (M)
  premium2: "BpjGufoPiobT79j2vtj4", // Priyanka (F)
  premium3: "eUdJpUEN3EslrgE24PKx", // Rhea (F)
  premium4: "7JxUWWyYwXK8kmqmKEnT", // Chuck (M)
  premium5: "wdymxIQkYn7MJCYCQF2Q", // Zara (F)
  premium6: "zA6D7RyKdc2EClouEMkQ", // Almee (F)
  premium7: "KGZeK6FsnWQdrkDHnDNA", // Kristen (F)
  premium8: "wgHvco1wiREKN0BdyVx5", // Drew (M)
};

// Goal-based voice settings
const VOICE_CONFIG_BY_GOAL = {
  sleep: {
    stability: 0.80,
    similarity_boost: 0.60,
    speed: 0.65,
  },
  calm: {
    stability: 0.75,
    similarity_boost: 0.65,
    speed: 0.70,
  },
  focus: {
    stability: 0.72,
    similarity_boost: 0.68,
    speed: 0.75,
  },
  manifest: {
    stability: 0.70,
    similarity_boost: 0.70,
    speed: 0.80,
  },
} as const;

/**
 * Generate a content hash for an affirmation
 * Hash includes: text + voiceType + goal + pace
 */
export function generateAffirmationCacheKey(
  text: string,
  voiceType: string,
  goal?: string,
  pace?: "slow" | "normal"
): string {
  const content = JSON.stringify({
    text: text.trim(),
    voiceType,
    goal: goal || null,
    pace: pace || "normal",
  });
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Get cached audio file path
 */
function getCachedAudioPath(cacheKey: string): string {
  return path.join(AFFIRMATION_AUDIO_DIR, `${cacheKey}.mp3`);
}

/**
 * Get audio duration from MP3 file (approximate)
 * This is a simple estimation - for accurate duration, use a proper audio library
 */
async function getAudioDuration(buffer: Buffer): Promise<number> {
  // Simple estimation: MP3 files are typically ~1KB per second at 128kbps
  // This is approximate but works for our use case
  // For production, consider using a library like node-ffmpeg or mp3-duration
  const estimatedSeconds = buffer.length / 1000; // Rough estimate
  return Math.round(estimatedSeconds * 1000); // Return in milliseconds
}

/**
 * Generate or retrieve audio for an individual affirmation
 * Returns the audio URL and duration
 */
export async function generateAffirmationAudio(
  affirmationId: string,
  text: string,
  voiceType: "neutral" | "confident" | "premium1" | "premium2" | "premium3" | "premium4" | "premium5" | "premium6" | "premium7" | "premium8",
  goal?: "sleep" | "focus" | "calm" | "manifest",
  pace?: "slow" | "normal"
): Promise<{ audioUrl: string; durationMs: number }> {
  try {
    // Get affirmation from database
    const affirmation = await db.affirmationLine.findUnique({
      where: { id: affirmationId },
    });

    if (!affirmation) {
      throw new Error(`Affirmation not found: ${affirmationId}`);
    }

    // Generate cache key
    const cacheKey = generateAffirmationCacheKey(text, voiceType, goal, pace);

    // Check if audio already exists in database
    if (affirmation.ttsAudioUrl && affirmation.audioDurationMs) {
      // Verify file exists on disk
      const filePath = getCachedAudioPath(cacheKey);
      if (fs.existsSync(filePath)) {
        logger.debug(`[Affirmation Audio] Using existing audio for affirmation ${affirmationId}`);
        return {
          audioUrl: affirmation.ttsAudioUrl,
          durationMs: affirmation.audioDurationMs,
        };
      }
    }

    // Check if cached file exists on disk (by cache key)
    const cachedPath = getCachedAudioPath(cacheKey);
    if (fs.existsSync(cachedPath)) {
      const buffer = fs.readFileSync(cachedPath);
      const duration = await getAudioDuration(buffer);
      
      // Update database with cached audio info
      await db.affirmationLine.update({
        where: { id: affirmationId },
        data: {
          ttsAudioUrl: `/api/tts/affirmation/${cacheKey}`,
          ttsVoiceId: voiceType,
          audioDurationMs: duration,
        },
      });

      logger.info(`[Affirmation Audio] Found cached audio for affirmation ${affirmationId}`);
      return {
        audioUrl: `/api/tts/affirmation/${cacheKey}`,
        durationMs: duration,
      };
    }

    // Generate new audio
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const voiceId = VOICE_IDS[voiceType];
    if (!voiceId) {
      throw new Error(`Invalid voice type: ${voiceType}`);
    }

    // Get voice settings based on goal
    const defaultSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      speed: pace === "slow" ? 0.85 : 1.0,
    };

    const goalConfig = goal && goal in VOICE_CONFIG_BY_GOAL
      ? VOICE_CONFIG_BY_GOAL[goal as keyof typeof VOICE_CONFIG_BY_GOAL]
      : null;

    const voiceSettings = goalConfig
      ? {
          stability: goalConfig.stability,
          similarity_boost: goalConfig.similarity_boost,
          speed: pace === "slow" ? goalConfig.speed * 0.90 : goalConfig.speed,
        }
      : defaultSettings;

    logger.info(`[Affirmation Audio] Generating audio for affirmation ${affirmationId}`, {
      text: text.substring(0, 50) + "...",
      voiceType,
      goal,
      pace,
    });

    // Call ElevenLabs API
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: "eleven_monolingual_v1",
        voice_settings: voiceSettings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[Affirmation Audio] ElevenLabs API error`, new Error(errorText), {
        status: response.status,
        affirmationId,
      });
      throw new Error(`Failed to generate audio: ${response.status}`);
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    const duration = await getAudioDuration(buffer);

    // Save to disk
    fs.writeFileSync(cachedPath, buffer);

    // Update database
    const audioUrl = `/api/tts/affirmation/${cacheKey}`;
    await db.affirmationLine.update({
      where: { id: affirmationId },
      data: {
        ttsAudioUrl: audioUrl,
        ttsVoiceId: voiceType,
        audioDurationMs: duration,
      },
    });

    logger.info(`[Affirmation Audio] Generated and saved audio for affirmation ${affirmationId}`, {
      durationMs: duration,
      fileSize: buffer.length,
    });

    return {
      audioUrl,
      durationMs: duration,
    };
  } catch (error) {
    logger.error(`[Affirmation Audio] Error generating audio for affirmation ${affirmationId}`, error);
    throw error;
  }
}

/**
 * Get cached audio file by cache key
 */
export async function getCachedAffirmationAudio(cacheKey: string): Promise<Buffer | null> {
  try {
    const filePath = getCachedAudioPath(cacheKey);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath);
  } catch (error) {
    logger.error(`[Affirmation Audio] Error reading cached audio`, error, { cacheKey });
    return null;
  }
}

