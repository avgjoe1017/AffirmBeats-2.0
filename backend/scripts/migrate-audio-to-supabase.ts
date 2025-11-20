/**
 * Migration Script: Upload Audio Files to Supabase Storage
 * 
 * This script uploads all audio files to Supabase Storage buckets:
 * - affirmations/ - Individual affirmation TTS audio files
 * - binaural/ - Binaural beat audio files
 * - solfeggio/ - Solfeggio tone audio files
 * - background/ - Background sound audio files
 * 
 * Usage:
 *   bun run scripts/migrate-audio-to-supabase.ts
 */

import fs from "fs";
import path from "path";
import { getSupabaseClient, STORAGE_BUCKETS, uploadFile } from "../src/lib/supabase";

// Simple console logger for migration script (avoids env validation)
const logger = {
  info: (msg: string, ...args: any[]) => console.log(`ℹ️  ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`⚠️  ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`❌ ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => {
    if (process.env.DEBUG) console.debug(`🔍 ${msg}`, ...args);
  },
};

// Get Supabase credentials directly from process.env to avoid full env validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getProjectRoot = () => {
  if (typeof import.meta !== "undefined" && "dir" in import.meta && import.meta.dir) {
    return path.join(import.meta.dir, "..", "..");
  }
  if (typeof __dirname !== "undefined") {
    return path.join(__dirname, "..", "..");
  }
  return process.cwd();
};

const projectRoot = getProjectRoot();
const assetsAudioRoot = path.join(projectRoot, "assets", "audio");
const affirmationCacheRoot = path.join(projectRoot, "backend", "cache", "affirmations");

// MIME types for audio files
const getContentType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".m4a") return "audio/mp4";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".opus") return "audio/opus";
  return "audio/mpeg"; // Default
};

/**
 * Upload all files from a directory to a Supabase bucket
 */
async function uploadDirectory(
  localDir: string,
  bucket: string,
  remotePrefix: string = ""
): Promise<{ uploaded: number; failed: number; errors: string[] }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!fs.existsSync(localDir)) {
    logger.warn(`Directory does not exist: ${localDir}`);
    return { uploaded: 0, failed: 0, errors: [`Directory not found: ${localDir}`] };
  }

  const files = fs.readdirSync(localDir, { withFileTypes: true });
  let uploaded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const file of files) {
    const localPath = path.join(localDir, file.name);
    
    if (file.isDirectory()) {
      // Recursively upload subdirectories
      const subRemotePrefix = remotePrefix ? `${remotePrefix}/${file.name}` : file.name;
      const result = await uploadDirectory(localPath, bucket, subRemotePrefix);
      uploaded += result.uploaded;
      failed += result.failed;
      errors.push(...result.errors);
      continue;
    }

    if (!file.isFile()) continue;

    // Skip non-audio files
    const ext = path.extname(file.name).toLowerCase();
    if (![".m4a", ".mp3", ".wav", ".opus"].includes(ext)) {
      continue;
    }

    try {
      const remotePath = remotePrefix ? `${remotePrefix}/${file.name}` : file.name;
      const fileBuffer = fs.readFileSync(localPath);
      const contentType = getContentType(file.name);

      logger.info(`Uploading ${file.name} to ${bucket}/${remotePath}...`);
      const url = await uploadFile(bucket, remotePath, fileBuffer, contentType);

      if (url) {
        uploaded++;
        logger.info(`✅ Uploaded: ${bucket}/${remotePath}`);
      } else {
        failed++;
        errors.push(`Failed to upload: ${localPath}`);
        logger.error(`❌ Failed to upload: ${localPath}`);
      }
    } catch (error) {
      failed++;
      const errorMsg = `Error uploading ${localPath}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      logger.error(`❌ ${errorMsg}`);
    }
  }

  return { uploaded, failed, errors };
}

/**
 * Main migration function
 */
async function migrateAudioFiles() {
  console.log("🚀 Starting audio file migration to Supabase Storage...\n");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Supabase not configured!");
    console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file");
    console.error("\nExample .env entries:");
    console.error("SUPABASE_URL=https://hrfzxdjhexxplwqprxrx.supabase.co");
    console.error("SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here");
    process.exit(1);
  }

  // Temporarily set env vars for getSupabaseClient
  process.env.SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY;

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("❌ Failed to initialize Supabase client");
    process.exit(1);
  }

  console.log("📦 Supabase Storage Buckets:");
  console.log(`   - ${STORAGE_BUCKETS.AFFIRMATIONS} (individual affirmation TTS files)`);
  console.log(`   - ${STORAGE_BUCKETS.BINAURAL} (binaural beat files)`);
  console.log(`   - ${STORAGE_BUCKETS.SOLFEGGIO} (solfeggio tone files)`);
  console.log(`   - ${STORAGE_BUCKETS.BACKGROUND} (background sound files)\n`);

  const results = {
    affirmations: { uploaded: 0, failed: 0, errors: [] as string[] },
    binaural: { uploaded: 0, failed: 0, errors: [] as string[] },
    solfeggio: { uploaded: 0, failed: 0, errors: [] as string[] },
    background: { uploaded: 0, failed: 0, errors: [] as string[] },
  };

  // 1. Upload affirmation audio files (from cache)
  if (fs.existsSync(affirmationCacheRoot)) {
    console.log("📤 Uploading affirmation audio files...");
    results.affirmations = await uploadDirectory(
      affirmationCacheRoot,
      STORAGE_BUCKETS.AFFIRMATIONS
    );
  } else {
    console.log("⚠️  Affirmation cache directory not found, skipping...");
  }

  // 2. Upload binaural beat files
  const binauralDir = path.join(assetsAudioRoot, "binaural");
  if (fs.existsSync(binauralDir)) {
    console.log("\n📤 Uploading binaural beat files...");
    results.binaural = await uploadDirectory(binauralDir, STORAGE_BUCKETS.BINAURAL);
  } else {
    console.log("⚠️  Binaural directory not found, skipping...");
  }

  // 3. Upload solfeggio tone files
  const solfeggioDir = path.join(assetsAudioRoot, "solfeggio");
  if (fs.existsSync(solfeggioDir)) {
    console.log("\n📤 Uploading solfeggio tone files...");
    results.solfeggio = await uploadDirectory(solfeggioDir, STORAGE_BUCKETS.SOLFEGGIO);
  } else {
    console.log("⚠️  Solfeggio directory not found, skipping...");
  }

  // 4. Upload background sound files (with subdirectories)
  const backgroundDir = path.join(assetsAudioRoot, "background");
  if (fs.existsSync(backgroundDir)) {
    console.log("\n📤 Uploading background sound files...");
    // Upload each subdirectory separately to preserve structure
    const subdirs = fs.readdirSync(backgroundDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const subdir of subdirs) {
      const subdirPath = path.join(backgroundDir, subdir);
      const subResult = await uploadDirectory(subdirPath, STORAGE_BUCKETS.BACKGROUND, subdir);
      results.background.uploaded += subResult.uploaded;
      results.background.failed += subResult.failed;
      results.background.errors.push(...subResult.errors);
    }
  } else {
    console.log("⚠️  Background directory not found, skipping...");
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Migration Summary");
  console.log("=".repeat(60));
  
  const totalUploaded = Object.values(results).reduce((sum, r) => sum + r.uploaded, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

  console.log(`\n✅ Total Uploaded: ${totalUploaded} files`);
  console.log(`❌ Total Failed: ${totalFailed} files`);

  console.log("\n📋 Breakdown by bucket:");
  for (const [bucket, result] of Object.entries(results)) {
    console.log(`   ${bucket}: ${result.uploaded} uploaded, ${result.failed} failed`);
    if (result.errors.length > 0) {
      console.log(`      Errors: ${result.errors.slice(0, 3).join(", ")}${result.errors.length > 3 ? "..." : ""}`);
    }
  }

  if (totalFailed > 0) {
    console.log("\n⚠️  Some files failed to upload. Check the errors above.");
    process.exit(1);
  } else {
    console.log("\n✅ Migration completed successfully!");
  }
}

// Run migration
migrateAudioFiles().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});

