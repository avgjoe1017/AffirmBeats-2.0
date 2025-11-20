# Supabase Configuration Reference

**Project Reference**: `hrfzxdjhexxplwqprxrx`  
**Region**: `us-west-2`  
**Last Updated**: 2025-11-16

---

## Project URLs

### API URL (for SUPABASE_URL env var)
```
https://hrfzxdjhexxplwqprxrx.supabase.co
```

### Storage S3 Endpoint (for reference)
```
https://hrfzxdjhexxplwqprxrx.storage.supabase.co/storage/v1/s3
```

**Note**: The Supabase JS client uses the API URL (`https://[project-ref].supabase.co`) and handles storage operations internally. You don't need to configure the S3 endpoint directly.

---

## Environment Variables

Add to `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://hrfzxdjhexxplwqprxrx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key-here]
```

**Where to find Service Role Key:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "Service Role Key" (keep it secret!)

---

## Storage Buckets

The following buckets should be created in Supabase Storage:

1. **`affirmations`** - Individual affirmation TTS audio files
   - Public access recommended
   - MIME types: `audio/mpeg`, `audio/mp4`

2. **`binaural`** - Binaural beat audio files
   - Public access recommended
   - MIME types: `audio/mp4`, `audio/mpeg`

3. **`solfeggio`** - Solfeggio tone audio files
   - Public access recommended
   - MIME types: `audio/mp4`, `audio/mpeg`

4. **`background`** - Background sound audio files
   - Public access recommended
   - MIME types: `audio/mp4`, `audio/mpeg`
   - Supports subdirectories (e.g., `looped/`)

---

## Bucket Configuration

### Recommended Settings

- **Public Access**: ✅ Enabled (for CDN delivery)
- **File Size Limit**: 10 MB (default)
- **Allowed MIME Types**: `audio/*` or specific: `audio/mpeg`, `audio/mp4`, `audio/wav`
- **File Upload**: Allowed for authenticated users (or public if bucket is public)

### Creating Buckets

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Enter bucket name (e.g., `affirmations`)
4. Check "Public bucket" for CDN access
5. Click "Create bucket"

---

## Verification

After configuration, verify:

1. **Environment Variables**:
   ```bash
   cd backend
   # Check .env file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Backend Logs**:
   - Should see: `Supabase client initialized` on server start
   - If not configured: `Supabase not configured - audio files will be served from local backend`

3. **Storage Access**:
   - Go to Supabase Dashboard → Storage
   - Verify buckets exist and are accessible
   - Test upload via migration script: `bun run migrate:audio`

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
- Service Role Key bypasses RLS - ensure you're using the correct key

### Files not uploading
- Check file paths exist locally
- Verify file sizes are under bucket limit (10 MB default)
- Check Supabase logs for errors
- Verify bucket permissions allow uploads

---

## Security Notes

⚠️ **Important**: The Service Role Key has full access to your Supabase project. Keep it secret!

- Never commit `.env` files to version control
- Use environment variables in production
- Rotate keys if exposed
- Use separate keys for development/production if possible

---

## Related Documentation

- `MD_DOCS/SUPABASE_STORAGE_MIGRATION.md` - Complete migration guide
- `PRODUCTION_INSTRUCTIONS.md` - Production setup instructions

