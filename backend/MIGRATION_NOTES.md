# Database Migration Notes

## Adding Indexes (2025-01-XX)

A new migration has been added to improve query performance by adding indexes to frequently queried fields.

### New Indexes

**AffirmationSession:**
- `@@index([userId, createdAt])` - Optimizes fetching user sessions ordered by date
- `@@index([userId, isFavorite])` - Optimizes fetching user's favorite sessions  
- `@@index([goal])` - Optimizes filtering sessions by goal type

**UserSubscription:**
- `@@index([lastResetDate, tier])` - Optimizes monthly reset queries
- `@@index([tier, status])` - Optimizes filtering by subscription tier and status

### To Apply

```bash
cd backend
bunx prisma migrate dev --name add_performance_indexes
```

This will:
1. Create a new migration file
2. Apply the indexes to your database
3. Regenerate the Prisma client

### Performance Impact

- **Before:** Full table scans for user session queries
- **After:** Indexed lookups, significantly faster queries as data grows

### Notes

- Indexes add minimal overhead on writes
- SQLite automatically uses indexes when appropriate
- No data migration needed - indexes only

