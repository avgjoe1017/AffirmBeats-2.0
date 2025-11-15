#!/usr/bin/env bun
/**
 * Database Migration Script: SQLite → PostgreSQL
 * 
 * This script migrates data from SQLite to PostgreSQL.
 * 
 * Usage:
 *   bun run scripts/migrate-to-postgresql.ts
 * 
 * Prerequisites:
 *   1. PostgreSQL database is set up and accessible
 *   2. DATABASE_URL points to PostgreSQL
 *   3. SQLite database exists at the old location
 *   4. Prisma schema is updated to use PostgreSQL
 */

import { PrismaClient as SQLiteClient } from "@prisma/client";
import { PrismaClient as PostgresClient } from "../generated/prisma";
import { logger } from "../src/lib/logger";
import * as fs from "fs";
import * as path from "path";

// Get SQLite database path from environment or use default
const sqliteUrl = process.env.SQLITE_DATABASE_URL || "file:dev.db";
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error("❌ DATABASE_URL must be set to PostgreSQL connection string");
  process.exit(1);
}

if (!postgresUrl.startsWith("postgresql://") && !postgresUrl.startsWith("postgres://")) {
  console.error("❌ DATABASE_URL must be a PostgreSQL connection string");
  process.exit(1);
}

// Initialize clients
const sqlite = new SQLiteClient({
  datasources: {
    db: {
      url: sqliteUrl,
    },
  },
});

const postgres = new PostgresClient({
  datasources: {
    db: {
      url: postgresUrl,
    },
  },
});

/**
 * Migrate data from SQLite to PostgreSQL
 */
async function migrateData() {
  logger.info("Starting database migration", {
    from: sqliteUrl,
    to: postgresUrl.substring(0, 20) + "...", // Don't log full URL
  });

  try {
    // Test connections
    logger.info("Testing database connections...");
    await sqlite.$connect();
    logger.info("✅ SQLite connection successful");
    
    await postgres.$connect();
    logger.info("✅ PostgreSQL connection successful");

    // Migrate users
    logger.info("Migrating users...");
    const users = await sqlite.user.findMany();
    logger.info(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      await postgres.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
          updatedAt: user.updatedAt,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    }
    logger.info(`✅ Migrated ${users.length} users`);

    // Migrate sessions
    logger.info("Migrating sessions...");
    const sessions = await sqlite.session.findMany();
    logger.info(`Found ${sessions.length} sessions to migrate`);
    
    for (const session of sessions) {
      await postgres.session.upsert({
        where: { id: session.id },
        update: {
          expiresAt: session.expiresAt,
          token: session.token,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          userId: session.userId,
          updatedAt: session.updatedAt,
        },
        create: {
          id: session.id,
          expiresAt: session.expiresAt,
          token: session.token,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          userId: session.userId,
        },
      });
    }
    logger.info(`✅ Migrated ${sessions.length} sessions`);

    // Migrate accounts
    logger.info("Migrating accounts...");
    const accounts = await sqlite.account.findMany();
    logger.info(`Found ${accounts.length} accounts to migrate`);
    
    for (const account of accounts) {
      await postgres.account.upsert({
        where: { id: account.id },
        update: {
          accountId: account.accountId,
          providerId: account.providerId,
          userId: account.userId,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          idToken: account.idToken,
          accessTokenExpiresAt: account.accessTokenExpiresAt,
          refreshTokenExpiresAt: account.refreshTokenExpiresAt,
          scope: account.scope,
          password: account.password,
          updatedAt: account.updatedAt,
        },
        create: {
          id: account.id,
          accountId: account.accountId,
          providerId: account.providerId,
          userId: account.userId,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken,
          idToken: account.idToken,
          accessTokenExpiresAt: account.accessTokenExpiresAt,
          refreshTokenExpiresAt: account.refreshTokenExpiresAt,
          scope: account.scope,
          password: account.password,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        },
      });
    }
    logger.info(`✅ Migrated ${accounts.length} accounts`);

    // Migrate verifications
    logger.info("Migrating verifications...");
    const verifications = await sqlite.verification.findMany();
    logger.info(`Found ${verifications.length} verifications to migrate`);
    
    for (const verification of verifications) {
      await postgres.verification.upsert({
        where: { id: verification.id },
        update: {
          identifier: verification.identifier,
          value: verification.value,
          expiresAt: verification.expiresAt,
          updatedAt: verification.updatedAt,
        },
        create: {
          id: verification.id,
          identifier: verification.identifier,
          value: verification.value,
          expiresAt: verification.expiresAt,
          createdAt: verification.createdAt,
          updatedAt: verification.updatedAt,
        },
      });
    }
    logger.info(`✅ Migrated ${verifications.length} verifications`);

    // Migrate profiles
    logger.info("Migrating profiles...");
    const profiles = await sqlite.profile.findMany();
    logger.info(`Found ${profiles.length} profiles to migrate`);
    
    for (const profile of profiles) {
      await postgres.profile.upsert({
        where: { id: profile.id },
        update: {
          handle: profile.handle,
          userId: profile.userId,
        },
        create: {
          id: profile.id,
          handle: profile.handle,
          userId: profile.userId,
        },
      });
    }
    logger.info(`✅ Migrated ${profiles.length} profiles`);

    // Migrate preferences
    logger.info("Migrating preferences...");
    const preferences = await sqlite.userPreferences.findMany();
    logger.info(`Found ${preferences.length} preferences to migrate`);
    
    for (const pref of preferences) {
      await postgres.userPreferences.upsert({
        where: { userId: pref.userId },
        update: {
          voice: pref.voice,
          pace: pref.pace,
          noise: pref.noise,
          pronounStyle: pref.pronounStyle,
          intensity: pref.intensity,
          updatedAt: pref.updatedAt,
        },
        create: {
          id: pref.id,
          userId: pref.userId,
          voice: pref.voice,
          pace: pref.pace,
          noise: pref.noise,
          pronounStyle: pref.pronounStyle,
          intensity: pref.intensity,
          updatedAt: pref.updatedAt,
        },
      });
    }
    logger.info(`✅ Migrated ${preferences.length} preferences`);

    // Migrate affirmation sessions
    logger.info("Migrating affirmation sessions...");
    const sessions2 = await sqlite.affirmationSession.findMany();
    logger.info(`Found ${sessions2.length} affirmation sessions to migrate`);
    
    for (const session of sessions2) {
      await postgres.affirmationSession.upsert({
        where: { id: session.id },
        update: {
          userId: session.userId,
          goal: session.goal,
          title: session.title,
          affirmations: session.affirmations,
          voiceId: session.voiceId,
          pace: session.pace,
          noise: session.noise,
          lengthSec: session.lengthSec,
          audioUrl: session.audioUrl,
          isFavorite: session.isFavorite,
          binauralCategory: session.binauralCategory,
          binauralHz: session.binauralHz,
        },
        create: {
          id: session.id,
          userId: session.userId,
          goal: session.goal,
          title: session.title,
          affirmations: session.affirmations,
          voiceId: session.voiceId,
          pace: session.pace,
          noise: session.noise,
          lengthSec: session.lengthSec,
          audioUrl: session.audioUrl,
          isFavorite: session.isFavorite,
          binauralCategory: session.binauralCategory,
          binauralHz: session.binauralHz,
          createdAt: session.createdAt,
        },
      });
    }
    logger.info(`✅ Migrated ${sessions2.length} affirmation sessions`);

    // Migrate subscriptions
    logger.info("Migrating subscriptions...");
    const subscriptions = await sqlite.userSubscription.findMany();
    logger.info(`Found ${subscriptions.length} subscriptions to migrate`);
    
    for (const sub of subscriptions) {
      await postgres.userSubscription.upsert({
        where: { userId: sub.userId },
        update: {
          tier: sub.tier,
          status: sub.status,
          billingPeriod: sub.billingPeriod,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          customSessionsUsedThisMonth: sub.customSessionsUsedThisMonth,
          lastResetDate: sub.lastResetDate,
          updatedAt: sub.updatedAt,
        },
        create: {
          id: sub.id,
          userId: sub.userId,
          tier: sub.tier,
          status: sub.status,
          billingPeriod: sub.billingPeriod,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          customSessionsUsedThisMonth: sub.customSessionsUsedThisMonth,
          lastResetDate: sub.lastResetDate,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        },
      });
    }
    logger.info(`✅ Migrated ${subscriptions.length} subscriptions`);

    // Migrate TTS cache
    logger.info("Migrating TTS cache...");
    const ttsCache = await sqlite.ttsCache.findMany();
    logger.info(`Found ${ttsCache.length} TTS cache entries to migrate`);
    
    for (const cache of ttsCache) {
      await postgres.ttsCache.upsert({
        where: { cacheKey: cache.cacheKey },
        update: {
          filePath: cache.filePath,
          fileSize: cache.fileSize,
          affirmationsCount: cache.affirmationsCount,
          voiceType: cache.voiceType,
          pace: cache.pace,
          affirmationSpacing: cache.affirmationSpacing,
          lastAccessedAt: cache.lastAccessedAt,
          accessCount: cache.accessCount,
        },
        create: {
          id: cache.id,
          cacheKey: cache.cacheKey,
          filePath: cache.filePath,
          fileSize: cache.fileSize,
          affirmationsCount: cache.affirmationsCount,
          voiceType: cache.voiceType,
          pace: cache.pace,
          affirmationSpacing: cache.affirmationSpacing,
          createdAt: cache.createdAt,
          lastAccessedAt: cache.lastAccessedAt,
          accessCount: cache.accessCount,
        },
      });
    }
    logger.info(`✅ Migrated ${ttsCache.length} TTS cache entries`);

    logger.info("✅ Database migration completed successfully");
  } catch (error) {
    logger.error("❌ Database migration failed", error);
    throw error;
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
    logger.info("Database connections closed");
  }
}

// Run migration
migrateData()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

