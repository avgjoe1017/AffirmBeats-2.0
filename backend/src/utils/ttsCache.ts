/**
 * TTS Audio Caching System
 * 
 * Caches generated TTS audio files to avoid redundant ElevenLabs API calls.
 * Uses content-based hashing to identify identical audio requests.
 * Stores cache metadata in database for shared access across all users.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "../db";

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
const CACHE_DIR = path.join(projectRoot, "backend", "cache", "tts");

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (process.env.NODE_ENV === "development") {
    console.log(`📁 [TTS Cache] Created cache directory: ${CACHE_DIR}`);
  }
}

/**
 * Generate a content hash for caching
 */
export function generateCacheKey(
  affirmations: string[],
  voiceType: string,
  pace: string,
  affirmationSpacing: number
): string {
  const content = JSON.stringify({
    affirmations: affirmations.sort(), // Sort for consistency
    voiceType,
    pace,
    affirmationSpacing,
  });
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Get cached audio file path
 */
export function getCachedAudioPath(cacheKey: string): string {
  return path.join(CACHE_DIR, `${cacheKey}.mp3`);
}

/**
 * Check if cached audio exists in database and on disk
 */
export async function hasCachedAudio(cacheKey: string): Promise<boolean> {
  try {
    const cacheEntry = await db.ttsCache.findUnique({
      where: { cacheKey },
    });
    if (!cacheEntry) return false;
    
    // Verify file still exists on disk
    return fs.existsSync(cacheEntry.filePath);
  } catch (error) {
    console.error(`❌ [TTS Cache] Error checking cache:`, error);
    return false;
  }
}

/**
 * Read cached audio file from database
 */
export async function getCachedAudio(cacheKey: string): Promise<Buffer | null> {
  try {
    const cacheEntry = await db.ttsCache.findUnique({
      where: { cacheKey },
    });
    
    if (!cacheEntry) return null;
    
    // Verify file exists
    if (!fs.existsSync(cacheEntry.filePath)) {
      // File missing, remove from database
      await db.ttsCache.delete({ where: { cacheKey } });
      return null;
    }
    
    // Update access stats
    await db.ttsCache.update({
      where: { cacheKey },
      data: {
        lastAccessedAt: new Date(),
        accessCount: { increment: 1 },
      },
    });
    
    const buffer = fs.readFileSync(cacheEntry.filePath);
    if (process.env.NODE_ENV === "development") {
      console.log(`💾 [TTS Cache] Cache hit! Using cached audio: ${cacheKey.substring(0, 8)}... (${(buffer.length / 1024).toFixed(2)} KB, accessed ${cacheEntry.accessCount + 1} times)`);
    }
    return buffer;
  } catch (error) {
    console.error(`❌ [TTS Cache] Error reading cached audio:`, error);
    return null;
  }
}

/**
 * Save audio to cache (both database and disk)
 */
export async function saveCachedAudio(
  cacheKey: string,
  audioBuffer: ArrayBuffer,
  affirmations: string[],
  voiceType: string,
  pace: string,
  affirmationSpacing: number
): Promise<void> {
  try {
    const filePath = getCachedAudioPath(cacheKey);
    const buffer = Buffer.from(audioBuffer);
    
    // Save to disk
    fs.writeFileSync(filePath, buffer);
    
    // Save to database
    await db.ttsCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        filePath,
        fileSize: buffer.length,
        affirmationsCount: affirmations.length,
        voiceType,
        pace,
        affirmationSpacing,
        accessCount: 0,
      },
      update: {
        // If entry exists, update file path and size (in case file was regenerated)
        filePath,
        fileSize: buffer.length,
        lastAccessedAt: new Date(),
      },
    });
    
    if (process.env.NODE_ENV === "development") {
      console.log(`💾 [TTS Cache] Saved audio to cache: ${cacheKey.substring(0, 8)}... (${(buffer.length / 1024).toFixed(2)} KB)`);
    }
  } catch (error) {
    console.error(`❌ [TTS Cache] Error saving cached audio:`, error);
  }
}

/**
 * Clean up old cache files (older than 30 days, unused for 7 days)
 */
export async function cleanupOldCache(maxAgeDays: number = 30, unusedDays: number = 7): Promise<void> {
  try {
    const now = new Date();
    const maxAge = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);
    const unusedThreshold = new Date(now.getTime() - unusedDays * 24 * 60 * 60 * 1000);
    
    // Find old or unused cache entries
    const oldEntries = await db.ttsCache.findMany({
      where: {
        OR: [
          { createdAt: { lt: maxAge } }, // Older than maxAgeDays
          { 
            lastAccessedAt: { lt: unusedThreshold },
            accessCount: { lt: 2 } // Never accessed or only accessed once
          },
        ],
      },
    });
    
    let deletedCount = 0;
    let totalSize = 0;
    
    for (const entry of oldEntries) {
      try {
        // Delete file if it exists
        if (fs.existsSync(entry.filePath)) {
          fs.unlinkSync(entry.filePath);
          totalSize += entry.fileSize;
        }
        // Delete database entry
        await db.ttsCache.delete({ where: { id: entry.id } });
        deletedCount++;
      } catch (error) {
        console.error(`❌ [TTS Cache] Error deleting cache entry ${entry.cacheKey}:`, error);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🧹 [TTS Cache] Cleaned up ${deletedCount} old cache entries (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    }
  } catch (error) {
    console.error(`❌ [TTS Cache] Error cleaning up cache:`, error);
  }
}

// Run cleanup on startup (in development, log cache stats)
// Use setTimeout to ensure db is initialized
if (process.env.NODE_ENV === "development") {
  setTimeout(() => {
    db.ttsCache
      .aggregate({
        _count: { id: true },
        _sum: { fileSize: true },
      })
      .then((stats) => {
        const count = stats._count.id || 0;
        const totalSize = stats._sum.fileSize || 0;
        console.log(`📊 [TTS Cache] Database cache: ${count} entries, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      })
      .catch((error) => {
        // Silently fail if table doesn't exist yet (migration not run)
        if (!error.message?.includes("no such table")) {
          console.error(`❌ [TTS Cache] Error getting cache stats:`, error);
        }
      });
  }, 1000);
}

// Automatic cleanup disabled - database/disk space is cheaper than API calls
// Keep all cached audio files indefinitely to maximize cache hits
// Manual cleanup can be triggered via admin endpoint if needed

