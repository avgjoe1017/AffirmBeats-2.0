/**
 * Individual Affirmation Audio Generation System
 * 
 * Generates and caches TTS audio for individual affirmations.
 * Uses content-addressable storage (hash-based) for deduplication.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { parseBuffer } from "music-metadata";
import { db } from "../db";
import { logger } from "../lib/logger";
import { env } from "../env";
import { uploadFile, isSupabaseConfigured, STORAGE_BUCKETS } from "../lib/supabase";

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
// Note: ElevenLabs speed must be between 0.7 and 1.2
const VOICE_CONFIG_BY_GOAL = {
  sleep: {
    stability: 0.80,
    similarity_boost: 0.60,
    speed: 0.75, // Minimum valid speed for slow, calming effect
  },
  calm: {
    stability: 0.75,
    similarity_boost: 0.65,
    speed: 0.80, // Slightly faster than sleep
  },
  focus: {
    stability: 0.72,
    similarity_boost: 0.68,
    speed: 0.90, // More energetic for focus
  },
  manifest: {
    stability: 0.70,
    similarity_boost: 0.70,
    speed: 1.0, // Normal speed for manifesting
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
 * Get accurate audio duration from MP3 file using music-metadata
 */
async function getAudioDuration(buffer: Buffer): Promise<number> {
  try {
    const metadata = await parseBuffer(buffer);
    const durationSeconds = metadata.format.duration;
    
    if (durationSeconds && durationSeconds > 0) {
      return Math.round(durationSeconds * 1000); // Convert to milliseconds
    }
    
    // Fallback: estimate based on file size if metadata is missing
    // MP3 files are typically ~1KB per second at 128kbps
    logger.warn("[Affirmation Audio] Could not extract duration from metadata, using estimation");
    const estimatedSeconds = buffer.length / 1000;
    return Math.round(estimatedSeconds * 1000);
  } catch (error) {
    logger.error("[Affirmation Audio] Error parsing audio metadata, using estimation", error);
    // Fallback estimation
    const estimatedSeconds = buffer.length / 1000;
    return Math.round(estimatedSeconds * 1000);
  }
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
  pace?: "slow" | "normal" // Deprecated: always uses "slow"
): Promise<{ audioUrl: string; durationMs: number }> {
  try {
    // Get affirmation from database
    const affirmation = await db.affirmationLine.findUnique({
      where: { id: affirmationId },
    });

    if (!affirmation) {
      throw new Error(`Affirmation not found: ${affirmationId}`);
    }

    // Always use slow pace
    const paceValue = "slow";

    // Generate cache key
    const cacheKey = generateAffirmationCacheKey(text, voiceType, goal, paceValue);

    // Check if audio version already exists in AffirmationAudio table
    const existingAudio = await db.affirmationAudio.findUnique({
      where: {
        affirmationId_voiceId: {
          affirmationId,
          voiceId: voiceType,
        },
      },
    });

    if (existingAudio) {
      // Verify file exists on disk
      const filePath = getCachedAudioPath(cacheKey);
      if (fs.existsSync(filePath)) {
        logger.debug(`[Affirmation Audio] Using existing audio version for affirmation ${affirmationId}`, {
          voiceId: voiceType,
          pace: paceValue,
        });
        return {
          audioUrl: existingAudio.audioUrl,
          durationMs: existingAudio.durationMs,
        };
      } else {
        // File missing but record exists - regenerate
        logger.warn(`[Affirmation Audio] Audio file missing for existing record, regenerating`, {
          affirmationId,
          cacheKey,
        });
      }
    }

    // Check if cached file exists on disk (by cache key) - might be from old system
    const cachedPath = getCachedAudioPath(cacheKey);
    if (fs.existsSync(cachedPath)) {
      const buffer = fs.readFileSync(cachedPath);
      const duration = await getAudioDuration(buffer);
      const audioUrl = `/api/tts/affirmation/${cacheKey}`;
      
      // Create or update AffirmationAudio record
      await db.affirmationAudio.upsert({
        where: {
          affirmationId_voiceId: {
            affirmationId,
            voiceId: voiceType,
          },
        },
        create: {
          affirmationId,
          voiceId: voiceType,
          pace: paceValue,
          cacheKey,
          audioUrl,
          durationMs: duration,
        },
        update: {
          audioUrl,
          durationMs: duration,
          cacheKey,
          pace: paceValue, // Always ensure pace is "slow"
        },
      });

      logger.info(`[Affirmation Audio] Found cached audio and created AffirmationAudio record`, {
        affirmationId,
        voiceId: voiceType,
      });
      return {
        audioUrl,
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
          // Ensure speed stays within ElevenLabs valid range (0.7-1.2)
          speed: Math.max(0.7, Math.min(1.2, pace === "slow" ? goalConfig.speed * 0.90 : goalConfig.speed)),
        }
      : {
          ...defaultSettings,
          // Ensure default speed is also within valid range
          speed: Math.max(0.7, Math.min(1.2, defaultSettings.speed)),
        };

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

    // Save to disk (for local fallback)
    fs.writeFileSync(cachedPath, buffer);

    // Upload to Supabase Storage if configured
    let audioUrl = `/api/tts/affirmation/${cacheKey}`; // Default to local URL
    if (isSupabaseConfigured()) {
      const supabaseUrl = await uploadFile(
        STORAGE_BUCKETS.AFFIRMATIONS,
        `${cacheKey}.mp3`,
        buffer,
        "audio/mpeg"
      );
      if (supabaseUrl) {
        // Use Supabase URL directly (public URL or signed URL)
        // For now, we'll still use the API endpoint which will redirect to Supabase
        // This allows us to switch between local and Supabase seamlessly
        logger.info(`[Affirmation Audio] Uploaded to Supabase Storage`, {
          cacheKey,
          supabaseUrl,
        });
      } else {
        logger.warn(`[Affirmation Audio] Failed to upload to Supabase, using local storage`, {
          cacheKey,
        });
      }
    }

    // Create or update AffirmationAudio record (new system - supports multiple voices)
    await db.affirmationAudio.upsert({
      where: {
        affirmationId_voiceId: {
          affirmationId,
          voiceId: voiceType,
        },
      },
      create: {
        affirmationId,
        voiceId: voiceType,
        pace: paceValue,
        cacheKey,
        audioUrl,
        durationMs: duration,
      },
      update: {
        audioUrl,
        durationMs: duration,
        cacheKey,
        pace: paceValue, // Always ensure pace is "slow"
      },
    });

    // Also update legacy fields for backward compatibility (deprecated)
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
      voiceId: voiceType,
      storage: isSupabaseConfigured() ? "Supabase + Local" : "Local",
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

