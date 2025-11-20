/**
 * Supabase Storage Client
 * 
 * Handles audio file storage and retrieval from Supabase Storage.
 * Uses service role key for server-side operations (upload, delete, sign URLs).
 */

import { createClient } from "@supabase/supabase-js";
import path from "path";

// Get Supabase credentials from process.env directly to avoid full env validation
// This allows the migration script to run without requiring all env vars
function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

// Simple logger that doesn't require env validation
// This allows migration scripts to run without all env vars
const logger = {
  info: (msg: string, context?: any) => {
    if (context) console.log(`[Supabase] ${msg}`, context);
    else console.log(`[Supabase] ${msg}`);
  },
  warn: (msg: string, context?: any) => {
    if (context) console.warn(`[Supabase] ${msg}`, context);
    else console.warn(`[Supabase] ${msg}`);
  },
  error: (msg: string, error?: any, context?: any) => {
    if (error && context) console.error(`[Supabase] ${msg}`, error, context);
    else if (error) console.error(`[Supabase] ${msg}`, error);
    else if (context) console.error(`[Supabase] ${msg}`, context);
    else console.error(`[Supabase] ${msg}`);
  },
  debug: (msg: string, context?: any) => {
    if (process.env.DEBUG) {
      if (context) console.debug(`[Supabase] ${msg}`, context);
      else console.debug(`[Supabase] ${msg}`);
    }
  },
};

// Supabase Storage bucket names
export const STORAGE_BUCKETS = {
  AFFIRMATIONS: "affirmations", // Individual affirmation TTS audio files
  BINAURAL: "binaural", // Binaural beat audio files
  SOLFEGGIO: "solfeggio", // Solfeggio tone audio files
  BACKGROUND: "background", // Background sound audio files
} as const;

// Initialize Supabase client with service role key (for server-side operations)
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  
  if (!config.url || !config.serviceRoleKey) {
    if (process.env.NODE_ENV === "development") {
      logger.warn("Supabase not configured - audio files will be served from local backend");
    }
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    logger.info("Supabase client initialized", { url: config.url });
  }

  return supabaseClient;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return !!(config.url && config.serviceRoleKey);
}

/**
 * Get a signed URL for an audio file in Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to file within bucket (e.g., "looped/Heavy Rain.m4a")
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if Supabase not configured
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      logger.error("Failed to create signed URL", error, { bucket, filePath });
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    logger.error("Error creating signed URL", error, { bucket, filePath });
    return null;
  }
}

/**
 * Upload a file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to file within bucket
 * @param fileBuffer - File contents as Buffer
 * @param contentType - MIME type (e.g., "audio/mp4" for M4A files)
 * @returns Public URL or null if upload failed
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      logger.error("Failed to upload file to Supabase", error, { bucket, filePath });
      return null;
    }

    // Get public URL (or signed URL if bucket is private)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    
    logger.info("File uploaded to Supabase", { bucket, filePath, publicUrl: urlData.publicUrl });
    return urlData.publicUrl;
  } catch (error) {
    logger.error("Error uploading file to Supabase", error, { bucket, filePath });
    return null;
  }
}

/**
 * Check if a file exists in Supabase Storage
 * @param bucket - Storage bucket name
 * @param filePath - Path to file within bucket
 * @returns True if file exists, false otherwise
 */
export async function fileExists(bucket: string, filePath: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  try {
    // Handle root-level files (no directory)
    const dirPath = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const listPath = dirPath === "." ? "" : dirPath;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(listPath, {
        limit: 1000,
        search: fileName,
      });

    if (error) {
      logger.error("Failed to check file existence", error, { bucket, filePath });
      return false;
    }

    return data?.some((file) => file.name === fileName) ?? false;
  } catch (error) {
    logger.error("Error checking file existence", error, { bucket, filePath });
    return false;
  }
}

