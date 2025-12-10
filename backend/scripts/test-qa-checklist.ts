#!/usr/bin/env bun

/**
 * QA Checklist Testing Script
 * 
 * This script helps automate some of the QA checklist items
 * by testing backend endpoints and verifying functionality.
 * 
 * Usage: bun run scripts/test-qa-checklist.ts
 */

import { env } from "../src/env";
import { db } from "../src/db";
import { isRedisAvailable } from "../src/lib/redis";
import { isSupabaseConfigured } from "../src/lib/supabase";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip" | "warning";
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function addResult(name: string, status: TestResult["status"], message: string, details?: string) {
  results.push({ name, status, message, details });
  const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : status === "warning" ? "⚠️" : "⏭️";
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testDatabase() {
  console.log("\n📊 Testing Database...");
  
  try {
    // Test basic query
    await db.$queryRaw`SELECT 1`;
    addResult("Database Connection", "pass", "Database is accessible");
    
    // Check if using PostgreSQL
    const dbUrl = env.DATABASE_URL;
    if (dbUrl.startsWith("file:")) {
      addResult("Database Type", "warning", "Using SQLite (not production-ready)", 
        "Consider migrating to PostgreSQL for production");
    } else if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
      addResult("Database Type", "pass", "Using PostgreSQL (production-ready)");
    } else {
      addResult("Database Type", "warning", "Unknown database type", dbUrl);
    }
  } catch (error) {
    addResult("Database Connection", "fail", "Database connection failed", 
      error instanceof Error ? error.message : String(error));
  }
}

async function testRedis() {
  console.log("\n🔴 Testing Redis...");
  
  try {
    const available = await isRedisAvailable();
    if (available) {
      addResult("Redis Connection", "pass", "Redis is available and connected");
    } else {
      if (env.REDIS_URL) {
        addResult("Redis Connection", "fail", "Redis URL configured but connection failed",
          "Check REDIS_URL and Redis server status");
      } else {
        addResult("Redis Connection", "skip", "Redis not configured (optional)",
          "Rate limiting will use in-memory fallback");
      }
    }
  } catch (error) {
    addResult("Redis Connection", "fail", "Redis check failed",
      error instanceof Error ? error.message : String(error));
  }
}

async function testSupabase() {
  console.log("\n☁️ Testing Supabase...");
  
  try {
    const configured = isSupabaseConfigured();
    if (configured) {
      addResult("Supabase Configuration", "pass", "Supabase is configured");
    } else {
      addResult("Supabase Configuration", "skip", "Supabase not configured (optional)",
        "Audio files will be served from local storage");
    }
  } catch (error) {
    addResult("Supabase Configuration", "fail", "Supabase check failed",
      error instanceof Error ? error.message : String(error));
  }
}

async function testEnvironmentVariables() {
  console.log("\n🔐 Testing Environment Variables...");
  
  // Required
  if (env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length >= 32) {
    addResult("BETTER_AUTH_SECRET", "pass", "Configured and valid");
  } else {
    addResult("BETTER_AUTH_SECRET", "fail", "Missing or too short (min 32 chars)");
  }
  
  if (env.DATABASE_URL) {
    addResult("DATABASE_URL", "pass", "Configured");
  } else {
    addResult("DATABASE_URL", "fail", "Missing");
  }
  
  // Optional but recommended
  if (env.SENTRY_DSN) {
    addResult("SENTRY_DSN", "pass", "Configured");
  } else {
    addResult("SENTRY_DSN", "warning", "Not configured (recommended for production)");
  }
  
  if (env.ELEVENLABS_API_KEY) {
    addResult("ELEVENLABS_API_KEY", "pass", "Configured");
  } else {
    addResult("ELEVENLABS_API_KEY", "warning", "Not configured (TTS will not work)");
  }
  
  if (env.OPENAI_API_KEY) {
    addResult("OPENAI_API_KEY", "pass", "Configured");
  } else {
    addResult("OPENAI_API_KEY", "warning", "Not configured (session generation will not work)");
  }
  
  if (env.REDIS_URL) {
    addResult("REDIS_URL", "pass", "Configured");
  } else {
    addResult("REDIS_URL", "skip", "Not configured (optional, uses in-memory fallback)");
  }
}

async function testBackendHealth() {
  console.log("\n🏥 Testing Backend Health Endpoint...");
  
  try {
    const baseUrl = env.BACKEND_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/health`);
    
    if (response.ok) {
      const data = await response.json();
      addResult("Health Endpoint", "pass", "Health endpoint is accessible");
      
      if (data.checks) {
        if (data.checks.database === "ok") {
          addResult("Health Check - Database", "pass", "Database health check passed");
        } else {
          addResult("Health Check - Database", "fail", `Database health check: ${data.checks.database}`);
        }
        
        if (data.checks.redis === "ok") {
          addResult("Health Check - Redis", "pass", "Redis health check passed");
        } else if (data.checks.redis === "unavailable") {
          addResult("Health Check - Redis", "skip", "Redis not configured (optional)");
        } else {
          addResult("Health Check - Redis", "warning", `Redis health check: ${data.checks.redis}`);
        }
        
        if (data.checks.supabase === "ok") {
          addResult("Health Check - Supabase", "pass", "Supabase health check passed");
        } else if (data.checks.supabase === "not_configured") {
          addResult("Health Check - Supabase", "skip", "Supabase not configured (optional)");
        } else {
          addResult("Health Check - Supabase", "warning", `Supabase health check: ${data.checks.supabase}`);
        }
      }
    } else {
      addResult("Health Endpoint", "fail", `Health endpoint returned ${response.status}`);
    }
  } catch (error) {
    addResult("Health Endpoint", "fail", "Could not reach health endpoint",
      error instanceof Error ? error.message : String(error));
  }
}

function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📋 QA Checklist Test Summary");
  console.log("=".repeat(60));
  
  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const warnings = results.filter(r => r.status === "warning").length;
  const skipped = results.filter(r => r.status === "skip").length;
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.filter(r => r.status === "fail").forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  if (warnings > 0) {
    console.log("\n⚠️  Warnings:");
    results.filter(r => r.status === "warning").forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("\n💡 Next Steps:");
  console.log("   1. Fix any failed tests");
  console.log("   2. Review warnings (some may be acceptable)");
  console.log("   3. See MD_DOCS/QA_CHECKLIST_TRACKING.md for full checklist");
  console.log("   4. Test frontend functionality manually");
  console.log("   5. Test on real devices");
  console.log("\n");
}

async function main() {
  console.log("🧪 Running QA Checklist Tests...\n");
  
  await testEnvironmentVariables();
  await testDatabase();
  await testRedis();
  await testSupabase();
  await testBackendHealth();
  
  printSummary();
  
  // Exit with error code if any tests failed
  const failed = results.filter(r => r.status === "fail").length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exit(1);
});

