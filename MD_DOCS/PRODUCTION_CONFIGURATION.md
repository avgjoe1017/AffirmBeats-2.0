# Production Configuration Guide

**Last Updated**: 2025-01-XX  
**Status**: Ready for Production

## Overview

This guide provides step-by-step instructions for configuring the Recenter application for production deployment.

## Prerequisites

- Production server or hosting platform (Railway, Render, Fly.io, etc.)
- PostgreSQL database (Supabase, Railway, Neon, etc.)
- Redis instance (optional, for rate limiting and caching)
- Sentry account (optional, for error tracking)
- Domain name (optional, for production)

## Configuration Steps

### 1. Database Migration (SQLite → PostgreSQL)

#### Step 1.1: Set Up PostgreSQL Database

Choose a PostgreSQL provider:

**Option A: Supabase (Recommended)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Option B: Railway**
1. Create account at [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Get connection string from Variables tab
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/railway`

**Option C: Neon**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Get connection string from Dashboard
4. Format: `postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]`

#### Step 1.2: Update Prisma Schema

Update `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

#### Step 1.3: Update Environment Variables

Set `DATABASE_URL` in your production environment:

```bash
DATABASE_URL=postgresql://postgres:password@host:5432/database
```

#### Step 1.4: Run Migrations

```bash
cd backend
bunx prisma migrate deploy
```

#### Step 1.5: Migrate Data (If Existing)

If you have existing SQLite data:

```bash
# Set SQLite database path
export SQLITE_DATABASE_URL=file:dev.db

# Set PostgreSQL connection string
export DATABASE_URL=postgresql://...

# Run migration script
bun run scripts/migrate-to-postgresql.ts
```

#### Step 1.6: Verify Migration

```bash
# Test database connection
bun run scripts/setup-postgresql.ts

# Verify data
bunx prisma studio
```

### 2. Sentry Configuration

#### Step 2.1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Create account (free tier available)
3. Create new project:
   - Backend: Node.js
   - Frontend: React Native

#### Step 2.2: Get Sentry DSN

1. Go to Settings → Projects → Your Project
2. Copy the DSN (Data Source Name)
3. Format: `https://your-sentry-dsn@sentry.io/project-id`

#### Step 2.3: Configure Environment Variables

Set in your production environment:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

#### Step 2.4: Verify Sentry Integration

The Sentry integration is already set up in `backend/src/lib/sentry.ts`. It will automatically:
- Initialize Sentry when `SENTRY_DSN` is set
- Track errors automatically via logger
- Send errors to Sentry dashboard

#### Step 2.5: Test Sentry

```bash
# Test error tracking (in your application)
import { logger } from "./lib/logger";

logger.error("Test error", new Error("This is a test error"));
```

### 3. Redis Configuration

#### Step 3.1: Set Up Redis Instance

Choose a Redis provider:

**Option A: Redis Cloud (Recommended)**
1. Create account at [redis.com](https://redis.com)
2. Create new database
3. Get connection string from Configuration
4. Format: `redis://default:password@host:port`

**Option B: Railway**
1. Create account at [railway.app](https://railway.app)
2. Create new Redis database
3. Get connection string from Variables tab
4. Format: `redis://default:password@host:port`

**Option C: Self-Hosted**
1. Install Redis on your server
2. Configure Redis
3. Get connection string
4. Format: `redis://localhost:6379`

#### Step 3.2: Configure Environment Variables

Set in your production environment:

```bash
REDIS_URL=redis://default:password@host:port
```

#### Step 3.3: Verify Redis Integration

The Redis integration is already set up in `backend/src/lib/redis.ts`. It will automatically:
- Initialize Redis when `REDIS_URL` is set
- Use Redis for rate limiting and caching
- Fall back to in-memory if Redis is unavailable

#### Step 3.4: Test Redis

```bash
# Test Redis connection (in your application)
import { isRedisAvailable } from "./lib/redis";

const available = await isRedisAvailable();
console.log("Redis available:", available);
```

### 4. DataDog Configuration (Optional)

#### Step 4.1: Create DataDog Account

1. Go to [datadoghq.com](https://datadoghq.com)
2. Create account (free tier available)
3. Get API keys from Organization Settings → API Keys

#### Step 4.2: Get DataDog API Keys

1. Go to Organization Settings → API Keys
2. Create new API key
3. Copy the API key and Application key

#### Step 4.3: Configure Environment Variables

Set in your production environment:

```bash
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
DATADOG_SITE=datadoghq.com
```

**Available DataDog Sites:**
- `datadoghq.com` (US)
- `datadoghq.eu` (EU)
- `us3.datadoghq.com` (US3)
- `us5.datadoghq.com` (US5)
- `ap1.datadoghq.com` (AP1)

#### Step 4.4: Verify DataDog Integration

The DataDog integration is already set up in `backend/src/lib/metrics/datadog.ts`. It will automatically:
- Initialize DataDog when `DATADOG_API_KEY` is set
- Send metrics to DataDog every minute
- Track API requests, errors, database operations, cache operations, TTS generation, and session creation

#### Step 4.5: Test DataDog

1. Check DataDog dashboard for metrics
2. Verify metrics are being sent (may take a few minutes)
3. Check DataDog logs for any errors

### 5. AWS CloudWatch Configuration (Optional)

#### Step 5.1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create account (free tier available)
3. Create IAM user with CloudWatch permissions

#### Step 5.2: Get AWS Credentials

1. Go to IAM → Users → Your User
2. Create access key
3. Copy the Access Key ID and Secret Access Key
4. Grant CloudWatch permissions:
   - `cloudwatch:PutMetricData`
   - `cloudwatch:GetMetricStatistics` (optional)

#### Step 5.3: Configure Environment Variables

Set in your production environment:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
CLOUDWATCH_NAMESPACE=Recenter
```

#### Step 5.4: Install CloudWatch SDK (Optional)

For better performance, install the AWS SDK v3:

```bash
cd backend
bun add @aws-sdk/client-cloudwatch
```

**Note:** The integration will fall back to `aws-sdk` v2 if v3 is not installed.

#### Step 5.5: Verify CloudWatch Integration

The CloudWatch integration is already set up in `backend/src/lib/metrics/cloudwatch.ts`. It will automatically:
- Initialize CloudWatch when AWS credentials are set
- Send metrics to CloudWatch every minute
- Track API requests, errors, database operations, cache operations, TTS generation, and session creation

#### Step 5.6: Test CloudWatch

1. Check CloudWatch dashboard for metrics
2. Verify metrics are being sent (may take a few minutes)
3. Check CloudWatch logs for any errors

### 6. Environment Variables Summary

#### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here-must-be-at-least-32-characters-long

# Backend URL
BACKEND_URL=https://your-backend-url.com
```

#### Optional Variables

```bash
# API Keys
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Sentry (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Redis (optional)
REDIS_URL=redis://default:password@host:port

# Logging (optional)
LOG_LEVEL=info

# DataDog (optional, for production metrics)
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
DATADOG_SITE=datadoghq.com

# AWS CloudWatch (optional, for production metrics)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
CLOUDWATCH_NAMESPACE=Recenter
```

### 7. Production Deployment

#### Step 7.1: Build Application

```bash
cd backend
bun run build
```

#### Step 7.2: Run Migrations

```bash
bunx prisma migrate deploy
```

#### Step 7.3: Start Server

```bash
bun run start
```

#### Step 7.4: Verify Health Check

```bash
curl https://your-backend-url.com/health
```

### 8. Monitoring and Observability

#### Health Check

The health check endpoint (`/health`) provides:
- Database connectivity status
- Redis connectivity status
- Metrics snapshot (total requests, error rate)
- Server uptime and version

#### Metrics

Access metrics via `/api/metrics`:
- API request metrics
- Error metrics
- Database operation metrics
- Cache operation metrics
- TTS generation metrics
- Session creation metrics

#### Logging

All logs are structured and include:
- Timestamp
- Log level
- Context information
- Error details (if applicable)

### 9. Security Considerations

#### Environment Variables

- Never commit `.env` files to version control
- Use secure secret management (e.g., Railway, Render secrets)
- Rotate secrets regularly
- Use different secrets for development and production

#### Database Security

- Use strong passwords
- Enable SSL/TLS for database connections
- Restrict database access to your application server
- Regular backups

#### API Security

- Rate limiting is enabled (Redis-backed in production)
- Input validation with Zod
- Error handling with consistent error codes
- CORS configured for your frontend domain

### 10. Performance Optimization

#### Database

- Use connection pooling (handled by Prisma)
- Indexes are already in place for common queries
- Regular database maintenance

#### Caching

- Redis caching for frequently accessed data
- Cache invalidation on data updates
- TTL-based cache expiration

#### Rate Limiting

- Redis-backed rate limiting in production
- Configurable limits per endpoint
- Graceful fallback to in-memory if Redis unavailable

### 11. Backup and Recovery

#### Database Backups

- Set up automated backups for PostgreSQL
- Test backup restoration regularly
- Keep backups for at least 30 days

#### Application Backups

- Version control (Git)
- Database migrations
- Environment variable backups (secure storage)

### 12. Troubleshooting

#### Database Connection Issues

```bash
# Test database connection
bun run scripts/setup-postgresql.ts

# Check database logs
# Verify DATABASE_URL is correct
# Check firewall settings
```

#### Redis Connection Issues

```bash
# Test Redis connection
import { isRedisAvailable } from "./lib/redis";
const available = await isRedisAvailable();

# Check Redis logs
# Verify REDIS_URL is correct
# Check firewall settings
```

#### Sentry Issues

```bash
# Verify Sentry DSN
# Check Sentry dashboard for errors
# Verify SENTRY_ENVIRONMENT is set correctly
```

### 13. Verification Checklist

- [ ] PostgreSQL database set up and accessible
- [ ] Prisma schema updated to use PostgreSQL
- [ ] Migrations run successfully
- [ ] Data migrated (if applicable)
- [ ] Sentry configured and working
- [ ] Redis configured and working (optional)
- [ ] DataDog configured and working (optional)
- [ ] CloudWatch configured and working (optional)
- [ ] Environment variables set correctly
- [ ] Health check returns 200 OK
- [ ] Metrics endpoint accessible
- [ ] Prometheus metrics available at `/api/metrics/prometheus`
- [ ] Logging working correctly
- [ ] Error tracking working correctly
- [ ] Rate limiting working correctly
- [ ] Caching working correctly
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Documentation updated

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Sentry Documentation](https://docs.sentry.io/)
- [Redis Documentation](https://redis.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Neon Documentation](https://neon.tech/docs)

---

**Next Steps**: Configure production environment variables and deploy

