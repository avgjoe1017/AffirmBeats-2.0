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

**Status**: ✅ Code Complete - Needs App Store/Play Console Configuration + Webhooks

**What's Done**:
- ✅ `expo-in-app-purchases` integrated
- ✅ Purchase flow implemented
- ✅ Backend verification endpoint created
- ✅ Restore purchases functionality
- ✅ **NEW**: Subscription renewal webhook endpoints created

**What's Needed**:

1. **App Store Connect (iOS)**:
   - Create subscription products:
     - Product ID: `com.recenter.pro.monthly` (Monthly subscription)
     - Product ID: `com.recenter.pro.annual` (Annual subscription)
   - Configure App Store Server Notifications:
     - Webhook URL: `https://your-backend.com/api/webhooks/apple`
     - Enable all notification types
   - Submit for review

2. **Google Play Console (Android)**:
   - Create subscription products:
     - Product ID: `com.recenter.pro.monthly` (Monthly subscription)
     - Product ID: `com.recenter.pro.annual` (Annual subscription)
   - Configure Server-to-Server Notifications:
     - Webhook URL: `https://your-backend.com/api/webhooks/google`
     - Enable Google Play Developer API
     - Upload service account key

3. **Database Migration** (REQUIRED for webhooks):
   ```bash
   cd backend
   npx prisma migrate dev --name add_subscription_transaction_ids
   ```
   Adds `appleTransactionId`, `googlePurchaseToken`, and `platform` fields to `UserSubscription`

4. **Update Initial Purchase Flow**:
   - Store transaction IDs when processing initial purchase
   - See `MD_DOCS/SUBSCRIPTION_WEBHOOKS_SETUP.md` for details

5. **Test Purchases**:
   - Use sandbox/test accounts for testing
   - Verify purchase flow end-to-end
   - Test restore purchases functionality
   - **NEW**: Test webhook notifications (use ngrok for local testing)

**Critical**: Without webhooks configured, subscription status will become stale after the first billing cycle.

**See**: 
- `src/lib/payments.ts` and `src/hooks/useInAppPurchases.ts` for implementation
- `MD_DOCS/SUBSCRIPTION_WEBHOOKS_SETUP.md` for complete webhook setup guide

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

### 4. Supabase Storage Migration ✅

**Status**: ✅ **COMPLETE** - All audio files migrated to Supabase Storage

**What's Done**:
- ✅ Supabase Storage integration code exists
- ✅ Migration script created and executed
- ✅ All 33 audio files uploaded to Supabase (12 binaural, 11 solfeggio, 10 background)
- ✅ Audio routes updated to use Supabase CDN
- ✅ Automatic fallback to local files if Supabase not configured
- ✅ Health check endpoint includes Supabase status
- ✅ Test script available for verification

**Configuration**:
- **Project URL**: `https://hrfzxdjhexxplwqprxrx.supabase.co`
- **Storage Endpoint**: `https://hrfzxdjhexxplwqprxrx.storage.supabase.co/storage/v1/s3`
- **Region**: `us-west-2`
- **Buckets Created**: `affirmations`, `binaural`, `solfeggio`, `background`

**Verification**:
1. **Test integration**:
   ```bash
   cd backend
   bun run test:supabase
   ```

2. **Check health endpoint**:
   ```bash
   curl http://localhost:3000/health
   ```
   Should show Supabase status in response

3. **Test audio routes**:
   - Audio requests should redirect (302) to Supabase CDN URLs
   - Check backend logs for "Redirecting to Supabase Storage" messages

**Benefits**:
- ✅ CDN delivery (faster load times)
- ✅ Reduced backend bandwidth costs
- ✅ Better scalability
- ✅ Automatic global distribution

**See**: `MD_DOCS/SUPABASE_STORAGE_MIGRATION.md` for detailed documentation

---

### 5. Environment Variables Checklist

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

### 7. Legal & Compliance (LAUNCH BLOCKER)

**Status**: ✅ Complete - Privacy Policy and Terms of Service added

**What's Done**:
- ✅ Privacy Policy page created (`/api/legal/privacy-policy`)
- ✅ Terms of Service page created (`/api/legal/terms-of-service`)
- ✅ Links added to Settings screen
- ✅ Professional HTML formatting

**What's Needed**:

1. **Review Legal Documents**:
   - Update contact emails in Privacy Policy and Terms
   - Customize content for your specific use case
   - Have legal counsel review (recommended)

2. **App Store Submission**:
   - Add Privacy Policy URL in App Store Connect
   - Add Terms of Service URL in App Store Connect
   - Required for apps with subscriptions

3. **Google Play Submission**:
   - Add Privacy Policy URL in Google Play Console
   - Add Terms of Service URL in Google Play Console
   - Required for apps with subscriptions

**See**: `backend/src/routes/legal.ts` for implementation

---

### 8. Admin Security Configuration (CRITICAL)

**Status**: ✅ Enhanced - Production mode enforcement added

**What's Done**:
- ✅ Admin authentication middleware
- ✅ Email-based authorization
- ✅ **NEW**: Production mode blocks access if `ADMIN_EMAILS` not set
- ✅ Comprehensive logging

**What's Needed**:

1. **Set ADMIN_EMAILS in Production**:
   ```env
   ADMIN_EMAILS=admin@example.com,admin2@example.com
   ```

2. **Verify Admin Endpoints**:
   - All `/api/admin/*` routes require authentication
   - Only emails in `ADMIN_EMAILS` can access
   - Test admin access in production environment

**Security Note**: Without `ADMIN_EMAILS` set in production, all admin endpoints will be blocked (by design for security).

**See**: `backend/src/middleware/adminAuth.ts` and `MD_DOCS/PRE_LAUNCH_SECURITY_CHECKLIST.md`

---

### 9. Testing Checklist

Before launching, test:

- [ ] Payment flow (purchase, restore)
- [ ] **NEW**: Webhook notifications (subscription renewals)
- [ ] Database operations (all CRUD)
- [ ] Background audio playback
- [ ] Session generation
- [ ] Audio playback (all layers)
- [ ] Subscription limits (free tier)
- [ ] Premium features (Pro tier)
- [ ] Reduce Motion accessibility
- [ ] Cross-device compatibility
- [ ] **NEW**: Admin endpoint security (unauthorized access blocked)
- [ ] **NEW**: Privacy Policy and Terms links work

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
