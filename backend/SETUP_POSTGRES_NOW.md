# Setup PostgreSQL Now - Quick Guide

Your `.env` currently has `DATABASE_URL=file:dev.db` (SQLite), but the new affirmation library needs PostgreSQL.

## 🚀 Fastest Option: Supabase (5 minutes, Free)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up (free) or log in
3. Click "New Project"
4. Name it "affirmbeats-dev"
5. Set a database password (save it!)
6. Choose a region close to you
7. Click "Create new project"
8. Wait 2 minutes for setup

### Step 2: Get Connection String
1. In your Supabase project, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Click the **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Step 3: Update .env File

Open `backend/.env` and replace the DATABASE_URL line:

```env
# Replace this line:
DATABASE_URL=file:dev.db

# With your Supabase connection string:
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Keep your other settings:
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security
BACKEND_URL=http://localhost:3000
```

### Step 4: Run Migration

```powershell
cd "C:\Users\joeba\Documents\AffirmBeats 2.0\backend"
bunx prisma migrate dev --name add_affirmation_library
```

### Step 5: Seed the Library

```powershell
bun run backend/scripts/seed-affirmation-library.ts
```

---

## ✅ Verify It Works

```powershell
bun run backend/scripts/setup-postgresql.ts
```

You should see:
```
✅ Database connection successful
✅ Database query successful
```

---

## 🐳 Alternative: Docker (if Docker Desktop is running)

If you prefer Docker and have Docker Desktop running:

```powershell
# Start PostgreSQL container
docker run --name affirmbeats-postgres `
  -e POSTGRES_PASSWORD=devpassword `
  -e POSTGRES_DB=affirmbeats `
  -p 5432:5432 `
  -d postgres:15

# Update .env
# Change DATABASE_URL to:
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/affirmbeats

# Then run migration
bunx prisma migrate dev --name add_affirmation_library
```

---

**I recommend Supabase - it's free, fast, and no local setup needed!** 🚀

