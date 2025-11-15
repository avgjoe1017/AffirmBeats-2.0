/**
 * Database Wrapper
 * 
 * Wraps Prisma client to add metrics collection and logging.
 */

import { db } from "../db";
import { metricHelpers } from "./metrics";
import { logger } from "./logger";

/**
 * Wrap database operations with metrics and logging
 */
export const dbWithMetrics = {
  /**
   * Execute a database operation with metrics
   */
  async execute<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      metricHelpers.dbOperation(operation, table, duration);
      logger.debug("Database operation completed", {
        operation,
        table,
        duration: `${duration}ms`,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      metricHelpers.dbError(operation, table, error instanceof Error ? error.message : "Unknown error");
      logger.error("Database operation failed", error, {
        operation,
        table,
        duration: `${duration}ms`,
      });
      
      throw error;
    }
  },

  /**
   * Wrapped Prisma client methods
   */
  user: {
    findUnique: async (args: Parameters<typeof db.user.findUnique>[0]) => {
      return dbWithMetrics.execute("findUnique", "user", () => db.user.findUnique(args));
    },
    findMany: async (args: Parameters<typeof db.user.findMany>[0]) => {
      return dbWithMetrics.execute("findMany", "user", () => db.user.findMany(args));
    },
    create: async (args: Parameters<typeof db.user.create>[0]) => {
      return dbWithMetrics.execute("create", "user", () => db.user.create(args));
    },
    update: async (args: Parameters<typeof db.user.update>[0]) => {
      return dbWithMetrics.execute("update", "user", () => db.user.update(args));
    },
    delete: async (args: Parameters<typeof db.user.delete>[0]) => {
      return dbWithMetrics.execute("delete", "user", () => db.user.delete(args));
    },
  },

  affirmationSession: {
    findUnique: async (args: Parameters<typeof db.affirmationSession.findUnique>[0]) => {
      return dbWithMetrics.execute("findUnique", "affirmationSession", () => db.affirmationSession.findUnique(args));
    },
    findMany: async (args: Parameters<typeof db.affirmationSession.findMany>[0]) => {
      return dbWithMetrics.execute("findMany", "affirmationSession", () => db.affirmationSession.findMany(args));
    },
    create: async (args: Parameters<typeof db.affirmationSession.create>[0]) => {
      return dbWithMetrics.execute("create", "affirmationSession", () => db.affirmationSession.create(args));
    },
    update: async (args: Parameters<typeof db.affirmationSession.update>[0]) => {
      return dbWithMetrics.execute("update", "affirmationSession", () => db.affirmationSession.update(args));
    },
    delete: async (args: Parameters<typeof db.affirmationSession.delete>[0]) => {
      return dbWithMetrics.execute("delete", "affirmationSession", () => db.affirmationSession.delete(args));
    },
  },

  userPreferences: {
    findUnique: async (args: Parameters<typeof db.userPreferences.findUnique>[0]) => {
      return dbWithMetrics.execute("findUnique", "userPreferences", () => db.userPreferences.findUnique(args));
    },
    findMany: async (args: Parameters<typeof db.userPreferences.findMany>[0]) => {
      return dbWithMetrics.execute("findMany", "userPreferences", () => db.userPreferences.findMany(args));
    },
    create: async (args: Parameters<typeof db.userPreferences.create>[0]) => {
      return dbWithMetrics.execute("create", "userPreferences", () => db.userPreferences.create(args));
    },
    update: async (args: Parameters<typeof db.userPreferences.update>[0]) => {
      return dbWithMetrics.execute("update", "userPreferences", () => db.userPreferences.update(args));
    },
    delete: async (args: Parameters<typeof db.userPreferences.delete>[0]) => {
      return dbWithMetrics.execute("delete", "userPreferences", () => db.userPreferences.delete(args));
    },
  },

  userSubscription: {
    findUnique: async (args: Parameters<typeof db.userSubscription.findUnique>[0]) => {
      return dbWithMetrics.execute("findUnique", "userSubscription", () => db.userSubscription.findUnique(args));
    },
    findMany: async (args: Parameters<typeof db.userSubscription.findMany>[0]) => {
      return dbWithMetrics.execute("findMany", "userSubscription", () => db.userSubscription.findMany(args));
    },
    create: async (args: Parameters<typeof db.userSubscription.create>[0]) => {
      return dbWithMetrics.execute("create", "userSubscription", () => db.userSubscription.create(args));
    },
    update: async (args: Parameters<typeof db.userSubscription.update>[0]) => {
      return dbWithMetrics.execute("update", "userSubscription", () => db.userSubscription.update(args));
    },
    delete: async (args: Parameters<typeof db.userSubscription.delete>[0]) => {
      return dbWithMetrics.execute("delete", "userSubscription", () => db.userSubscription.delete(args));
    },
  },

  // Expose original db for operations that don't need metrics
  $queryRaw: db.$queryRaw,
  $queryRawUnsafe: db.$queryRawUnsafe,
  $disconnect: db.$disconnect,
};

