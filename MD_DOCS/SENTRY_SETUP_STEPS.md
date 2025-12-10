# Sentry DSN Setup - Step by Step

**Time**: 5 minutes  
**Status**: Backend code ready, just needs DSN

---

## Quick Start

1. **Get DSN from [sentry.io](https://sentry.io)** (2 min)
2. **Add to `.env` file** (1 min)
3. **Restart backend** (1 min)
4. **Verify** (1 min)

---

## Step 1: Create Sentry Account & Project (2 minutes)

1. **Go to [sentry.io](https://sentry.io)**
   - Click "Sign Up" (or "Sign In" if you have an account)
   - Free tier: 5,000 events/month (perfect for getting started)

2. **Create a New Project**:
   - After signing in, click **"Create Project"**
   - Select **"Node.js"** as the platform
   - Project Name: `Recenter Backend` (or your choice)
   - Click **"Create Project"**

3. **Copy Your DSN**:
   - Right after creating the project, you'll see a setup page with your DSN
   - **OR** go to: **Settings** → **Projects** → **Your Project** → **Client Keys (DSN)**
   - Copy the DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

---

## Step 2: Add DSN to Environment (1 minute)

### Check if .env file exists:

```powershell
# In PowerShell, from backend directory
cd backend
Test-Path .env
```

### If .env doesn't exist, create it:

```powershell
# Copy from example
Copy-Item .env.example .env
```

### Edit .env file:

Open `backend/.env` in your editor and add these lines:

```bash
SENTRY_DSN=https://your-actual-dsn-here@sentry.io/project-id
SENTRY_ENVIRONMENT=development
```

**Replace** `https://your-actual-dsn-here@sentry.io/project-id` with the actual DSN you copied from Sentry.

**Note**: 
- For development: `SENTRY_ENVIRONMENT=development`
- For production: `SENTRY_ENVIRONMENT=production`

---

## Step 3: Restart Backend (1 minute)

1. **Stop your backend server** (if running)
   - Press `Ctrl+C` in the terminal where it's running

2. **Start it again**:
   ```bash
   cd backend
   bun run dev
   ```

3. **Check the logs** - you should see:
   ```
   ✅ Sentry initialized { environment: 'development' }
   ```

   ✅ **Success!** If you see this, Sentry is working.

   ⚠️ **If you see**: `Sentry DSN not configured, error tracking will be disabled`
   - Check that `.env` file exists in `backend/` directory
   - Check that `SENTRY_DSN` line is correct (no extra spaces, correct format)
   - Make sure you restarted the server after adding the variable

---

## Step 4: Verify It Works (1 minute)

### Option A: Run QA Test

```bash
cd backend
bun run test:qa
```

Look for:
```
✅ SENTRY_DSN: Configured
```

### Option B: Check Sentry Setup

```powershell
cd backend
bun run check:sentry
```

This will check if Sentry is configured in your `.env` file.

### Option C: Trigger a Test Error

1. Visit: `http://localhost:3000/api/nonexistent-endpoint`
2. Check your Sentry dashboard
3. You should see the error appear within seconds

---

## Troubleshooting

### "Sentry DSN not configured" in logs

**Check**:
1. ✅ `.env` file exists in `backend/` directory
2. ✅ `SENTRY_DSN` line is in the file
3. ✅ DSN format is correct: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
4. ✅ No extra spaces or quotes around the DSN
5. ✅ You restarted the backend server after adding it

**Fix**: 
- Double-check the DSN from Sentry dashboard
- Make sure it's exactly as shown (no extra characters)
- Restart the server

### No events appearing in Sentry

**Check**:
1. ✅ DSN is correct in Sentry dashboard
2. ✅ Backend logs show "Sentry initialized"
3. ✅ You're actually triggering errors (not just 404s)
4. ✅ Check Sentry project settings (make sure project is active)

**Fix**:
- Verify DSN matches what's in Sentry dashboard
- Try triggering a real error (e.g., invalid API request)
- Check Sentry dashboard filters (make sure you're looking at the right time range)

---

## What Happens Next?

Once configured, Sentry will automatically:
- ✅ Capture all unhandled errors
- ✅ Track HTTP exceptions
- ✅ Track validation errors
- ✅ Include user context (if available)
- ✅ Filter sensitive data (passwords, tokens, etc.)

**No code changes needed** - it's all automatic!

---

## Quick Reference

**DSN Format**: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

**Environment Variables**:
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development  # or production, staging
```

**Verify**:
```bash
cd backend
bun run check:sentry  # Check .env file
bun run test:qa       # Full QA test
```

**See Also**:
- `MD_DOCS/SENTRY_QUICK_SETUP.md` - Quick reference
- `backend/src/lib/sentry.ts` - Implementation details
- `backend/scripts/setup-sentry.md` - Alternative guide

---

**That's it!** Your backend will now automatically track errors in Sentry. 🎉
