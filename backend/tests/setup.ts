import { beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

// Use test database when provided
export const prisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
});

beforeAll(async () => {
  process.env.NODE_ENV = "test";
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Test Setup File
 * 
 * This file runs before all tests to set up the test environment.
 * It includes database setup, cleanup, and other test configuration.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { db } from "../src/db";

// Suppress console output during tests (optional)
// Uncomment if you want to suppress logs during tests
// const originalConsole = { ...console };
// console.log = () => {};
// console.info = () => {};
// console.warn = () => {};
// console.error = () => {};

beforeAll(async () => {
  // Set up test database
  // You can use a separate test database or reset the dev database
  console.log("Setting up test database...");
  
  // Test database connection
  try {
    await db.$connect();
    console.log("Test database connected");
  } catch (error) {
    console.error("Failed to connect to test database", error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up test database
  console.log("Cleaning up test database...");
  await db.$disconnect();
  console.log("Test database cleaned up");
});

beforeEach(async () => {
  // Clean up test data before each test
  // This ensures tests don't interfere with each other
  await cleanupTestData();
});

afterEach(async () => {
  // Clean up test data after each test
  await cleanupTestData();
});

/**
 * Clean up test data
 */
async function cleanupTestData() {
  try {
    // Delete test sessions (sessions with IDs starting with "test-")
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

    // Delete test users (users with IDs starting with "test-")
    await db.user.deleteMany({
      where: {
        id: {
          startsWith: "test-",
        },
      },
    });
  } catch (error) {
    // Ignore cleanup errors (database might not exist yet)
    console.debug("Cleanup error (ignored):", error);
  }
}
