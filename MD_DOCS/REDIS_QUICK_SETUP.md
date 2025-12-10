# Redis Quick Setup - 30 Minutes

**Last Updated**: 2025-01-XX

This is a quick guide to get Redis working for improved rate limiting performance.

---

## Why Redis?

- ✅ **Better Performance**: Faster rate limiting than in-memory
- ✅ **Distributed**: Works across multiple server instances
- ✅ **Scalable**: Handles high traffic better
- ✅ **Optional**: System works fine without it (uses in-memory fallback)

---

## Quick Setup with Upstash (Recommended - 15 minutes)

### Step 1: Create Upstash Account (2 minutes)

1. Go to [upstash.com](https://upstash.com)
2. Click "Sign Up" (or "Sign In" if you have an account)
3. Sign up with GitHub/Google (easiest) or email

### Step 2: Create Redis Database (3 minutes)

1. **Click "Create Database"** (big button on dashboard)
2. **Configure**:
   - **Name**: `Recenter Backend` (or your choice)
   - **Type**: Regional (or Global if you need multi-region)
   - **Region**: Choose closest to your backend (e.g., `us-east-1`)
   - **Primary Region**: Same as region
   - **TLS**: Enabled (recommended)
3. **Click "Create"**

### Step 3: Get Connection String (2 minutes)

1. **After creation**, you'll see your database dashboard
2. **Click on "Details"** tab (or look for connection info)
3. **Copy the `REDIS_URL`**:
   - It will look like: `rediss://default:xxxxx@xxxxx.upstash.io:6379`
   - Or: `rediss://default:xxxxx@xxxxx-xxxxx.upstash.io:6379`
4. **Important**: Make sure it starts with `rediss://` (double 's' for SSL)

### Step 4: Add to Environment (1 minute)

1. **Open** `backend/.env` file
2. **Add this line**:
   ```bash
   REDIS_URL=rediss://default:your-password-here@your-host.upstash.io:6379
   ```
3. **Replace** with your actual connection string from Step 3
4. **Save** the file

### Step 5: Restart Backend (1 minute)

1. **Stop your backend** (Ctrl+C)
2. **Start it again**:
   ```bash
   cd backend
   bun run dev
   ```
3. **Check logs** - you should see:
   ```
   ✅ Redis connected { url: 'rediss://...' }
   ✅ Redis ready
   ```

### Step 6: Verify (1 minute)

Run the QA test:
```bash
cd backend
bun run test:qa
```

Look for:
```
✅ Redis Connection: Redis is available and connected
```

Or check health endpoint:
```bash
curl http://localhost:3000/health
```

Should show:
```json
{
  "checks": {
    "redis": "ok"
  }
}
```

---

## Alternative: Redis Cloud (15 minutes)

If you prefer Redis Cloud:

1. **Sign up**: [redis.com/cloud](https://redis.com/cloud)
2. **Create Database**:
   - Choose free tier (30MB)
   - Select region
   - Create database
3. **Get Connection String**:
   - Go to database → Configuration
   - Copy `Public endpoint` or connection URL
   - Format: `redis://:password@host:port`
4. **Add to `.env`**:
   ```bash
   REDIS_URL=redis://:your-password@your-host:port
   ```
5. **Restart backend**

---

## Troubleshooting

### "Redis URL not configured"

**Check**:
- ✅ `.env` file exists in `backend/` directory
- ✅ `REDIS_URL` line is in the file
- ✅ No extra spaces or quotes
- ✅ You restarted the server after adding it

### "Redis connection failed"

**Check**:
- ✅ Connection string format is correct
- ✅ For Upstash: Use `rediss://` (double 's' for SSL)
- ✅ Password is correct
- ✅ Network/firewall allows connection

### "Redis not available" in health check

**Check**:
- ✅ Backend logs show "Redis connected"
- ✅ Connection string is correct
- ✅ Redis server is running (if self-hosted)

---

## What Happens Next?

Once configured:
- ✅ Rate limiting automatically uses Redis
- ✅ Better performance for high-traffic scenarios
- ✅ Distributed rate limiting across servers
- ✅ Automatic fallback to in-memory if Redis fails

**No code changes needed** - it's automatic!

---

## Quick Reference

**Upstash Connection String Format**:
```
rediss://default:password@host.upstash.io:6379
```

**Redis Cloud Connection String Format**:
```
redis://:password@host:port
```

**Verify**:
```bash
cd backend
bun run test:qa
```

**See Also**:
- `MD_DOCS/REDIS_SETUP_GUIDE.md` - Comprehensive guide
- `backend/src/lib/redis.ts` - Implementation

---

**That's it!** Redis will automatically improve your rate limiting performance. 🚀

