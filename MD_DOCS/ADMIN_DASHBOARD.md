# Admin Dashboard Documentation

**Last Updated**: 2025-01-27  
**Status**: ✅ Complete

## Overview

The Admin Dashboard provides comprehensive monitoring and analytics for the AffirmBeats backend. It tracks costs, usage, quality metrics, and system health in real-time.

## Features

### 1. Real-Time Operations Stats
- Active users (last 24 hours)
- Revenue today with day-over-day comparison
- Sessions generated
- API costs vs revenue percentage
- Error rate monitoring
- Average user rating

### 2. Cost Optimization Dashboard
- Match type distribution (Exact/Pooled/Generated)
- Cost breakdown by match type
- Total spent vs projected monthly costs
- Savings calculation vs full generation
- Pooling trend tracking

### 3. Affirmation Library Health
- Total affirmations count
- Affirmations by goal with average ratings
- Template count
- Coverage percentage (matched vs total sessions)
- Low-rated affirmations alert

### 4. Quality Metrics by Match Type
- Average rating comparison
- Replay percentage
- Completion percentage
- Quality parity verification

### 5. User Metrics
- Total users (Free vs Pro breakdown)
- Conversion rate
- Monthly Recurring Revenue (MRR)

### 6. Recent Activity Feed
- Last 20 session generations
- User ID, goal, match type, timestamp

### 7. Alerts & Action Items
- Low-rated affirmations warnings
- Cost increase alerts
- Unmatched intent suggestions
- Success notifications

### 8. Quick Actions
- Export sessions to CSV
- Export costs to CSV
- Export users to CSV

## API Endpoints

### GET /api/admin/dashboard
Returns comprehensive dashboard data.

**Response:**
```json
{
  "realTimeStats": {
    "activeUsers": 127,
    "revenueToday": 847.23,
    "revenueChange": 12.5,
    "sessionsGenerated": 423,
    "apiCostToday": 42.30,
    "errorRate": 0.003,
    "avgRating": 4.6
  },
  "costBreakdown": { ... },
  "libraryHealth": { ... },
  "qualityMetrics": { ... },
  "userMetrics": { ... },
  "recentActivity": [ ... ],
  "alerts": [ ... ]
}
```

### GET /api/admin/export?type=sessions|costs|users
Exports analytics data as CSV.

**Query Parameters:**
- `type`: Export type (sessions, costs, or users)
- `startDate`: Optional start date (ISO string)
- `endDate`: Optional end date (ISO string)

## Frontend Access

The Admin Dashboard is available at:
- **Screen**: `src/screens/AdminDashboard.tsx`
- **Navigation**: Add to navigation stack (see below)

### Adding to Navigation

To access the dashboard, add it to your navigation:

```typescript
// In RootNavigator.tsx or SettingsScreen.tsx
import AdminDashboard from "@/screens/AdminDashboard";

// Add as a screen or link from settings
<RootStack.Screen
  name="AdminDashboard"
  component={AdminDashboard}
  options={{ title: "Admin Dashboard" }}
/>
```

Or add a hidden access method (e.g., tap Settings title 5 times).

## End-to-End Monitoring

End-to-end tests are located in `backend/tests/e2e/pipeline-monitor.test.ts`.

These tests verify:
1. Session generation pipeline (all match types)
2. Cost tracking accuracy
3. Database health
4. External API connectivity
5. Rate limiting
6. Subscription limits
7. Metrics collection
8. Health check endpoint
9. Admin dashboard endpoint
10. Error handling

### Running E2E Tests

```bash
cd backend
bun run test e2e/pipeline-monitor.test.ts
```

### Automated Monitoring

Set up a cron job or scheduled task to run E2E tests every 5 minutes:

```bash
# Cron example (every 5 minutes)
*/5 * * * * cd /path/to/backend && bun run test e2e/pipeline-monitor.test.ts
```

## Security Considerations

⚠️ **IMPORTANT**: The admin dashboard currently has no authentication. Add admin authentication before deploying to production.

### Recommended Security Measures

1. **Add Admin Authentication Middleware**
   ```typescript
   // backend/src/middleware/adminAuth.ts
   export async function adminAuth(c: Context<AppType>, next: Next) {
     const user = c.get("user");
     if (!user || user.email !== "admin@yourdomain.com") {
       return c.json({ error: "UNAUTHORIZED" }, 403);
     }
     return next();
   }
   ```

2. **Protect Admin Routes**
   ```typescript
   adminRouter.use("*", adminAuth);
   ```

3. **Environment-Based Access**
   - Only enable in development/staging
   - Use environment variable to control access

## Data Refresh

- **Auto-refresh**: Every 5 minutes
- **Manual refresh**: Pull down to refresh
- **Cache**: No caching (always fresh data)

## Cost Tracking

Costs are tracked in the `GenerationLog` table:
- **Exact Match**: $0 (uses templates)
- **Pooled**: ~$0.10 (TTS only, no OpenAI)
- **Generated**: ~$0.21 (OpenAI + TTS)

## Metrics Collection

Metrics are collected automatically via:
- `metricsMiddleware` - Tracks all API requests
- `GenerationLog` - Tracks session generation costs
- Database queries - Tracks user and session data

## Troubleshooting

### Dashboard shows zero values
- Check if `GenerationLog` table has data
- Verify database connection
- Check if metrics are being collected

### Export fails
- Verify backend URL is accessible
- Check CORS settings
- Verify authentication (if enabled)

### E2E tests fail
- Check database connection
- Verify OpenAI API key is configured
- Check rate limits aren't blocking tests

## Future Enhancements

- [ ] Add charts/graphs for trends
- [ ] Real-time WebSocket updates
- [ ] Email alerts for critical issues
- [ ] Historical data comparison
- [ ] Custom date range filtering
- [ ] Export to PDF
- [ ] Mobile-optimized view

---

**Next Steps**: Add authentication and integrate into navigation for easy access.

