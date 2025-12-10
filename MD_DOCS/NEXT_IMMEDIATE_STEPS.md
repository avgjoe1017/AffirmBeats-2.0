# Next Immediate Steps

**Last Updated**: 2025-01-XX

This document outlines the immediate next steps to get the app production-ready.

---

## ✅ Completed

1. ✅ **PostgreSQL Migration** - Database is configured and working
2. ✅ **Rate Limiting** - Applied to all routes
3. ✅ **QA Testing Infrastructure** - Automated test script created
4. ✅ **Redis Setup** - ✅ **COMPLETE** - Configured with Upstash, connected and working
5. ✅ **Sentry Configuration** - ✅ **COMPLETE** - DSN configured, using @sentry/bun (Bun-compatible)

---

## 🔴 Critical (Before Launch)

### 1. App Store / Play Console Configuration ⏱️ 2-4 hours

**Status**: Code complete, needs store configuration

**What's Needed**:
- Create subscription products in App Store Connect / Google Play Console
- Configure webhook URLs for subscription renewals
- Test purchase flow

**See**: `PRODUCTION_INSTRUCTIONS.md` section 2

---

## 🟡 High Priority (Should Do Soon)

### 3. Manual Testing ⏱️ 4-8 hours

**Status**: Automated backend tests passing, needs frontend testing

**What to Test**:
- [ ] App launch and cinematic opener
- [ ] Session generation flow
- [ ] Audio playback (all layers)
- [ ] Background audio mode
- [ ] Subscription/paywall flow
- [ ] Settings and preferences
- [ ] Library management
- [ ] Cross-device compatibility

**See**: `MD_DOCS/QA_CHECKLIST_TRACKING.md`

---

### 4. Frontend Sentry (Optional) ⏱️ 2-3 hours

**Status**: Optional, backend Sentry catches most errors

**Why**: Better error tracking for frontend-specific issues

**Steps**:
1. Install: `npx expo install @sentry/react-native`
2. Configure in `App.tsx`
3. Add error boundary

**See**: `MD_DOCS/SENTRY_SETUP_GUIDE.md` (frontend section)

---

## 🟢 Medium Priority (Nice to Have)

### 6. Performance Monitoring

**Status**: Code ready, needs API keys

**Options**:
- DataDog (if `DATADOG_API_KEY` set)
- CloudWatch (if AWS credentials set)

**See**: `MD_DOCS/MONITORING_AND_METRICS.md`

---

### 7. Security Hardening

**Status**: Good, could be improved

**Improvements**:
- [ ] CORS configuration for production (currently allows all origins)
- [ ] Security headers (HSTS, CSP, etc.)
- [ ] Request size limits

**See**: `MD_DOCS/PRE_LAUNCH_SECURITY_CHECKLIST.md`

---

## Recommended Order

1. ✅ ~~**Sentry DSN**~~ - **COMPLETE**
2. **App Store/Play Console** (2-4 hours) - Required for payments
3. ✅ ~~**Redis**~~ - **COMPLETE**
4. **Manual Testing** (4-8 hours) - Ensure everything works
5. **Frontend Sentry** (2-3 hours) - Optional but recommended

---

## Quick Commands

```bash
# Run QA tests
cd backend && bun run test:qa

# Check backend health
curl http://localhost:3000/health

# Verify environment variables
cd backend && bun run scripts/test-qa-checklist.ts
```

---

## Status Summary

| Task | Status | Time | Priority |
|------|--------|------|----------|
| PostgreSQL Migration | ✅ Complete | - | Critical |
| Rate Limiting | ✅ Complete | - | Critical |
| Sentry DSN | ✅ Complete | - | Critical |
| Redis | ✅ Complete | - | High |
| App Store Setup | ⚠️ Needs Config | 2-4 hrs | Critical |
| Manual Testing | ⚠️ Needs Testing | 4-8 hrs | High |
| Frontend Sentry | ⏭️ Optional | 2-3 hrs | Medium |

---

**Next Action**: App Store/Play Console Configuration (2-4 hours) → See `PRODUCTION_INSTRUCTIONS.md` section 2

