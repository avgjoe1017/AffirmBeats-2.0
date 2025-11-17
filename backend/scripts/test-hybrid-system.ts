#!/usr/bin/env bun
/**
 * Test Hybrid Affirmation System
 * 
 * Tests the three-tier matching system to verify it's working correctly
 */

import { db } from "../src/db";
import { matchOrGenerate } from "../src/lib/affirmationMatcher";

async function testHybridSystem() {
  console.log("🧪 Testing Hybrid Affirmation System\n");

  const testCases = [
    {
      name: "Exact Match Test",
      intent: "help me sleep better",
      goal: "sleep" as const,
      expectedType: "exact",
    },
    {
      name: "Pooled Match Test",
      intent: "I need to relax and reduce stress",
      goal: "calm" as const,
      expectedType: "pooled",
    },
    {
      name: "Unique Generation Test",
      intent: "I want to learn quantum physics while meditating",
      goal: "focus" as const,
      expectedType: "generated",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   Intent: "${testCase.intent}"`);
    console.log(`   Goal: ${testCase.goal}`);
    
    try {
      const result = await matchOrGenerate(
        testCase.intent,
        testCase.goal,
        undefined,
        false
      );

      console.log(`   ✅ Match Type: ${result.type}`);
      console.log(`   💰 Cost: $${result.cost.toFixed(2)}`);
      console.log(`   📊 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`   📝 Affirmations: ${result.affirmations.length}`);
      
      if (result.type === testCase.expectedType) {
        console.log(`   ✅ Expected type matched!`);
      } else {
        console.log(`   ⚠️  Expected ${testCase.expectedType}, got ${result.type}`);
      }

      // Show first affirmation
      if (result.affirmations.length > 0) {
        console.log(`   💬 Example: "${result.affirmations[0]}"`);
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  // Check generation logs
  console.log(`\n\n📊 Recent Generation Logs:`);
  const recentLogs = await db.generationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (recentLogs.length === 0) {
    console.log("   No logs found yet");
  } else {
    const matchTypeCounts = recentLogs.reduce((acc, log) => {
      acc[log.matchType] = (acc[log.matchType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`   Total logs: ${recentLogs.length}`);
    console.log(`   Match types:`, matchTypeCounts);
    
    const totalCost = recentLogs.reduce((sum, log) => sum + log.apiCost, 0);
    const fullGenCost = recentLogs.length * 0.21;
    const savings = fullGenCost - totalCost;
    
    console.log(`   💰 Total cost: $${totalCost.toFixed(2)}`);
    console.log(`   💰 Would cost (all generated): $${fullGenCost.toFixed(2)}`);
    console.log(`   💰 Savings: $${savings.toFixed(2)} (${((savings / fullGenCost) * 100).toFixed(0)}%)`);
  }

  // Check library stats
  console.log(`\n\n📚 Library Statistics:`);
  const affirmationCount = await db.affirmationLine.count();
  const templateCount = await db.sessionTemplate.count();
  
  console.log(`   Affirmations in pool: ${affirmationCount}`);
  console.log(`   Session templates: ${templateCount}`);

  await db.$disconnect();
  console.log(`\n✅ Testing complete!\n`);
}

testHybridSystem().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});

