# Sentry DSN Setup - Quick Guide

## Step 1: Get Your Sentry DSN (2 minutes)

1. **Go to [sentry.io](https://sentry.io)**
   - Sign up if you don't have an account (free tier: 5,000 events/month)
   - Sign in if you already have an account

2. **Create a New Project** (if you don't have one):
   - Click "Create Project"
   - Select **"Node.js"** as the platform
   - Project Name: `Recenter Backend` (or your choice)
   - Click "Create Project"

3. **Get Your DSN**:
   - After creating the project, you'll see the DSN on the setup page
   - Or go to: **Settings** → **Projects** → **Your Project** → **Client Keys (DSN)**
   - Copy the DSN (format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

## Step 2: Add to Environment Variables (1 minute)

### Option A: Using .env file (Recommended for Development)

1. **Check if `.env` file exists** in the `backend/` directory:
   ```bash
   cd backend
   ls .env  # or dir .env on Windows
   ```

2. **If it doesn't exist, create it**:
   ```bash
   # Copy the example file
   cp .env.example .env  # Linux/Mac
   # or
   copy .env.example .env  # Windows
   ```

3. **Edit `.env` file** and add:
   ```bash
   SENTRY_DSN=https://your-actual-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=development  # or production, staging
   ```

   Replace `https://your-actual-dsn@sentry.io/project-id` with your actual DSN from Step 1.

### Option B: Set Environment Variable Directly (Windows PowerShell)

```powershell
$env:SENTRY_DSN="https://your-dsn@sentry.io/project-id"
$env:SENTRY_ENVIRONMENT="development"
```

### Option C: Set Environment Variable Directly (Linux/Mac)

```bash
export SENTRY_DSN="https://your-dsn@sentry.io/project-id"
export SENTRY_ENVIRONMENT="development"
```

## Step 3: Verify Setup (1 minute)

1. **Restart your backend server** (if it's running)

2. **Check the logs** - you should see:
   ```
   ✅ Sentry initialized { environment: 'development' }
   ```

   If you see:
   ```
   ⚠️ Sentry DSN not configured, error tracking will be disabled
   ```
   Then the DSN wasn't picked up - check your environment variable.

3. **Run the QA test** to verify:
   ```bash
   cd backend
   bun run test:qa
   ```
   
   Should show:
   ```
   ✅ SENTRY_DSN: Configured
   ```

## Step 4: Test It (1 minute)

1. **Trigger a test error** (optional):
   - Visit a non-existent endpoint: `http://localhost:3000/api/test-error`
   - Or make an invalid API request

2. **Check Sentry Dashboard**:
   - Go to your Sentry project
   - You should see the error appear within seconds
   - Click on it to see full error details

## Troubleshooting

### DSN Not Working?

- ✅ Check the DSN format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
- ✅ Make sure there are no extra spaces or quotes
- ✅ Restart the backend server after setting the variable
- ✅ Check backend logs for Sentry initialization message

### No Events in Sentry?

- ✅ Verify DSN is correct in Sentry dashboard
- ✅ Check backend logs for Sentry errors
- ✅ Make sure you're triggering actual errors (not just 404s)

### Need Help?

- See `MD_DOCS/SENTRY_QUICK_SETUP.md` for more details
- Check `backend/src/lib/sentry.ts` for implementation details

---

**That's it!** Your backend will now automatically track all errors in Sentry. 🎉

