# Supabase Storage Migration Guide

**Date:** 2025-11-16  
**Purpose:** Migrate all audio assets to Supabase Storage for CDN delivery and performance optimization

---

## Overview

This migration moves all audio files from local backend storage to Supabase Storage, which provides:
- **CDN Delivery**: Automatic CDN distribution via Supabase
- **Performance**: Faster load times, reduced backend bandwidth
- **Scalability**: No backend bandwidth costs for audio delivery
- **Reliability**: Redundant storage with automatic backups

---

## Audio Files to Migrate

### 1. **Affirmations** (`affirmations/` bucket)
- Individual affirmation TTS audio files
- Location: `backend/cache/affirmations/`
- Format: MP3 files named by cache key (SHA-256 hash)
- Estimated count: Varies (grows as affirmations are generated)

### 2. **Binaural Beats** (`binaural/` bucket)
- Optimized 3-minute M4A loops
- Location: `assets/audio/binaural/`
- Files: 12 files (delta, theta, alpha, beta, gamma frequencies)
- Total size: ~24-36 MB

### 3. **Solfeggio Tones** (`solfeggio/` bucket)
- Optimized 3-minute M4A loops
- Location: `assets/audio/solfeggio/`
- Files: 11 files (various frequencies)
- Total size: ~22-33 MB

### 4. **Background Sounds** (`background/` bucket)
- Optimized loopable M4A files
- Location: `assets/audio/background/looped/`
- Files: 10 files (rain, ocean, forest, etc.)
- Total size: ~30 MB
- Structure: Preserves subdirectory structure (`looped/`)

**Total Estimated Size:** ~76-99 MB

---

## Prerequisites

1. **Supabase Account**
   - Create account at https://supabase.com
   - Create a new project (or use existing)

2. **Storage Buckets**
   Create the following buckets in Supabase Storage:
   - `affirmations` - For individual affirmation TTS files
   - `binaural` - For binaural beat files
   - `solfeggio` - For solfeggio tone files
   - `background` - For background sound files

   **Bucket Settings:**
   - **Public Access**: Recommended for audio files (enables CDN)
   - **File Size Limit**: 10 MB (default is fine)
   - **Allowed MIME Types**: `audio/*` (or specific: `audio/mpeg`, `audio/mp4`, `audio/wav`)

3. **Environment Variables**
   Add to `backend/.env`:
   ```env
   SUPABASE_URL=https://hrfzxdjhexxplwqprxrx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   ```

   **Where to find:**
   - **SUPABASE_URL**: Project Settings → API → Project URL
     - **Note**: Use the project URL (`https://[project-ref].supabase.co`), NOT the S3 endpoint
     - **Current Project**: `https://hrfzxdjhexxplwqprxrx.supabase.co`
   - **SUPABASE_SERVICE_ROLE_KEY**: Project Settings → API → Service Role Key (secret!)
   
   **Storage Details:**
   - **Storage Endpoint**: `https://hrfzxdjhexxplwqprxrx.storage.supabase.co/storage/v1/s3` (for reference)
   - **Region**: `us-west-2`
   - **Note**: The Supabase JS client handles storage internally - you don't need to configure the S3 endpoint directly

---

## Migration Steps

### Step 1: Install Dependencies

```bash
cd backend
bun install
```

This installs `@supabase/supabase-js` package.

### Step 2: Configure Environment

1. Open `backend/.env`
2. Add Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Step 3: Create Storage Buckets

1. Go to Supabase Dashboard → Storage
2. Create each bucket:
   - Click "New bucket"
   - Name: `affirmations` → Public → Create
   - Repeat for: `binaural`, `solfeggio`, `background`

### Step 4: Run Migration Script

```bash
cd backend
bun run migrate:audio
```

The script will:
- Upload all affirmation audio files from cache
- Upload all binaural beat files
- Upload all solfeggio tone files
- Upload all background sound files (preserving subdirectory structure)
- Show progress and summary

**Expected Output:**
```
🚀 Starting audio file migration to Supabase Storage...

📦 Supabase Storage Buckets:
   - affirmations (individual affirmation TTS files)
   - binaural (binaural beat files)
   - solfeggio (solfeggio tone files)
   - background (background sound files)

📤 Uploading affirmation audio files...
✅ Uploaded: affirmations/abc123...mp3
...

📊 Migration Summary
============================================================
✅ Total Uploaded: 45 files
❌ Total Failed: 0 files
```

### Step 5: Verify Migration

1. Check Supabase Dashboard → Storage
2. Verify files in each bucket
3. Test audio playback in app

---

## How It Works

### Backend Routes

All audio routes now check Supabase first, then fall back to local files:

1. **Request comes in** → `/api/audio/binaural/theta_4hz_400_3min.m4a`
2. **Check Supabase** → Generate signed URL (1 hour expiry)
3. **If found** → Redirect (302) to Supabase CDN URL
4. **If not found** → Serve from local files (fallback)

### Affirmation Audio

Individual affirmation audio files:
- Generated → Saved to local cache + Uploaded to Supabase
- Served via → `/api/tts/affirmation/:cacheKey`
- Route checks Supabase first, falls back to local

### Benefits

- **Zero Downtime**: Local fallback ensures service continues
- **Gradual Migration**: Can migrate files incrementally
- **CDN Performance**: Supabase CDN provides fast global delivery
- **Cost Savings**: No backend bandwidth for audio delivery

---

## Post-Migration

### Monitoring

1. **Check Supabase Dashboard** → Storage → Usage
2. **Monitor Backend Logs** for Supabase redirects
3. **Test Audio Playback** in app

### Cleanup (Optional)

After verifying everything works:
- Local files can remain as backup
- Or delete to save disk space (not recommended initially)

---

## Troubleshooting

### Error: "Supabase not configured"
- Check `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Restart backend server after adding env vars

### Error: "Bucket not found"
- Create buckets in Supabase Dashboard → Storage
- Bucket names must match exactly: `affirmations`, `binaural`, `solfeggio`, `background`

### Error: "Permission denied"
- Check Service Role Key is correct (not anon key)
- Verify bucket is set to Public (or configure RLS policies)

### Files not uploading
- Check file paths exist
- Verify file sizes are under bucket limit
- Check Supabase logs for errors

### Audio not playing after migration
- Verify files uploaded successfully
- Check Supabase bucket permissions
- Test signed URL generation manually
- Check backend logs for redirects

---

## Rollback Plan

If issues occur:

1. **Remove Supabase env vars** → Routes will use local files only
2. **Local files remain** → No data loss
3. **Restart backend** → Immediate rollback

---

## Future Enhancements

- **Public URLs**: If buckets are public, can use direct URLs (no signed URLs needed)
- **Cache Invalidation**: Add endpoint to refresh signed URLs
- **Upload on Generation**: Auto-upload new affirmation audio to Supabase
- **Migration Status**: Add endpoint to check migration progress

---

## Files Modified

- `backend/package.json` - Added `@supabase/supabase-js` dependency
- `backend/src/env.ts` - Added Supabase environment variables
- `backend/src/lib/supabase.ts` - New Supabase Storage utility
- `backend/src/routes/audio.ts` - Updated to use Supabase signed URLs
- `backend/src/routes/tts.ts` - Updated affirmation endpoint for Supabase
- `backend/src/utils/affirmationAudio.ts` - Auto-upload to Supabase on generation
- `backend/scripts/migrate-audio-to-supabase.ts` - Migration script

---

## Support

For issues or questions:
1. Check Supabase Dashboard → Storage → Logs
2. Review backend logs for Supabase errors
3. Verify environment variables are set correctly

