# Troubleshooting: Server Won't Start

## Problem: "Connection refused" on localhost:3000

This means the server isn't running. Let's diagnose why.

## Step 1: Check if Server is Running

Look at your terminal where you ran `bun run dev`. Do you see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server is running on port 3000
🔗 Base URL: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If NO** → Server hasn't started. Continue to Step 2.

**If YES** → Server is running but something else is wrong. Skip to Step 5.

## Step 2: Check for Error Messages

Look at the terminal output. Common errors:

### Error: "BETTER_AUTH_SECRET must be at least 32 characters"
**Solution:** Check your `.env` file has a valid secret (32+ chars)

### Error: "Environment variable validation failed"
**Solution:** 
1. Verify `.env` file exists in `backend/` directory
2. Check file is named exactly `.env` (not `.env.txt`)
3. Verify no spaces around `=` signs
4. Check for typos

### Error: "Port 3000 is already in use"
**Solution:**
```powershell
# Find what's using port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
# Kill the process or change PORT in .env
```

### Error: "Cannot find module" or import errors
**Solution:**
```powershell
cd backend
bun install
```

## Step 3: Verify .env File

Check that `.env` file exists and has correct content:

```powershell
cd backend
Get-Content .env
```

Should show:
```
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security
PORT=3000
NODE_ENV=development
DATABASE_URL=file:dev.db
BACKEND_URL=http://localhost:3000
```

## Step 4: Try Starting Server Manually

1. **Stop any running server** (Ctrl+C)

2. **Navigate to backend:**
   ```powershell
   cd "C:\Users\joeba\Documents\AffirmBeats 2.0\backend"
   ```

3. **Start server:**
   ```powershell
   bun run dev
   ```

4. **Watch for errors** in the terminal output

## Step 5: Common Issues & Solutions

### Issue: Server starts but immediately crashes

**Check terminal for:**
- Database errors → Run `bun run postinstall` in backend
- Missing dependencies → Run `bun install` in backend
- Port conflicts → Change PORT in `.env` to 3001

### Issue: Server starts but health check fails

**Try:**
```powershell
# Test with curl instead
curl http://localhost:3000/health

# Or in browser
# Open: http://localhost:3000/health
```

### Issue: "Cannot find .env file"

**Solution:**
```powershell
cd backend
# Verify you're in the right directory
Get-Location
# Should show: ...\AffirmBeats 2.0\backend

# Check if .env exists
Test-Path .env
# Should return: True

# If False, create it:
@"
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security
PORT=3000
NODE_ENV=development
DATABASE_URL=file:dev.db
BACKEND_URL=http://localhost:3000
"@ | Out-File -FilePath .env -Encoding utf8
```

## Step 6: Full Clean Restart

If nothing works, try a clean restart:

```powershell
# 1. Stop server (Ctrl+C)

# 2. Navigate to backend
cd "C:\Users\joeba\Documents\AffirmBeats 2.0\backend"

# 3. Verify .env exists
Test-Path .env

# 4. Reinstall dependencies (optional)
bun install

# 5. Generate Prisma client
bun run postinstall

# 6. Start server
bun run dev
```

## What to Look For

When server starts successfully, you should see:

1. ✅ "✅ Environment variables validated successfully"
2. ✅ "🔧 Initializing Hono application..."
3. ✅ "🔐 Mounting Better Auth handler..."
4. ✅ "🎵 Mounting audio routes..."
5. ✅ "🚀 Server is running on port 3000"

**If you see errors before step 5, the server won't start.**

## Still Not Working?

Share the **full terminal output** from when you run `bun run dev`. Look for:
- Error messages (red text)
- Stack traces
- "Environment variable validation failed"
- Any lines starting with "❌"

The error message will tell us exactly what's wrong!

