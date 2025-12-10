# Backend Startup Fix

**Issue:** Network requests failing - backend not accessible

## Quick Fix

### 1. Start the Backend Server

```bash
cd backend
bun run dev
```

The backend should start on port 3000 and show:
```
🚀 Server is running on port 3000
🔗 Base URL: http://localhost:3000
```

### 2. Verify Backend is Running

Check if port 3000 is listening:
- **Windows PowerShell:**
  ```powershell
  Get-NetTCPConnection -LocalPort 3000
  ```

- **Or test the health endpoint:**
  ```bash
  curl http://localhost:3000/health
  ```

### 3. Check Network Configuration

The frontend is trying to connect to `http://192.168.86.21:3000`. Verify:

1. **Backend is accessible at that IP:**
   - Backend might be running on `localhost:3000` but not accessible on network IP
   - Check if backend binds to `0.0.0.0` (all interfaces) or just `127.0.0.1` (localhost only)

2. **Frontend BACKEND_URL matches backend IP:**
   - Check `.env` file: `EXPO_PUBLIC_BACKEND_URL`
   - Should match the IP where backend is accessible

3. **Firewall/Network:**
   - Windows Firewall might be blocking port 3000
   - Network might not allow connections between devices

## Common Issues

### Backend Crashes on Startup

**Check:**
- Database connection (DATABASE_URL)
- Required environment variables (BETTER_AUTH_SECRET, etc.)
- Port 3000 already in use

**Solution:**
```bash
cd backend
# Check logs for errors
bun run dev
```

### Backend Running but Not Accessible

**Problem:** Backend only binds to localhost, not network IP

**Solution:** The Hono server should bind to `0.0.0.0` by default, but verify in `backend/src/index.ts`:
```typescript
serve({ fetch: app.fetch, port: Number(env.PORT), hostname: "0.0.0.0" })
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
1. Find process using port 3000:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
   ```
2. Kill the process or use a different port

### Network Request Failed (Not Timeout)

**Difference:**
- **Timeout:** Backend is slow but responding (now handled with 60s timeout)
- **Failed:** Backend is not reachable at all

**Causes:**
- Backend not running
- Wrong IP address
- Network/firewall blocking
- Backend crashed

## Testing Backend

1. **Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test from Frontend IP:**
   ```bash
   curl http://192.168.86.21:3000/health
   ```

3. **Check Backend Logs:**
   - Look for startup messages
   - Check for error messages
   - Verify routes are mounted

## Expected Backend Output

When backend starts successfully, you should see:
```
✅ Environment variables validated successfully
🔐 [Auth] Better Auth initialized
🚀 Server is running on port 3000
🔗 Base URL: http://localhost:3000
```

If you see errors, check:
- Database connection
- Missing environment variables
- Port conflicts

