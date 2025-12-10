# What's Next - Development Priorities

**Last Updated**: 2025-01-XX

This document outlines the prioritized list of tasks and improvements needed before and after production launch.

---

## 🔴 Critical (Production Blockers)

### 1. PostgreSQL Migration ✅ **COMPLETE**

**Status**: ✅ Complete (2025-01-XX)  
**Priority**: ~~CRITICAL~~ ✅ **RESOLVED**  
**Result**: PostgreSQL database configured and working

**Why**: SQLite doesn't support concurrent writes and has single-server limitations. Not suitable for production scale.

**Steps**:
1. Set up PostgreSQL database (Supabase, Railway, or Neon)
2. Update Prisma schema: change `provider = "postgresql"` in `backend/prisma/schema.prisma`
3. Set `DATABASE_URL` environment variable
4. Run migration: `bunx prisma migrate deploy`
5. Test connection and verify data integrity

**See**: `PRODUCTION_INSTRUCTIONS.md` section 1 and `MD_DOCS/DATABASE_MIGRATION_GUIDE.md`

---

### 2. Sentry Configuration ⚠️ **HIGH PRIORITY**

**Status**: ✅ Code Ready - Just Needs DSN (5 minutes)  
**Priority**: HIGH  
**Estimated Time**: 5 minutes

**What's Done**:
- ✅ Backend Sentry integration complete (`backend/src/lib/sentry.ts`)
- ✅ Automatic error capture in logger
- ✅ Error handler integration
- ✅ Sensitive data filtering
- ✅ Environment schema validation

**What's Needed**:
1. Create Sentry account (free tier)
2. Get DSN from project
3. Set `SENTRY_DSN` environment variable
4. Restart backend

**See**: `MD_DOCS/SENTRY_QUICK_SETUP.md` for 5-minute setup

**Why**: Essential for production error tracking and monitoring.

**Steps**:
1. Create Sentry project at [sentry.io](https://sentry.io)
2. Get DSN
3. Set environment variables:
   ```bash
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   ```
4. (Optional) Configure frontend Sentry for React Native

**See**: `PRODUCTION_INSTRUCTIONS.md` section 3 and `MD_DOCS/SENTRY_SETUP_GUIDE.md`

---

### 3. App Store / Play Console Configuration ⚠️ **REQUIRED FOR PAYMENTS**

**Status**: Code Complete - Needs Store Configuration  
**Priority**: HIGH  
**Estimated Time**: 2-4 hours

**Why**: Required for subscription functionality to work.

**Steps**:
1. **App Store Connect (iOS)**:
   - Create subscription products: `com.recenter.pro.monthly`, `com.recenter.pro.annual`
   - Configure App Store Server Notifications webhook: `https://your-backend.com/api/webhooks/apple`
   - Submit for review

2. **Google Play Console (Android)**:
   - Create subscription products: `com.recenter.pro.monthly`, `com.recenter.pro.annual`
   - Configure Server-to-Server Notifications webhook: `https://your-backend.com/api/webhooks/google`
   - Enable Google Play Developer API
   - Upload service account key

**See**: `PRODUCTION_INSTRUCTIONS.md` section 2 and `MD_DOCS/SUBSCRIPTION_WEBHOOKS_SETUP.md`

---

## 🟡 High Priority (Should Do Soon)

### 4. Rate Limiting Applied to All Routes ✅ **COMPLETED**

**Status**: ✅ Complete (2025-01-XX)  
**Priority**: HIGH

**What Was Done**:
- Applied `rateLimiters.api` to:
  - Session creation, updates, deletion, favorites
  - Subscription upgrade, cancel, verify-purchase
  - Preferences updates
- TTS and OpenAI endpoints already had rate limiting
- General API routes now protected with 100 requests per 15 minutes

**Impact**: Better protection against abuse and API overload.

---

### 5. End-to-End Testing & QA

**Status**: Partial  
**Priority**: HIGH  
**Estimated Time**: 4-8 hours

**Why**: Ensure all features work correctly before launch.

**Checklist**:
- [ ] Payment flow (purchase, restore)
- [ ] Webhook notifications (subscription renewals)
- [ ] Database operations (all CRUD)
- [ ] Background audio playback
- [ ] Session generation
- [ ] Audio playback (all layers)
- [ ] Subscription limits (free tier)
- [ ] Premium features (Pro tier)
- [ ] Reduce Motion accessibility
- [ ] Cross-device compatibility
- [ ] Admin endpoint security
- [ ] Privacy Policy and Terms links

**See**: `MD_DOCS/QA_CHECKLIST_TRACKING.md`

---

### 6. Redis Setup (Optional but Recommended) ✅ **DOCUMENTATION COMPLETE**

**Status**: ✅ Documentation Complete - Ready to Configure  
**Priority**: MEDIUM  
**Estimated Time**: 30 minutes

**What's Done**:
- ✅ Redis client implementation (`backend/src/lib/redis.ts`)
- ✅ Automatic fallback to in-memory if not configured
- ✅ Rate limiting uses Redis when available
- ✅ Comprehensive setup guide created

**What's Needed**:
1. Choose Redis provider (Upstash recommended)
2. Create Redis database
3. Set `REDIS_URL` environment variable
4. Restart backend

**See**: `MD_DOCS/REDIS_SETUP_GUIDE.md` for complete setup instructions

**Why**: Improves rate limiting performance and enables distributed rate limiting across multiple servers.

**Steps**:
1. Set up Redis instance (Redis Cloud, Upstash, or self-hosted)
2. Set `REDIS_URL` environment variable
3. Rate limiting will automatically use Redis if available

**Note**: Rate limiting works with in-memory fallback, so Redis is optional but recommended for production.

---

## 🟢 Medium Priority (Nice to Have)

### 7. Performance Monitoring

**Status**: Partial  
**Priority**: MEDIUM

**What's Done**:
- ✅ Metrics middleware implemented
- ✅ DataDog integration (if configured)
- ✅ CloudWatch integration (if configured)

**What's Needed**:
- Configure DataDog or CloudWatch API keys
- Set up dashboards
- Configure alerts

**See**: `MD_DOCS/MONITORING_AND_METRICS.md`

---

### 8. Security Hardening

**Status**: Good  
**Priority**: MEDIUM

**What's Done**:
- ✅ Admin authentication middleware
- ✅ Production mode enforcement
- ✅ Rate limiting
- ✅ Input validation (Zod)

**What Could Be Improved**:
- [ ] CORS configuration for production (currently allows all origins)
- [ ] API key rotation strategy
- [ ] Security headers (HSTS, CSP, etc.)
- [ ] Request size limits

**See**: `MD_DOCS/PRE_LAUNCH_SECURITY_CHECKLIST.md`

---

### 9. Documentation Updates

**Status**: Good  
**Priority**: LOW

**What's Done**:
- ✅ Comprehensive PROGRESS.md
- ✅ PRODUCTION_INSTRUCTIONS.md
- ✅ Multiple MD_DOCS guides

**What Could Be Improved**:
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment runbooks
- [ ] Troubleshooting guides for common issues

---

## 📋 Post-Launch Tasks

### 10. User Feedback & Iteration

- Monitor Sentry for errors
- Collect user feedback
- Track subscription conversion rates
- Monitor API usage patterns

### 11. Feature Enhancements

- [ ] Audio preloading improvements
- [ ] Additional voice options
- [ ] More background sound options
- [ ] Playlist features
- [ ] Social sharing

### 12. Scaling Considerations

- [ ] Database connection pooling optimization
- [ ] CDN for static assets
- [ ] Load balancing setup
- [ ] Caching strategy refinement

---

## Summary

**Before Launch** (Must Complete):
1. ✅ PostgreSQL migration - **COMPLETE**
2. ⚠️ Sentry DSN configuration - **5 minutes** (code ready)
3. ⚠️ App Store/Play Console setup - **2-4 hours** (code ready)
4. ⚠️ End-to-end testing - **4-8 hours** (automated tests passing)

**Infrastructure Status**:
- ✅ Database: PostgreSQL configured
- ✅ Rate Limiting: Applied to all routes
- ✅ Error Handling: Complete with Sentry integration
- ✅ Health Checks: All passing
- ✅ Testing: Automated QA script available
- ⚠️ Sentry: Just needs DSN
- ⏭️ Redis: Optional but recommended

**After Launch** (Should Monitor):
- Error tracking (Sentry)
- Subscription metrics
- API performance
- User feedback

---

**Next Immediate Steps**:
1. ✅ ~~Set up PostgreSQL database~~ - **COMPLETE**
2. Configure Sentry DSN (5 minutes) - See `MD_DOCS/SENTRY_QUICK_SETUP.md`
3. Complete App Store/Play Console configuration (2-4 hours)
4. Run manual frontend testing (4-8 hours)

**See**: `MD_DOCS/NEXT_IMMEDIATE_STEPS.md` for prioritized action items

