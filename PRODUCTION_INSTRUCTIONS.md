# Production Instructions

## Critical Pre-Launch Tasks

### 1. PostgreSQL Migration (CRITICAL)

**Status**: ⚠️ Not Complete - Must be done before production launch

**Current State**: Using SQLite (development only, not production-ready)

**Why**: SQLite doesn't support concurrent writes, has single-server limitations, and is not suitable for production scale.

**Steps to Complete**:

1. **Set up PostgreSQL database**:
   - Option A: Supabase (recommended for ease)
     - Create account at [supabase.com](https://supabase.com)
     - Create new project
     - Get connection string from Settings → Database
   - Option B: Railway
     - Create account at [railway.app](https://railway.app)
     - Create new PostgreSQL database
   - Option C: Neon
     - Create account at [neon.tech](https://neon.tech)
     - Create new project

2. **Update Prisma schema**:
   ```prisma
   // backend/prisma/schema.prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Set environment variable**:
   ```bash
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

4. **Run migration**:
   ```bash
   cd backend
   bunx prisma migrate deploy
   bunx prisma generate
   ```

5. **Test connection**:
   ```bash
   cd backend
   bunx prisma studio
   ```

**See**: `MD_DOCS/DATABASE_MIGRATION_GUIDE.md` for detailed instructions

---

### 2. Payment Integration Setup (CRITICAL)

**Status**: ✅ Code Complete - Needs App Store/Play Console Configuration

**What's Done**:
- ✅ `expo-in-app-purchases` integrated
- ✅ Purchase flow implemented
- ✅ Backend verification endpoint created
- ✅ Restore purchases functionality

**What's Needed**:

1. **App Store Connect (iOS)**:
   - Create in-app purchase product
   - Product ID: `com.affirmbeats.pro.lifetime`
   - Type: Non-Consumable
   - Price: $9.99
   - Submit for review

2. **Google Play Console (Android)**:
   - Create in-app product
   - Product ID: `com.affirmbeats.pro.lifetime`
   - Type: Managed Product (one-time purchase)
   - Price: $9.99
   - Activate product

3. **Test Purchases**:
   - Use sandbox/test accounts for testing
   - Verify purchase flow end-to-end
   - Test restore purchases functionality

**See**: `src/lib/payments.ts` and `src/hooks/useInAppPurchases.ts` for implementation

---

### 3. Sentry Configuration (HIGH PRIORITY)

**Status**: ⚠️ Code Ready - Needs DSN Configuration

**What's Done**:
- ✅ Sentry integration code exists (`backend/src/lib/sentry.ts`)
- ✅ Error tracking helpers created

**What's Needed**:

1. **Create Sentry project**:
   - Sign up at [sentry.io](https://sentry.io)
   - Create new project (Node.js backend)
   - Get DSN

2. **Set environment variable**:
   ```bash
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   ```

3. **Frontend Sentry** (optional but recommended):
   - Install `@sentry/react-native`
   - Configure in `App.tsx`
   - Add breadcrumbs for navigation

**See**: `backend/src/lib/sentry.ts` for backend implementation

---

### 4. Environment Variables Checklist

**Required for Production**:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BACKEND_URL=https://your-backend-url.com

# API Keys
ELEVENLABS_API_KEY=your-elevenlabs-key
OPENAI_API_KEY=your-openai-key

# Optional but Recommended
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

---

### 5. Build Configuration

**iOS**:
- Update `app.json` with proper bundle identifier
- Configure App Store Connect
- Set up provisioning profiles
- Configure in-app purchase products

**Android**:
- Update `app.json` with proper package name
- Configure Google Play Console
- Set up signing keys
- Configure in-app purchase products

---

### 6. Testing Checklist

Before launching, test:

- [ ] Payment flow (purchase, restore)
- [ ] Database operations (all CRUD)
- [ ] Background audio playback
- [ ] Session generation
- [ ] Audio playback (all layers)
- [ ] Subscription limits (free tier)
- [ ] Premium features (Pro tier)
- [ ] Reduce Motion accessibility
- [ ] Cross-device compatibility

**See**: `MD_DOCS/QA_CHECKLIST_TRACKING.md` for complete checklist

---

## Post-Launch Monitoring

1. **Monitor Sentry** for crashes and errors
2. **Monitor database** performance and connections
3. **Monitor payment** success rates
4. **Monitor API** response times
5. **Monitor audio** generation latency

---

## Rollback Plan

If issues occur:

1. **Database**: Restore from backup
2. **Payment**: Disable IAP, use manual upgrade endpoint
3. **Backend**: Revert to previous deployment
4. **Frontend**: Release previous app version

---

**Last Updated**: 2025-01-XX
