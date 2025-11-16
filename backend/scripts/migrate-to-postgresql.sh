#!/bin/bash

# PostgreSQL Migration Script
# This script migrates the database from SQLite to PostgreSQL

set -e  # Exit on error

echo "🚀 Starting PostgreSQL Migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "   Please set it to your PostgreSQL connection string:"
    echo "   export DATABASE_URL=postgresql://user:password@host:5432/database"
    exit 1
fi

# Check if DATABASE_URL is PostgreSQL (not SQLite)
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo "❌ Error: DATABASE_URL must be a PostgreSQL connection string"
    echo "   Current value: $DATABASE_URL"
    echo "   Expected format: postgresql://user:password@host:5432/database"
    exit 1
fi

echo "✅ DATABASE_URL is set to PostgreSQL"

# Step 1: Update Prisma schema
echo ""
echo "📝 Step 1: Updating Prisma schema..."
cd "$(dirname "$0")/.."

# Backup current schema
cp prisma/schema.prisma prisma/schema.prisma.backup
echo "   ✅ Backed up schema to prisma/schema.prisma.backup"

# Update datasource provider
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
else
    # Linux
    sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
fi

echo "   ✅ Updated datasource provider to PostgreSQL"

# Step 2: Generate Prisma client
echo ""
echo "📦 Step 2: Generating Prisma client..."
bunx prisma generate
echo "   ✅ Prisma client generated"

# Step 3: Create and apply migration
echo ""
echo "🔄 Step 3: Creating migration..."
bunx prisma migrate dev --name migrate_to_postgresql --create-only
echo "   ✅ Migration created"

echo ""
echo "📤 Step 4: Applying migration to database..."
bunx prisma migrate deploy
echo "   ✅ Migration applied"

# Step 4: Verify connection
echo ""
echo "🔍 Step 5: Verifying database connection..."
bunx prisma db pull --force
echo "   ✅ Database connection verified"

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Test your application with the new database"
echo "   2. Verify all data was migrated correctly"
echo "   3. Update your production environment variables"
echo "   4. Monitor database performance"
echo ""
echo "⚠️  Note: Your original SQLite database is still at:"
echo "   backend/prisma/dev.db (if it exists)"
echo ""
echo "💡 To rollback, restore from:"
echo "   backend/prisma/schema.prisma.backup"

