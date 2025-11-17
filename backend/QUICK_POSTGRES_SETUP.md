# Quick PostgreSQL Setup for Affirmation Library

The new affirmation library system requires PostgreSQL (arrays don't work in SQLite).

## Option 1: Docker (Easiest for Local Development)

### Step 1: Start PostgreSQL with Docker

```bash
docker run --name affirmbeats-postgres \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=affirmbeats \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Update .env file

Create or update `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:devpassword@localhost:5432/affirmbeats
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security
BACKEND_URL=http://localhost:3000
```

### Step 3: Run Migration

```bash
cd backend
bunx prisma migrate dev --name add_affirmation_library
```

---

## Option 2: Cloud PostgreSQL (Supabase - Free Tier)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Choose a name and password
5. Wait for project to be created

### Step 2: Get Connection String

1. Go to Settings → Database
2. Find "Connection string" section
3. Copy the "URI" connection string
4. It looks like: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

### Step 3: Update .env file

```env
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
BETTER_AUTH_SECRET=development-secret-key-must-be-at-least-32-characters-long-for-security
BACKEND_URL=http://localhost:3000
```

### Step 4: Run Migration

```bash
cd backend
bunx prisma migrate dev --name add_affirmation_library
```

---

## Option 3: Local PostgreSQL Installation

### Windows (using Chocolatey)

```powershell
choco install postgresql
```

Then create database:

```powershell
# Set password when prompted
createdb affirmbeats
```

Update `.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/affirmbeats
```

### macOS (using Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
createdb affirmbeats
```

Update `.env`:

```env
DATABASE_URL=postgresql://$(whoami)@localhost:5432/affirmbeats
```

---

## Verify Setup

After setting up, test the connection:

```bash
cd backend
bun run scripts/setup-postgresql.ts
```

You should see:
```
✅ Database connection successful
✅ Database query successful
```

---

## Run Migration

Once PostgreSQL is set up:

```bash
cd backend
bunx prisma migrate dev --name add_affirmation_library
```

This will create:
- `affirmation_line` table
- `session_template` table  
- `generation_log` table

---

## Seed the Library

After migration:

```bash
bun run backend/scripts/seed-affirmation-library.ts
```

---

## Troubleshooting

### Error: "connection refused"

- Check PostgreSQL is running: `docker ps` (for Docker) or `brew services list` (for Homebrew)
- Verify DATABASE_URL in `.env` is correct
- Check firewall isn't blocking port 5432

### Error: "database does not exist"

- Create database: `createdb affirmbeats` (or use Supabase dashboard)

### Error: "password authentication failed"

- Check password in DATABASE_URL matches PostgreSQL password
- For Supabase: Use the password from project settings

---

**Recommended: Use Docker for local development (Option 1) - it's the fastest setup!**

