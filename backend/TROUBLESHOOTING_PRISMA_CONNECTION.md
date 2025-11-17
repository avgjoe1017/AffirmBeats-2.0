# Troubleshooting Prisma Connection Issue

## Problem
Prisma can't authenticate with the Docker PostgreSQL container, even though direct `psql` connections work fine.

## What We've Tried
- ✅ Verified container is running
- ✅ Confirmed direct psql connections work
- ✅ Changed port from 5432 to 5433 (to avoid local PostgreSQL services)
- ✅ Created new database users
- ✅ Updated connection strings with various parameters
- ❌ Prisma still fails with authentication error

## Likely Cause
There may be a Windows-specific networking issue between Prisma and Docker containers, or Prisma is using a different connection method than `psql`.

## Recommended Solution: Use Supabase (Cloud PostgreSQL)

Since local setup is having issues, use Supabase's free tier:

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up (free) or log in
3. Click "New Project"
4. Name: `affirmbeats-dev`
5. Set database password (save it!)
6. Choose region
7. Wait 2 minutes for setup

### Step 2: Get Connection String
1. In project: **Settings** → **Database**
2. Scroll to **Connection string**
3. Click **URI** tab
4. Copy the connection string

### Step 3: Update .env
```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Run Migration
```powershell
cd backend
bunx prisma migrate dev --name add_affirmation_library
```

This should work immediately since Supabase handles all the networking.

---

## Alternative: Fix Local Docker Connection

If you want to continue with local Docker:

1. **Check Docker networking mode:**
   ```powershell
   docker network inspect bridge
   ```

2. **Try using Docker's host network:**
   ```powershell
   docker run --name affirmbeats-postgres --network host -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=affirmbeats -d postgres:15
   ```

3. **Or use Docker Desktop's WSL2 backend** (if available)

4. **Check Prisma version:**
   ```powershell
   bunx prisma --version
   ```
   Consider updating if it's very old.

---

**I recommend Supabase - it's free, fast, and avoids all local networking issues!** 🚀

