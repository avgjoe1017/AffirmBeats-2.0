# Backend Environment Setup

## Problem: Server Won't Start

If you see "connection refused" or the server doesn't start, it's likely missing required environment variables.

## Required Environment Variables

The backend needs a `.env` file in the `backend/` directory with at least:

```env
BETTER_AUTH_SECRET=your-secret-key-must-be-at-least-32-characters-long
```

## Quick Setup

### Step 1: Create `.env` file

Navigate to the `backend` directory and create a `.env` file:

```powershell
cd "C:\Users\joeba\Documents\AffirmBeats 2.0\backend"
```

### Step 2: Generate a Secret Key

**Option A: Use PowerShell to generate a random key**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option B: Use a simple string (for development only)**
```
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security
```

### Step 3: Create `.env` file

Create a file named `.env` in the `backend` directory with this content:

```env
# Required
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security

# Optional (has defaults)
PORT=3000
NODE_ENV=development
DATABASE_URL=file:dev.db
BACKEND_URL=http://localhost:3000

# Optional API Keys (for TTS and AI features)
# ELEVENLABS_API_KEY=your-key-here
# OPENAI_API_KEY=your-key-here
```

### Step 4: Restart the Server

After creating the `.env` file:

1. **Stop the current server** (Ctrl+C in the terminal running `bun run dev`)
2. **Start it again:**
   ```powershell
   cd backend
   bun run dev
   ```

### Step 5: Verify It's Running

Look for this message in the terminal:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server is running on port 3000
🔗 Base URL: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then test:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health
```

Should return: `{"status":"ok"}`

## Common Errors

### "BETTER_AUTH_SECRET must be at least 32 characters"
- Make sure your secret is 32+ characters long
- Check for typos in the `.env` file

### "Environment variable validation failed"
- Check that `.env` file is in the `backend/` directory
- Make sure there are no spaces around the `=` sign
- Verify the file is named exactly `.env` (not `.env.txt`)

### "Connection refused"
- Server hasn't started yet
- Check terminal for error messages
- Verify `.env` file exists and is valid

## Full .env Template

For reference, here's a complete `.env` template:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=file:dev.db

# Auth (REQUIRED - must be 32+ characters)
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security

# Backend URL
BACKEND_URL=http://localhost:3000

# API Keys (Optional - uncomment and add your keys)
# ELEVENLABS_API_KEY=sk-...
# OPENAI_API_KEY=sk-...
```

## Next Steps

Once the server is running:
1. ✅ Test health endpoint: `http://localhost:3000/health`
2. ✅ Test audio serving: `http://localhost:3000/api/audio/binaural/...`
3. ✅ Start frontend and test the app

