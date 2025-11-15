// ============================================
// Prisma Database Client
// ============================================
// This is a singleton instance of the Prisma client
// Used throughout the application for database operations
//
// Supports both SQLite (development) and PostgreSQL (production)
// Automatically detects database type from DATABASE_URL
//
// Usage:
//   import { db } from "./db";
//   const users = await db.user.findMany();
//
// The Prisma schema is located at prisma/schema.prisma
// After modifying the schema, run: bunx prisma generate
import { PrismaClient } from "../generated/prisma";
import { env } from "./env";
import { logger } from "./lib/logger";

const prismaClient = new PrismaClient({
  log: env.NODE_ENV === "development" 
    ? ["query", "error", "warn"] 
    : ["error"],
});

/**
 * Initialize database connection
 * Applies SQLite-specific pragmas if using SQLite
 * No special initialization needed for PostgreSQL
 */
async function initDatabase() {
  try {
    // Test connection
    await prismaClient.$connect();
    logger.info("Database connected successfully", {
      database: env.DATABASE_URL.startsWith("file:") ? "SQLite" : "PostgreSQL",
    });

    // Check if we're using SQLite (for backward compatibility)
    if (env.DATABASE_URL.startsWith("file:")) {
      logger.debug("Using SQLite database, applying pragmas");
      try {
        await prismaClient.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
        await prismaClient.$queryRawUnsafe("PRAGMA foreign_keys = ON;");
        await prismaClient.$queryRawUnsafe("PRAGMA busy_timeout = 10000;");
        await prismaClient.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
        await prismaClient.$queryRawUnsafe("PRAGMA cache_size = -32768;");
        await prismaClient.$queryRawUnsafe("PRAGMA temp_store = MEMORY;");
        await prismaClient.$queryRawUnsafe("PRAGMA optimize;");
        logger.debug("SQLite pragmas applied");
      } catch (error) {
        logger.warn("Failed to apply SQLite pragmas (may not be SQLite)", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      logger.debug("Using PostgreSQL database");
      // PostgreSQL doesn't need pragmas - connection pooling is handled by Prisma
    }
  } catch (error) {
    logger.error("Failed to connect to database", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// Initialize database on module load
initDatabase().catch((error) => {
  logger.error("Failed to initialize database", {
    error: error instanceof Error ? error.message : String(error),
  });
  // Don't exit in production - allow graceful degradation
  if (env.NODE_ENV === "development") {
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prismaClient.$disconnect();
  logger.info("Database connection closed");
});

// Handle process termination
process.on("SIGINT", async () => {
  await prismaClient.$disconnect();
  logger.info("Database connection closed (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prismaClient.$disconnect();
  logger.info("Database connection closed (SIGTERM)");
  process.exit(0);
});

export const db = prismaClient;
