# Sentry Quick Setup Guide

**Last Updated**: 2025-01-XX

**Status**: ✅ Backend code ready - Just needs DSN configuration

This is a quick guide to get Sentry error tracking working. The backend code is already implemented - you just need to configure the DSN.

---

## Quick Setup (5 minutes)

### Step 1: Create Sentry Account & Project

1. Go to [sentry.io](https://sentry.io)
2. Sign up (free tier available - 5,000 events/month)
3. Create a new project:
   - **Platform**: Node.js
   - **Project Name**: Recenter Backend (or your choice)
4. Copy the **DSN** (Data Source Name)
   - Format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### Step 2: Set Environment Variable

Add to your `.env` file or environment:

```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production  # or development, staging
```

### Step 3: Restart Backend

Restart your backend server. You should see in the logs:

```
✅ Sentry initialized { environment: 'production' }
```

If you see:

```
⚠️ Sentry DSN not configured, error tracking will be disabled
```

Then the DSN wasn't picked up - check your environment variable.

### Step 4: Test It

The backend will automatically send errors to Sentry. To test:

1. Trigger an error (e.g., visit a non-existent endpoint)
2. Check your Sentry dashboard - you should see the error appear within seconds

---

## What's Already Implemented

✅ **Backend Sentry Integration** (`backend/src/lib/sentry.ts`):
- Automatic initialization on server start
- Error capture helpers
- User context setting
- Breadcrumb tracking
- Sensitive data filtering
- Graceful fallback if not configured

✅ **Error Handler Integration** (`backend/src/middleware/errorHandler.ts`):
- Errors automatically sent to Sentry
- HTTP exceptions tracked
- Validation errors tracked
- Unhandled errors tracked

✅ **Environment Schema** (`backend/src/env.ts`):
- `SENTRY_DSN` validation
- `SENTRY_ENVIRONMENT` validation

**No code changes needed** - just set the environment variable!

---

## Verification

### Check Backend Logs

When backend starts, look for:

```
✅ Sentry initialized { environment: 'production' }
```

### Check Sentry Dashboard

1. Go to your Sentry project dashboard
2. You should see events appear when errors occur
3. Test by triggering an error (e.g., invalid API request)

### Run QA Test

```bash
cd backend
bun run test:qa
```

Should show:
```
✅ SENTRY_DSN: Configured
```

---

## Frontend Sentry (Optional)

The frontend doesn't have Sentry integrated yet. If you want to add it:

1. Install: `npx expo install @sentry/react-native`
2. See `MD_DOCS/SENTRY_SETUP_GUIDE.md` for full frontend setup

**Note**: Frontend Sentry is optional - backend Sentry will catch most errors.

---

## Cost

**Free Tier**:
- 5,000 events/month
- 1 project
- 7-day retention
- Perfect for getting started

**Paid Plans**:
- Start at $26/month for 50,000 events
- Unlimited retention
- Advanced features

**For Most Apps**: Free tier is sufficient initially.

---

## Troubleshooting

### DSN Not Working

**Issue**: Backend says "Sentry DSN not configured" even after setting it

**Solutions**:
1. Check environment variable is set correctly
2. Restart backend server
3. Check for typos in DSN
4. Verify DSN format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### No Events in Sentry

**Issue**: Errors occur but don't appear in Sentry

**Solutions**:
1. Check backend logs for Sentry initialization
2. Verify DSN is correct
3. Check Sentry project settings
4. Test with manual error: `Sentry.captureException(new Error("test"))`

### Too Many Events

**Issue**: Hitting rate limits

**Solutions**:
1. Adjust `tracesSampleRate` in `backend/src/lib/sentry.ts`
2. Filter events in `beforeSend` hook
3. Upgrade Sentry plan if needed

---

## Next Steps

After Sentry is configured:

1. **Monitor Errors**: Check Sentry dashboard regularly
2. **Set Up Alerts**: Configure email/Slack alerts for critical errors
3. **Add Context**: Use `setUser()` and `addBreadcrumb()` for better debugging
4. **Track Releases**: Add release tracking to see which version has issues

---

## See Also

- `MD_DOCS/SENTRY_SETUP_GUIDE.md` - Comprehensive setup guide (includes frontend)
- `backend/src/lib/sentry.ts` - Sentry implementation
- `backend/src/middleware/errorHandler.ts` - Error handler integration

---

**That's it!** Just set the `SENTRY_DSN` environment variable and you're done. The backend code is already ready.

