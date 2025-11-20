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
  // Note: For PostgreSQL connection pool configuration, add parameters to DATABASE_URL:
  // postgresql://user:pass@host:port/db?connection_limit=10&pool_timeout=20&connect_timeout=10
  // Prisma automatically manages connection pooling based on these parameters
});

/**
 * Initialize database connection
 * Applies SQLite-specific pragmas if using SQLite
 * No special initialization needed for PostgreSQL
 */
/**
 * Retry connection with exponential backoff
 */
async function connectWithRetry(maxRetries = 3, delay = 1000): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prismaClient.$connect();
      return; // Success
    } catch (error) {
      const isConnectionError = error instanceof Error && (
        error.message.includes("ConnectionReset") ||
        error.message.includes("ECONNRESET") ||
        error.message.includes("10054") ||
        error.message.includes("forcibly closed")
      );

      if (isConnectionError && attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1);
        logger.warn(`Database connection failed (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`, {
          error: error instanceof Error ? error.message : String(error),
        });
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw error; // Re-throw if not a connection error or max retries reached
    }
  }
}

async function initDatabase() {
  try {
    // Test connection with retry logic for connection resets
    await connectWithRetry();
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
      // PostgreSQL connection pool configuration
      // Connection pooling is handled by Prisma, but we can add connection string parameters:
      // - ?connection_limit=10&pool_timeout=20 (add to DATABASE_URL if needed)
      // - Prisma automatically manages connection pooling
    }
  } catch (error) {
    logger.error("Failed to connect to database after retries", {
      error: error instanceof Error ? error.message : String(error),
      errorCode: error instanceof Error && 'code' in error ? error.code : undefined,
    });
    throw error;
  }
}

// Initialize database on module load
initDatabase().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isConnectionReset = errorMessage.includes("ConnectionReset") || 
                           errorMessage.includes("ECONNRESET") ||
                           errorMessage.includes("10054") ||
                           errorMessage.includes("forcibly closed");
  
  logger.error("Failed to initialize database", {
    error: errorMessage,
    isConnectionReset,
    suggestion: isConnectionReset 
      ? "Check database server status, network connectivity, and connection pool settings. Consider adding ?connection_limit=10&pool_timeout=20 to DATABASE_URL"
      : "Check DATABASE_URL configuration and database server logs",
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
