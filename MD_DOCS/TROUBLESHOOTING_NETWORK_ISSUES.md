# Troubleshooting Network Issues

**Date:** 2024-12-19

## Common Issues and Solutions

### 1. Network Request Timeout

**Symptoms:**
- Error: `Network request timed out after 30000ms` or `Network request timed out after 60000ms`
- All API requests failing with timeout errors
- Requests hang indefinitely

**Causes:**
- **Backend server not running** (most common)
- Backend server overloaded/slow
- Network connectivity issues
- Backend URL misconfigured (localhost vs network IP)
- Backend taking longer than timeout (60s for generation, 30s for others)

**Solutions:**

1. **Check if backend is running:**
   ```powershell
   # Check if port 3000 is in use
   Test-NetConnection -ComputerName localhost -Port 3000
   
   # Start backend if not running
   cd backend
   bun run dev
   ```

2. **Verify backend URL configuration:**
   - Check `.env` file in root directory
   - For local development, use: `EXPO_PUBLIC_BACKEND_URL=http://localhost:3000`
   - For physical device testing, use: `EXPO_PUBLIC_BACKEND_URL=http://[YOUR_LOCAL_IP]:3000`
   - **Important:** If using network IP, ensure backend is bound to `0.0.0.0` not just `localhost`

3. **Test backend connectivity:**
   ```powershell
   # Test localhost
   Invoke-WebRequest -Uri "http://localhost:3000/health"
   
   # Test network IP (if using one)
   Invoke-WebRequest -Uri "http://192.168.86.21:3000/health"
   ```

4. **Check backend logs** for errors or slow queries

5. **Restart Expo dev server** after changing `.env`:
   ```powershell
   # Clear cache and restart
   npx expo start --clear
   ```

6. **Increase timeout** if needed (in `src/lib/api.ts`):
   ```typescript
   const timeoutMs = path.includes("/generate") ? 120000 : 60000; // Increase if needed
   ```

### 2. 404 Errors for Playlist Endpoint

**Symptoms:**
- Error: `Failed to fetch playlist: 404`
- Falls back to legacy TTS system

**Causes:**
- Session doesn't have individual affirmations yet
- Session was created before playlist system was implemented
- Session ID is invalid

**Solutions:**
1. **Regenerate session** - New sessions will have individual affirmations
2. **Check session exists** in database
3. **Verify session has SessionAffirmation records**

**Note:** This is expected behavior - the app falls back to legacy system automatically.

### 3. Background Audio File Errors (-1008)

**Symptoms:**
- Error: `AVPlayerItem instance has failed with error code -1008`
- Background sound doesn't play

**Causes:**
- Audio file doesn't exist at URL
- Network error loading file
- File path/name mismatch

**Solutions:**
1. **Check if file exists** in `assets/audio/background/` or `raw audio files/`
2. **Verify file name** matches exactly (case-sensitive)
3. **Check backend audio route** is serving files correctly
4. **Test URL directly** in browser

**Note:** App continues without background sound - this is non-fatal.

### 4. Backend Slow Queries

**Symptoms:**
- Slow request warnings in logs
- Admin dashboard takes 2-3 seconds

**Causes:**
- N+1 query problems (now fixed in playlist endpoint)
- Missing database indexes
- Large dataset queries

**Solutions:**
1. **Check database indexes** - Ensure frequently queried fields are indexed
2. **Optimize queries** - Use batch loading instead of N+1 queries
3. **Add caching** for frequently accessed data
4. **Monitor slow queries** in logs

## Debugging Steps

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check backend logs** for errors

3. **Check network tab** in browser/dev tools for failed requests

4. **Verify environment variables:**
   - `EXPO_PUBLIC_BACKEND_URL` is set correctly
   - Backend URL is accessible from device/emulator

5. **Test endpoints directly:**
   ```bash
   curl http://YOUR_BACKEND_URL/api/health
   curl http://YOUR_BACKEND_URL/api/sessions
   ```

## Network Configuration

### Development
- Backend typically runs on `http://localhost:3000` or `http://192.168.x.x:3000`
- Frontend connects via `EXPO_PUBLIC_BACKEND_URL` env variable

### Production
- Backend URL should be HTTPS
- CORS configured correctly
- Network timeouts appropriate for production latency

## Timeout Values

Current timeout configuration:
- **Session generation:** 60 seconds (longer due to AI processing)
- **Other requests:** 30 seconds

These can be adjusted in `src/lib/api.ts` if needed.

