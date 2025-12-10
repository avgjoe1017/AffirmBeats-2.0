# Network Timeout Fix Guide

**Date:** 2025-01-XX

## Problem

All API requests are timing out with errors like:
```
Network request timed out after 30000ms
Failed to load preferences: [Error: Network request timed out after 30000ms]
Failed to load sessions: [Error: Network request timed out after 30000ms]
```

## Root Cause

The backend server is either:
1. **Not running** - Most common issue
2. **Running but not accessible** - Wrong URL or network configuration
3. **Running but bound to wrong interface** - Only listening on localhost when network IP is needed

## Quick Fix Steps

### Step 1: Check if Backend is Running

```powershell
# Test if backend is accessible
Test-NetConnection -ComputerName localhost -Port 3000

# Or try to hit the health endpoint
Invoke-WebRequest -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue
```

**If this fails**, the backend is not running. Go to Step 2.

### Step 2: Start the Backend Server

```powershell
cd "C:\Users\joeba\Documents\AffirmBeats 2.0\backend"
bun run dev
```

You should see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server is running on port 3000
🔗 Base URL: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3: Verify Backend URL Configuration

Check your root `.env` file:
```powershell
cd "C:\Users\joeba\Documents\AffirmBeats 2.0"
Get-Content .env | Select-String "EXPO_PUBLIC_BACKEND_URL"
```

**For local development (emulator/simulator):**
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

**For physical device testing:**
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.86.21:3000
```

**Important:** If using a network IP, ensure:
1. Your computer and device are on the same network
2. Windows Firewall allows connections on port 3000
3. The backend server is bound to `0.0.0.0` (not just `localhost`)

### Step 4: Restart Expo Dev Server

After changing `.env`, restart Expo to pick up the new environment variable:

```powershell
# Stop current Expo server (Ctrl+C)
# Then restart with cleared cache
npx expo start --clear
```

### Step 5: Verify Fix

Check the Expo logs. You should see:
```
LOG  [api.ts] Backend URL configured: http://localhost:3000
LOG  [api.ts] Making GET request to: http://localhost:3000/api/preferences
LOG  [api.ts] Response status: 200 OK
```

Instead of timeout errors.

## Common Issues

### Issue: Backend starts but still times out

**Solution:** Check if backend is bound to the correct interface:
- If using `localhost` in `.env`, backend should work with default settings
- If using network IP, backend must bind to `0.0.0.0` (check `backend/src/index.ts`)

### Issue: Works on emulator but not physical device

**Solution:** 
1. Use your computer's local network IP instead of `localhost`
2. Find your IP: `ipconfig` (look for IPv4 Address)
3. Update `.env`: `EXPO_PUBLIC_BACKEND_URL=http://[YOUR_IP]:3000`
4. Ensure Windows Firewall allows port 3000

### Issue: Backend won't start

**Solution:** Check `MD_DOCS/BACKEND_ENV_SETUP.md` for environment setup instructions.

## Prevention

1. **Always start backend before frontend** during development
2. **Use `localhost` for emulator/simulator** - simpler and more reliable
3. **Check backend logs** if requests fail - they often show the real issue
4. **Test health endpoint** before starting frontend: `http://localhost:3000/health`

## Related Documentation

- `MD_DOCS/TROUBLESHOOTING_NETWORK_ISSUES.md` - General network troubleshooting
- `MD_DOCS/BACKEND_ENV_SETUP.md` - Backend environment setup
- `MD_DOCS/TROUBLESHOOTING_SERVER.md` - Server startup issues

