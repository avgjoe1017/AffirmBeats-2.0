# Production Deployment Instructions

**Last Updated**: 2025-01-XX  
**Status**: Ready for Production

## Quick Start

1. **Set up PostgreSQL database** (5 minutes)
2. **Configure environment variables** (2 minutes)
3. **Run migrations** (1 minute)
4. **Deploy** (5 minutes)

## Step-by-Step Guide

### 1. Database Migration (SQLite → PostgreSQL)

#### Option A: Supabase (Recommended)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Option B: Railway

1. Create account at [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Get connection string from Variables tab

#### Option C: Neon

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Get connection string from Dashboard

#### Update Prisma Schema

1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Update User model ID to use `@default(cuid())`:
   ```prisma
   model User {
     id            String    @id @default(cuid())
     // ... rest of model
   }
   ```

3. Update Session model ID and token:
   ```prisma
   model Session {
     id        String   @id @default(cuid())
     token     String   @unique
     // ... rest of model
   }
   ```

4. Update Verification model ID:
   ```prisma
   model Verification {
     id         String   @id @default(cuid())
     // ... rest of model
   }
   ```

#### Run Migrations

```bash
cd backend
bunx prisma migrate dev --name migrate_to_postgres
```

#### Migrate Data (If Existing)

```bash
# Set SQLite database path
export SQLITE_DATABASE_URL=file:dev.db

# Set PostgreSQL connection string
export DATABASE_URL=postgresql://...

# Run migration script
bun run scripts/migrate-to-postgresql.ts
```

### 2. Configure Sentry

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Node.js)
3. Get DSN from Settings → Projects → Your Project
4. Set environment variables:
   ```bash
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   ```

### 3. Configure Redis

1. Set up Redis instance (Redis Cloud, Railway, or self-hosted)
2. Get connection string
3. Set environment variable:
   ```bash
   REDIS_URL=redis://default:password@host:port
   ```

### 4. Configure Production Metrics (Optional)

#### Prometheus (No Configuration Needed)

Metrics are automatically exported at `/api/metrics/prometheus`.

#### DataDog

1. Create account at [datadoghq.com](https://datadoghq.com)
2. Get API key from Organization Settings → API Keys
3. Get App key from Organization Settings → Application Keys
4. Set environment variables:
   ```bash
   DATADOG_API_KEY=your-api-key
   DATADOG_APP_KEY=your-app-key
   DATADOG_SITE=datadoghq.com
   ```

#### CloudWatch

1. Create AWS account
2. Create IAM user with CloudWatch permissions
3. Get access key and secret access key
4. Set environment variables:
   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   CLOUDWATCH_NAMESPACE=AffirmBeats
   ```

### 5. Environment Variables

#### Required

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-key-here-must-be-at-least-32-characters-long
BACKEND_URL=https://your-backend-url.com
```

#### Optional

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
DATADOG_APP_KEY=your-datadog-app-key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Logging
LOG_LEVEL=info
```

### 6. Verify Setup

```bash
# Run verification script
bun run scripts/verify-production-setup.ts
```

### 7. Deploy

```bash
# Build application
cd backend
bun run build

# Run migrations
bunx prisma migrate deploy

# Start server
bun run start
```

### 8. Verify Deployment

```bash
# Check health endpoint
curl https://your-backend-url.com/health

# Check metrics endpoint
curl https://your-backend-url.com/api/metrics

# Check Prometheus metrics
curl https://your-backend-url.com/api/metrics/prometheus
```

## Verification Checklist

- [ ] PostgreSQL database set up and accessible
- [ ] Prisma schema updated to use PostgreSQL
- [ ] Migrations run successfully
- [ ] Data migrated (if applicable)
- [ ] Sentry configured and working
- [ ] Redis configured and working (optional)
- [ ] Environment variables set correctly
- [ ] Health check returns 200 OK
- [ ] Metrics endpoint accessible
- [ ] Prometheus metrics accessible (if using Prometheus)
- [ ] DataDog metrics working (if using DataDog)
- [ ] CloudWatch metrics working (if using CloudWatch)
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

### Metrics Issues

```bash
# Check Prometheus endpoint
curl https://your-backend-url.com/api/metrics/prometheus

# Check DataDog API key
# Verify DataDog dashboard

# Check CloudWatch credentials
# Verify CloudWatch dashboard
```

## Resources

- [Production Configuration Guide](./MD_DOCS/PRODUCTION_CONFIGURATION.md)
- [Database Migration Guide](./MD_DOCS/DATABASE_MIGRATION_GUIDE.md)
- [Sentry Setup Guide](./MD_DOCS/SENTRY_SETUP_GUIDE.md)
- [Production Metrics Integration](./MD_DOCS/PRODUCTION_METRICS_INTEGRATION.md)
- [Quick Start Production](./MD_DOCS/QUICK_START_PRODUCTION.md)

---

**Status**: Ready for Production  
**Next Step**: Set up PostgreSQL database and configure environment variables

