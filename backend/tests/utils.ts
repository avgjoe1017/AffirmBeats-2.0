/**
 * Test Utilities
 * 
 * Helper functions for creating test data and cleaning up test data.
 */

import { db } from "../src/db";
import type { Prisma } from "../generated/prisma";

// Note: When using PostgreSQL, you may need to adjust the ID generation
// For SQLite, we use cuid() which is already handled by Prisma

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  id?: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
}) {
  const userId = data?.id || `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  return db.user.create({
    data: {
      id: userId,
      email: data?.email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      name: data?.name || "Test User",
      emailVerified: data?.emailVerified || false,
    },
  });
}

/**
 * Create test user preferences
 */
export async function createTestUserPreferences(
  userId: string,
  data?: Partial<Prisma.UserPreferencesCreateInput>
) {
  return db.userPreferences.create({
    data: {
      userId,
      voice: data?.voice || "neutral",
      pace: data?.pace || "normal",
      noise: data?.noise || "rain",
      pronounStyle: data?.pronounStyle || "you",
      intensity: data?.intensity || "gentle",
    },
  });
}

/**
 * Create test preferences (alias for createTestUserPreferences)
 */
export async function createTestPreferences(
  userId: string,
  preferences?: {
    voice?: string;
    pace?: string;
    noise?: string;
    pronounStyle?: string;
    intensity?: string;
  }
) {
  return createTestUserPreferences(userId, preferences);
}

/**
 * Create test user subscription
 */
export async function createTestUserSubscription(
  userId: string,
  data?: Partial<Prisma.UserSubscriptionCreateInput>
) {
  return db.userSubscription.create({
    data: {
      userId,
      tier: data?.tier || "free",
      status: data?.status || "active",
      billingPeriod: data?.billingPeriod || null,
      currentPeriodStart: data?.currentPeriodStart || null,
      currentPeriodEnd: data?.currentPeriodEnd || null,
      cancelAtPeriodEnd: data?.cancelAtPeriodEnd || false,
      customSessionsUsedThisMonth: data?.customSessionsUsedThisMonth || 0,
      lastResetDate: data?.lastResetDate || new Date(),
    },
  });
}

/**
 * Create test affirmation session
 */
export async function createTestSession(
  userId: string,
  data?: Partial<Prisma.AffirmationSessionCreateInput>
) {
  const sessionId = data?.id || `test-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  return db.affirmationSession.create({
    data: {
      id: sessionId,
      userId,
      goal: data?.goal || "sleep",
      title: data?.title || "Test Session",
      affirmations: data?.affirmations || JSON.stringify([
        "I am relaxed",
        "I am calm",
        "I am peaceful",
      ]),
      voiceId: data?.voiceId || "neutral",
      pace: data?.pace || "slow",
      noise: data?.noise || "rain",
      lengthSec: data?.lengthSec || 180,
      isFavorite: data?.isFavorite || false,
      binauralCategory: data?.binauralCategory || "delta",
      binauralHz: data?.binauralHz || "0.5-4",
    },
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  try {
    // Delete test sessions
    await db.affirmationSession.deleteMany({
      where: {
        id: {
          startsWith: "test-",
        },
      },
    });

    // Delete test preferences
    await db.userPreferences.deleteMany({
      where: {
        userId: {
          startsWith: "test-",
        },
      },
    });

    // Delete test subscriptions
    await db.userSubscription.deleteMany({
      where: {
        userId: {
          startsWith: "test-",
        },
      },
    });

    // Delete test users
    await db.user.deleteMany({
      where: {
        id: {
          startsWith: "test-",
        },
      },
    });
  } catch (error) {
    // Ignore cleanup errors
    console.debug("Cleanup error (ignored):", error);
  }
}

/**
 * Create a complete test user with preferences and subscription
 */
export async function createCompleteTestUser(data?: {
  userId?: string;
  email?: string;
  name?: string;
  tier?: "free" | "pro";
  preferences?: Partial<Prisma.UserPreferencesCreateInput>;
}) {
  const user = await createTestUser({
    id: data?.userId,
    email: data?.email,
    name: data?.name,
  });

  await createTestUserPreferences(user.id, data?.preferences);
  await createTestUserSubscription(user.id, {
    tier: data?.tier || "free",
  });

  return user;
}
