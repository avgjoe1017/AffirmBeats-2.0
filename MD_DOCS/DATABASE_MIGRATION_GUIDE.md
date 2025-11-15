# Database Migration Guide: SQLite → PostgreSQL

**Priority**: 🔴 CRITICAL BLOCKER  
**Estimated Effort**: 2 days  
**Status**: Ready to implement

## Overview

This guide walks through migrating from SQLite to PostgreSQL for production deployment. SQLite is not suitable for production due to:
- No concurrent write support
- Single-server limitation
- No high availability
- Data loss risk at scale

## Prerequisites

- PostgreSQL database (Supabase, Railway, Neon, or self-hosted)
- Database connection URL
- Access to production database
- Backup of SQLite database

## Migration Steps

### Step 1: Set Up PostgreSQL Database

#### Option A: Supabase (Recommended for Ease)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Option B: Railway

1. Create account at [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Get connection string from Variables tab
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/railway`

#### Option C: Neon

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Get connection string from Dashboard
4. Format: `postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]`

### Step 2: Update Prisma Schema

```prisma
// backend/prisma/schema.prisma

datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 3: Update Environment Variables

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/affirmbeats

# .env.local (development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/affirmbeats_dev

# .env.production (production)
DATABASE_URL=postgresql://postgres:password@prod-host:5432/affirmbeats_prod
```

### Step 4: Update Prisma Client Configuration

```typescript
// backend/src/db.ts
import { PrismaClient } from "../generated/prisma";

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Remove SQLite-specific pragmas
// No need for PRAGMA journal_mode, foreign_keys, etc. with PostgreSQL

export const db = prismaClient;
```

### Step 5: Create Migration

```bash
# Generate migration
cd backend
bun prisma migrate dev --name migrate_to_postgres

# This will:
# 1. Create migration files
# 2. Apply migration to database
# 3. Generate Prisma client
```

### Step 6: Update Package Dependencies

```bash
# Remove SQLite adapter
cd backend
bun remove @prisma/adapter-better-sqlite3

# No additional adapter needed for PostgreSQL (Prisma has native support)
```

### Step 7: Data Migration (If Existing Data)

If you have existing data in SQLite:

```typescript
// scripts/migrate-data.ts
import { PrismaClient as SQLiteClient } from "@prisma/client";
import { PrismaClient as PostgresClient } from "../generated/prisma";

const sqlite = new SQLiteClient({
  datasources: { db: { url: "file:dev.db" } },
});

const postgres = new PostgresClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function migrateData() {
  // Migrate users
  const users = await sqlite.user.findMany();
  for (const user of users) {
    await postgres.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  // Migrate sessions
  const sessions = await sqlite.affirmationSession.findMany();
  for (const session of sessions) {
    await postgres.affirmationSession.upsert({
      where: { id: session.id },
      update: session,
      create: session,
    });
  }

  // Migrate preferences
  const preferences = await sqlite.userPreferences.findMany();
  for (const pref of preferences) {
    await postgres.userPreferences.upsert({
      where: { userId: pref.userId },
      update: pref,
      create: pref,
    });
  }

  // Migrate subscriptions
  const subscriptions = await sqlite.userSubscription.findMany();
  for (const sub of subscriptions) {
    await postgres.userSubscription.upsert({
      where: { userId: sub.userId },
      update: sub,
      create: sub,
    });
  }

  console.log("✅ Data migration complete");
}

migrateData()
  .catch(console.error)
  .finally(() => {
    sqlite.$disconnect();
    postgres.$disconnect();
  });
```

### Step 8: Update Environment Validation

```typescript
// backend/src/env.ts
const envSchema = z.object({
  // ... existing config
  DATABASE_URL: z.string().url().refine(
    (url) => url.startsWith("postgresql://") || url.startsWith("postgres://"),
    "DATABASE_URL must be a PostgreSQL connection string"
  ),
});
```

### Step 9: Test Migration

```bash
# Test locally
cd backend
bun prisma studio  # Verify data

# Test queries
bun run scripts/test-db.ts
```

### Step 10: Update Documentation

- Update `README.md` with PostgreSQL setup instructions
- Update `backend/README.md` with PostgreSQL information
- Update environment variable documentation

## Rollback Plan

If migration fails:

1. **Keep SQLite backup**: Don't delete `dev.db` until migration is verified
2. **Revert Prisma schema**: Change `provider` back to `"sqlite"`
3. **Revert environment variables**: Use SQLite connection string
4. **Regenerate Prisma client**: `bun prisma generate`

## Verification Checklist

- [ ] PostgreSQL database created and accessible
- [ ] Prisma schema updated to use `postgresql`
- [ ] Environment variables updated
- [ ] Migration created and applied
- [ ] Prisma client regenerated
- [ ] All CRUD operations work
- [ ] Relationships intact
- [ ] Performance is acceptable (<100ms queries)
- [ ] Data migration completed (if applicable)
- [ ] Backup strategy in place
- [ ] Documentation updated

## Common Issues

### Issue: Connection Timeout

**Solution**: Check firewall settings, ensure database is accessible from your IP

### Issue: Migration Fails

**Solution**: Check Prisma schema syntax, ensure all fields are compatible with PostgreSQL

### Issue: Data Type Mismatch

**Solution**: PostgreSQL is stricter than SQLite - check for:
- Boolean fields (SQLite uses integers, PostgreSQL uses booleans)
- Date fields (ensure proper format)
- JSON fields (ensure valid JSON)

### Issue: Foreign Key Constraints

**Solution**: Ensure all foreign key relationships are properly defined in Prisma schema

## Next Steps

After migration:
1. Set up database backups
2. Configure connection pooling
3. Set up monitoring for database performance
4. Document database maintenance procedures

## Resources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)
- [Neon Documentation](https://neon.tech/docs)

---

**Status**: Ready to implement  
**Next Step**: Set up PostgreSQL database and update Prisma schema
