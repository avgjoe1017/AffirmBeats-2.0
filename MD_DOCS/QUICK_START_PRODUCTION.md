# Quick Start: Production Deployment

**Last Updated**: 2025-01-XX  
**Status**: Ready for Production

## Overview

This guide provides a quick reference for deploying Recenter to production.

## Prerequisites Checklist

- [ ] PostgreSQL database (Supabase, Railway, Neon, etc.)
- [ ] Redis instance (optional, for rate limiting and caching)
- [ ] Sentry account (optional, for error tracking)
- [ ] Production server (Railway, Render, Fly.io, etc.)
- [ ] Domain name (optional)

## Quick Setup Steps

### 1. Database Setup (5 minutes)

```bash
# 1. Set up PostgreSQL database (Supabase, Railway, or Neon)
# 2. Get connection string
# 3. Update Prisma schema
# 4. Run migrations
cd backend
bunx prisma migrate deploy
```

### 2. Environment Variables (2 minutes)

```bash
# Copy .env.example to .env
cp backend/.env.example backend/.env

# Fill in required variables
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-key-here
BACKEND_URL=https://your-backend-url.com
```

### 3. Optional Services (5 minutes each)

#### Sentry (Error Tracking)

```bash
# 1. Create Sentry account
# 2. Get DSN
# 3. Set environment variables
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

#### Redis (Rate Limiting & Caching)

```bash
# 1. Set up Redis instance
# 2. Get connection string
# 3. Set environment variable
REDIS_URL=redis://default:password@host:port
```

#### Metrics (Prometheus, DataDog, or CloudWatch)

```bash
# Prometheus (no configuration needed)
# Access metrics at: /api/metrics/prometheus

# DataDog
DATADOG_API_KEY=your-api-key
DATADOG_APP_KEY=your-app-key

# CloudWatch
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### 4. Verify Setup (1 minute)

```bash
# Run verification script
bun run scripts/verify-production-setup.ts
```

### 5. Deploy (5 minutes)

```bash
# Build application
cd backend
bun run build

# Run migrations
bunx prisma migrate deploy

# Start server
bun run start
```

### 6. Verify Deployment (1 minute)

```bash
# Check health endpoint
curl https://your-backend-url.com/health

# Check metrics endpoint
curl https://your-backend-url.com/api/metrics
```

## Environment Variables Reference

### Required

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-key-here
BACKEND_URL=https://your-backend-url.com
```

### Optional

```bash
# API Keys
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Redis
REDIS_URL=redis://default:password@host:port

# Metrics
DATADOG_API_KEY=your-datadog-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Logging
LOG_LEVEL=info
```

## Common Deployment Platforms

### Railway

1. Connect GitHub repository
2. Add PostgreSQL database
3. Add Redis database (optional)
4. Set environment variables
5. Deploy

### Render

1. Connect GitHub repository
2. Add PostgreSQL database
3. Add Redis database (optional)
4. Set environment variables
5. Deploy

### Fly.io

1. Install Fly CLI
2. Run `fly launch`
3. Add PostgreSQL database
4. Add Redis database (optional)
5. Set environment variables
6. Deploy

## Verification Checklist

- [ ] Database connected (PostgreSQL)
- [ ] Migrations run successfully
- [ ] Health check returns 200 OK
- [ ] Metrics endpoint accessible
- [ ] Sentry configured (optional)
- [ ] Redis configured (optional)
- [ ] Environment variables set correctly
- [ ] Logging working correctly
- [ ] Error tracking working correctly
- [ ] Rate limiting working correctly
- [ ] Caching working correctly

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
bun run scripts/setup-postgresql.ts

# Check DATABASE_URL is correct
# Verify database is accessible
# Check firewall settings
```

### Redis Connection Issues

```bash
# Test Redis connection
import { isRedisAvailable } from "./lib/redis";
const available = await isRedisAvailable();

# Check REDIS_URL is correct
# Verify Redis is accessible
# Check firewall settings
```

### Sentry Issues

```bash
# Verify SENTRY_DSN is correct
# Check Sentry dashboard for errors
# Verify SENTRY_ENVIRONMENT is set
```

## Next Steps

After deployment:
1. Set up monitoring and alerting
2. Configure backups
3. Set up CI/CD pipeline
4. Monitor performance
5. Optimize as needed

## Resources

- [Production Configuration Guide](./PRODUCTION_CONFIGURATION.md)
- [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md)
- [Sentry Setup Guide](./SENTRY_SETUP_GUIDE.md)
- [Production Metrics Integration](./PRODUCTION_METRICS_INTEGRATION.md)

---

**Status**: Ready for Production  
**Next Step**: Set up PostgreSQL database and configure environment variables
