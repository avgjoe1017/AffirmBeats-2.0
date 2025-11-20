/**
 * Test Script: Verify Supabase Storage Integration
 * 
 * This script tests that:
 * 1. Supabase client can connect
 * 2. Storage buckets are accessible
 * 3. Files can be retrieved via signed URLs
 * 4. Backend routes would redirect correctly
 * 
 * Usage:
 *   bun run scripts/test-supabase-integration.ts
 */

import { getSupabaseClient, STORAGE_BUCKETS, getSignedUrl, isSupabaseConfigured } from "../src/lib/supabase";

// Test files to verify (sample from each bucket)
const TEST_FILES = {
  binaural: "alpha_10hz_400_3min.m4a",
  solfeggio: "solfeggio_432_3min.m4a",
  background: "looped/Heavy Rain.m4a",
  affirmations: null as string | null, // Will test if any exist
};

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${name}: ${message}`);
  if (details && !passed) {
    console.log(`   Details:`, details);
  }
}

async function testSupabaseConnection() {
  console.log("\n🔍 Testing Supabase Connection...\n");

  if (!isSupabaseConfigured()) {
    addResult(
      "Supabase Configuration",
      false,
      "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    );
    return false;
  }

  addResult("Supabase Configuration", true, "Environment variables set");

  const supabase = getSupabaseClient();
  if (!supabase) {
    addResult("Supabase Client", false, "Failed to initialize Supabase client");
    return false;
  }

  addResult("Supabase Client", true, "Client initialized successfully");
  return true;
}

async function testStorageBuckets() {
  console.log("\n📦 Testing Storage Buckets...\n");

  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const buckets = [
    STORAGE_BUCKETS.AFFIRMATIONS,
    STORAGE_BUCKETS.BINAURAL,
    STORAGE_BUCKETS.SOLFEGGIO,
    STORAGE_BUCKETS.BACKGROUND,
  ];

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list("", {
        limit: 1,
      });

      if (error) {
        addResult(
          `Bucket: ${bucket}`,
          false,
          `Error accessing bucket: ${error.message}`,
          { error: error.message, code: error.statusCode }
        );
      } else {
        addResult(
          `Bucket: ${bucket}`,
          true,
          `Bucket accessible (${data?.length || 0} items found)`
        );
      }
    } catch (error) {
      addResult(
        `Bucket: ${bucket}`,
        false,
        `Exception: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

async function testFileAccess() {
  console.log("\n📁 Testing File Access...\n");

  // Test binaural file
  try {
    const signedUrl = await getSignedUrl(STORAGE_BUCKETS.BINAURAL, TEST_FILES.binaural, 60);
    if (signedUrl) {
      addResult(
        "Binaural File Access",
        true,
        `Signed URL generated: ${signedUrl.substring(0, 80)}...`
      );
    } else {
      addResult("Binaural File Access", false, "Failed to generate signed URL");
    }
  } catch (error) {
    addResult(
      "Binaural File Access",
      false,
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Test solfeggio file
  try {
    const signedUrl = await getSignedUrl(STORAGE_BUCKETS.SOLFEGGIO, TEST_FILES.solfeggio, 60);
    if (signedUrl) {
      addResult(
        "Solfeggio File Access",
        true,
        `Signed URL generated: ${signedUrl.substring(0, 80)}...`
      );
    } else {
      addResult("Solfeggio File Access", false, "Failed to generate signed URL");
    }
  } catch (error) {
    addResult(
      "Solfeggio File Access",
      false,
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Test background file
  try {
    const signedUrl = await getSignedUrl(STORAGE_BUCKETS.BACKGROUND, TEST_FILES.background, 60);
    if (signedUrl) {
      addResult(
        "Background File Access",
        true,
        `Signed URL generated: ${signedUrl.substring(0, 80)}...`
      );
    } else {
      addResult("Background File Access", false, "Failed to generate signed URL");
    }
  } catch (error) {
    addResult(
      "Background File Access",
      false,
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function testFileUrls() {
  console.log("\n🔗 Testing File URLs...\n");

  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  // Test public URL generation
  const testCases = [
    { bucket: STORAGE_BUCKETS.BINAURAL, file: TEST_FILES.binaural },
    { bucket: STORAGE_BUCKETS.SOLFEGGIO, file: TEST_FILES.solfeggio },
    { bucket: STORAGE_BUCKETS.BACKGROUND, file: TEST_FILES.background },
  ];

  for (const testCase of testCases) {
    try {
      const { data } = supabase.storage.from(testCase.bucket).getPublicUrl(testCase.file);
      if (data.publicUrl) {
        addResult(
          `Public URL: ${testCase.bucket}`,
          true,
          `URL: ${data.publicUrl.substring(0, 80)}...`
        );
      } else {
        addResult(`Public URL: ${testCase.bucket}`, false, "No public URL returned");
      }
    } catch (error) {
      addResult(
        `Public URL: ${testCase.bucket}`,
        false,
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

async function testBackendRouteSimulation() {
  console.log("\n🔄 Testing Backend Route Simulation...\n");

  // Simulate what the backend routes do
  const testRoutes = [
    { path: `/api/audio/binaural/${TEST_FILES.binaural}`, bucket: STORAGE_BUCKETS.BINAURAL, file: TEST_FILES.binaural },
    { path: `/api/audio/solfeggio/${TEST_FILES.solfeggio}`, bucket: STORAGE_BUCKETS.SOLFEGGIO, file: TEST_FILES.solfeggio },
    { path: `/api/audio/background/${TEST_FILES.background}`, bucket: STORAGE_BUCKETS.BACKGROUND, file: TEST_FILES.background },
  ];

  for (const route of testRoutes) {
    try {
      const signedUrl = await getSignedUrl(route.bucket, route.file, 3600);
      if (signedUrl) {
        addResult(
          `Route: ${route.path}`,
          true,
          `Would redirect to Supabase (URL generated)`
        );
      } else {
        addResult(
          `Route: ${route.path}`,
          false,
          "Would fall back to local file (Supabase URL not available)"
        );
      }
    } catch (error) {
      addResult(
        `Route: ${route.path}`,
        false,
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

async function runAllTests() {
  console.log("🧪 Supabase Storage Integration Test");
  console.log("=" .repeat(60));
  console.log(`Project: ${process.env.SUPABASE_URL || "Not configured"}`);
  console.log("=" .repeat(60));

  const connected = await testSupabaseConnection();
  if (!connected) {
    console.log("\n❌ Cannot proceed - Supabase not configured");
    process.exit(1);
  }

  await testStorageBuckets();
  await testFileAccess();
  await testFileUrls();
  await testBackendRouteSimulation();

  // Summary
  console.log("\n" + "=" .repeat(60));
  console.log("📊 Test Summary");
  console.log("=" .repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log("\n⚠️  Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
  }

  if (failed === 0) {
    console.log("\n✅ All tests passed! Supabase integration is working correctly.");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tests failed. Check the details above.");
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});

