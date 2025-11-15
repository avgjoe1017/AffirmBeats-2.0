#!/usr/bin/env bun
/**
 * Production Setup Verification Script
 * 
 * This script verifies that all production configurations are set up correctly.
 * 
 * Usage:
 *   bun run scripts/verify-production-setup.ts
 */

import { logger } from "../src/lib/logger";
import { env } from "../src/env";
import { isRedisAvailable } from "../src/lib/redis";
import { initSentry } from "../src/lib/sentry";
import { db } from "../src/db";

async function verifyProductionSetup() {
  logger.info("Verifying production setup...");

  const checks: Array<{
    name: string;
    status: "ok" | "warning" | "error";
    message: string;
  }> = [];

  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    const isPostgreSQL = !env.DATABASE_URL.startsWith("file:");
    checks.push({
      name: "Database",
      status: isPostgreSQL ? "ok" : "warning",
      message: isPostgreSQL
        ? "✅ PostgreSQL database connected"
        : "⚠️  Using SQLite (not recommended for production)",
    });
  } catch (error) {
    checks.push({
      name: "Database",
      status: "error",
      message: `❌ Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }

  // Check Redis
  try {
    const redisAvailable = await isRedisAvailable();
    checks.push({
      name: "Redis",
      status: redisAvailable ? "ok" : "warning",
      message: redisAvailable
        ? "✅ Redis connected"
        : "⚠️  Redis not configured (using in-memory fallback)",
    });
  } catch (error) {
    checks.push({
      name: "Redis",
      status: "warning",
      message: "⚠️  Redis check failed (optional for production)",
    });
  }

  // Check Sentry
  try {
    await initSentry();
    const sentryConfigured = !!env.SENTRY_DSN;
    checks.push({
      name: "Sentry",
      status: sentryConfigured ? "ok" : "warning",
      message: sentryConfigured
        ? "✅ Sentry configured"
        : "⚠️  Sentry not configured (error tracking disabled)",
    });
  } catch (error) {
    checks.push({
      name: "Sentry",
      status: "warning",
      message: "⚠️  Sentry initialization failed (optional for production)",
    });
  }

  // Check environment variables
  const requiredEnvVars = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BACKEND_URL"];
  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key] || process.env[key] === ""
  );

  if (missingEnvVars.length > 0) {
    checks.push({
      name: "Environment Variables",
      status: "error",
      message: `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`,
    });
  } else {
    checks.push({
      name: "Environment Variables",
      status: "ok",
      message: "✅ All required environment variables are set",
    });
  }

  // Check API keys (optional)
  const optionalEnvVars = ["OPENAI_API_KEY", "ELEVENLABS_API_KEY"];
  const missingOptionalEnvVars = optionalEnvVars.filter(
    (key) => !process.env[key] || process.env[key] === ""
  );

  if (missingOptionalEnvVars.length > 0) {
    checks.push({
      name: "API Keys",
      status: "warning",
      message: `⚠️  Missing optional API keys: ${missingOptionalEnvVars.join(", ")}`,
    });
  } else {
    checks.push({
      name: "API Keys",
      status: "ok",
      message: "✅ All API keys are configured",
    });
  }

  // Check metrics services
  const metricsServices = [];
  if (process.env.DATADOG_API_KEY) {
    metricsServices.push("DataDog");
  }
  if (process.env.AWS_ACCESS_KEY_ID) {
    metricsServices.push("CloudWatch");
  }
  if (metricsServices.length > 0) {
    checks.push({
      name: "Metrics Services",
      status: "ok",
      message: `✅ Metrics services configured: ${metricsServices.join(", ")}`,
    });
  } else {
    checks.push({
      name: "Metrics Services",
      status: "warning",
      message: "⚠️  No metrics services configured (using built-in metrics only)",
    });
  }

  // Print results
  console.log("\n" + "=".repeat(50));
  console.log("Production Setup Verification");
  console.log("=".repeat(50) + "\n");

  for (const check of checks) {
    console.log(`${check.message}`);
  }

  console.log("\n" + "=".repeat(50));

  // Summary
  const errorCount = checks.filter((c) => c.status === "error").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const okCount = checks.filter((c) => c.status === "ok").length;

  console.log(`\nSummary: ${okCount} OK, ${warningCount} Warnings, ${errorCount} Errors\n`);

  if (errorCount > 0) {
    console.log("❌ Production setup has errors. Please fix them before deploying.");
    process.exit(1);
  } else if (warningCount > 0) {
    console.log("⚠️  Production setup has warnings. Review them before deploying.");
    process.exit(0);
  } else {
    console.log("✅ Production setup is ready!");
    process.exit(0);
  }
}

// Run verification
verifyProductionSetup().catch((error) => {
  console.error("Verification failed:", error);
  process.exit(1);
});

