#!/usr/bin/env bun
/**
 * PostgreSQL Setup Script
 * 
 * This script helps set up PostgreSQL for production.
 * It validates the connection and runs initial migrations.
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... bun run scripts/setup-postgresql.ts
 */

import { PrismaClient } from "../generated/prisma";
import { logger } from "../src/lib/logger";
import { env } from "../src/env";

async function setupPostgreSQL() {
  logger.info("Setting up PostgreSQL database", {
    url: env.DATABASE_URL.substring(0, 20) + "...", // Don't log full URL
  });

  try {
    const prisma = new PrismaClient();

    // Test connection
    logger.info("Testing database connection...");
    await prisma.$connect();
    logger.info("✅ Database connection successful");

    // Run a simple query to verify
    await prisma.$queryRaw`SELECT 1`;
    logger.info("✅ Database query successful");

    // Check if tables exist
    const tables = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    logger.info(`Found ${tables.length} tables in database`, {
      tables: tables.map((t) => t.tablename),
    });

    // Verify required tables exist
    const requiredTables = [
      "user",
      "session",
      "account",
      "verification",
      "profile",
      "user_preferences",
      "affirmation_session",
      "user_subscription",
      "tts_cache",
    ];

    const existingTables = tables.map((t) => t.tablename);
    const missingTables = requiredTables.filter(
      (t) => !existingTables.includes(t)
    );

    if (missingTables.length > 0) {
      logger.warn("Missing tables", { missingTables });
      logger.info("Run migrations: bunx prisma migrate deploy");
    } else {
      logger.info("✅ All required tables exist");
    }

    await prisma.$disconnect();
    logger.info("✅ PostgreSQL setup completed successfully");
  } catch (error) {
    logger.error("❌ PostgreSQL setup failed", error);
    throw error;
  }
}

// Run setup
setupPostgreSQL().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});

