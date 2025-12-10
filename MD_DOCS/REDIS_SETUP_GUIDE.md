# Redis Setup Guide

**Last Updated**: 2025-01-XX

This guide explains how to set up Redis for improved rate limiting performance and caching in production.

---

## Why Redis?

Redis provides several benefits:
- **Distributed Rate Limiting**: Rate limits work across multiple server instances
- **Better Performance**: Faster than in-memory rate limiting for high-traffic scenarios
- **Caching**: Can be used for caching frequently accessed data
- **Persistence**: Optional persistence for rate limit data

**Note**: Redis is optional. The rate limiting system automatically falls back to in-memory storage if Redis is not configured.

---

## Quick Setup Options

### Option 1: Upstash (Recommended for Serverless)

**Best for**: Serverless deployments, easy setup, free tier available

1. **Sign up**: Go to [upstash.com](https://upstash.com)
2. **Create Redis Database**:
   - Click "Create Database"
   - Choose region closest to your backend
   - Select "Regional" (or "Global" for multi-region)
3. **Get Connection String**:
   - Copy the `REDIS_URL` from the database dashboard
   - Format: `rediss://default:password@host:port`
4. **Set Environment Variable**:
   ```bash
   REDIS_URL=rediss://default:your-password@your-host:port
   ```

**Free Tier**: 10,000 commands/day, 256MB storage

---

### Option 2: Redis Cloud (Redis Labs)

**Best for**: Traditional deployments, high performance

1. **Sign up**: Go to [redis.com/cloud](https://redis.com/cloud)
2. **Create Database**:
   - Choose plan (free tier available)
   - Select region
   - Create database
3. **Get Connection String**:
   - Go to database settings
   - Copy connection URL
   - Format: `redis://:password@host:port`
4. **Set Environment Variable**:
   ```bash
   REDIS_URL=redis://:your-password@your-host:port
   ```

**Free Tier**: 30MB storage, basic features

---

### Option 3: Railway

**Best for**: If already using Railway for other services

1. **Create Redis Service**:
   - In Railway dashboard, click "New"
   - Select "Redis"
   - Deploy
2. **Get Connection String**:
   - Go to Redis service
   - Copy `REDIS_URL` from variables
3. **Set Environment Variable**:
   ```bash
   REDIS_URL=redis://default:password@host:port
   ```

---

### Option 4: Self-Hosted (Advanced)

**Best for**: Full control, existing infrastructure

1. **Install Redis**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # macOS
   brew install redis
   
   # Docker
   docker run -d -p 6379:6379 redis:latest
   ```

2. **Configure Redis**:
   - Edit `/etc/redis/redis.conf` (or your config file)
   - Set `bind 0.0.0.0` (if accessing remotely)
   - Set `requirepass your-password` (for security)

3. **Start Redis**:
   ```bash
   # Systemd
   sudo systemctl start redis
   sudo systemctl enable redis
   
   # Docker
   docker start redis-container
   ```

4. **Set Environment Variable**:
   ```bash
   REDIS_URL=redis://:password@localhost:6379
   # Or for remote
   REDIS_URL=redis://:password@your-server-ip:6379
   ```

---

## Configuration

### Environment Variable

Add to your `.env` file or environment:

```bash
REDIS_URL=redis://:password@host:port
# Or for SSL/TLS
REDIS_URL=rediss://:password@host:port
```

### Connection String Formats

- **Standard**: `redis://:password@host:port`
- **With Username**: `redis://username:password@host:port`
- **SSL/TLS**: `rediss://:password@host:port` (note the double 's')
- **Local**: `redis://localhost:6379`
- **No Password**: `redis://host:port` (not recommended for production)

---

## Verification

### 1. Check Backend Logs

When the backend starts, you should see:

```
✅ Redis connected { url: 'redis://...' }
✅ Redis ready
```

If Redis is not configured, you'll see:

```
⚠️ Redis URL not configured, Redis features will be disabled
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Response should include:

```json
{
  "status": "ok",
  "checks": {
    "redis": "ok"
  }
}
```

### 3. Test Rate Limiting

Rate limiting will automatically use Redis if available. You can verify by:

1. Making requests to a rate-limited endpoint
2. Checking Redis for rate limit keys:
   ```bash
   redis-cli
   KEYS ratelimit:*
   ```

---

## Troubleshooting

### Connection Failed

**Error**: `Redis connection failed`

**Solutions**:
1. Check `REDIS_URL` is set correctly
2. Verify Redis server is running
3. Check firewall/network access
4. Verify password is correct
5. For SSL connections, ensure URL uses `rediss://` (double 's')

### Rate Limiting Still Using In-Memory

**Issue**: Rate limiting falls back to in-memory even with Redis configured

**Solutions**:
1. Check backend logs for Redis connection errors
2. Verify `REDIS_URL` environment variable is set
3. Test Redis connection: `redis-cli -u $REDIS_URL ping`
4. Check Redis server logs for errors

### Performance Issues

**Issue**: Redis is slow

**Solutions**:
1. Use Redis Cloud/Upstash (managed, optimized)
2. Check network latency to Redis server
3. Consider using Redis in same region as backend
4. Monitor Redis memory usage
5. Check for connection pool issues

---

## Production Best Practices

1. **Use SSL/TLS**: Always use `rediss://` for production connections
2. **Password Protection**: Always set a strong password
3. **Connection Pooling**: The `ioredis` library handles this automatically
4. **Monitoring**: Set up alerts for Redis connection failures
5. **Backup**: Configure Redis persistence if needed (optional for rate limiting)
6. **Region**: Deploy Redis in same region as backend for low latency

---

## Cost Considerations

### Free Tier Options

- **Upstash**: 10,000 commands/day free
- **Redis Cloud**: 30MB storage free
- **Self-Hosted**: Free (server costs only)

### Paid Options

- **Upstash**: Pay-as-you-go, ~$0.20 per 100K commands
- **Redis Cloud**: Starting at $0.028/hour (~$20/month)
- **Self-Hosted**: Server costs only

**For Rate Limiting**: Free tiers are usually sufficient for small to medium apps.

---

## Integration Status

✅ **Already Implemented**:
- Redis client initialization (`backend/src/lib/redis.ts`)
- Automatic fallback to in-memory if Redis unavailable
- Rate limiting uses Redis when available
- Caching helpers use Redis when available
- Health check includes Redis status

**No Code Changes Needed**: Just set the `REDIS_URL` environment variable!

---

## Next Steps

1. Choose a Redis provider (Upstash recommended for ease)
2. Create Redis database
3. Set `REDIS_URL` environment variable
4. Restart backend server
5. Verify connection in logs
6. Test rate limiting

---

**See Also**:
- `PRODUCTION_INSTRUCTIONS.md` - General production setup
- `backend/src/lib/redis.ts` - Redis implementation
- `backend/src/middleware/rateLimit.ts` - Rate limiting implementation

