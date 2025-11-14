/**
 * Database Seeding Script for Affirmation Sessions
 * 
 * This script populates the database with sample affirmation sessions.
 * Run with: bun run scripts/seed-sessions.ts
 */

import { db } from "../src/db";

// Sample sessions will be populated with the actual user ID in the seedSessions function

async function seedSessions() {
  console.log("🌱 Starting session seeding...");

  try {
    // Try to find an existing user, or create a seed user
    let user = await db.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!user) {
      console.log("👤 No users found. Creating seed user...");
      user = await db.user.create({
        data: {
          id: "seed-user-1",
          email: "seed@example.com",
          name: "Seed User",
          emailVerified: false,
        },
      });
      console.log("✅ Seed user created");
    } else {
      console.log(`✅ Using existing user: ${user.email} (${user.id})`);
    }

    // Populate sessions with user ID
    const SAMPLE_SESSIONS = [
      {
        userId: user.id,
        goal: "sleep",
        title: "Deep Sleep Journey",
        affirmations: JSON.stringify([
          "I am ready to release the day",
          "My body knows how to rest deeply",
          "I deserve this peaceful moment",
          "My mind is settling into stillness",
          "I am safe and supported here",
          "I trust my body to restore itself",
        ]),
        voiceId: "neutral",
        pace: "slow",
        noise: "rain",
        lengthSec: 600,
        binauralCategory: "delta",
        binauralHz: "0.5-4",
      },
      {
        userId: user.id,
        goal: "focus",
        title: "Productivity Boost",
        affirmations: JSON.stringify([
          "I am capable of great focus",
          "My mind is clear and ready",
          "I accomplish what matters today",
          "My energy serves my purpose",
          "I work with confidence and ease",
          "I am exactly where I need to be",
        ]),
        voiceId: "confident",
        pace: "normal",
        noise: "brown",
        lengthSec: 300,
        binauralCategory: "beta",
        binauralHz: "14-30",
      },
      {
        userId: user.id,
        goal: "calm",
        title: "Peaceful Reset",
        affirmations: JSON.stringify([
          "I am at peace in this moment",
          "My breath brings me back to calm",
          "I release what I cannot control",
          "My heart is open and at ease",
          "I trust the journey I am on",
          "I am exactly as I need to be",
        ]),
        voiceId: "whisper",
        pace: "slow",
        noise: "ocean",
        lengthSec: 600,
        binauralCategory: "alpha",
        binauralHz: "8-14",
      },
      {
        userId: user.id,
        goal: "manifest",
        title: "Abundance Flow",
        affirmations: JSON.stringify([
          "I am a powerful creator of my reality",
          "My dreams are becoming my reality now",
          "I attract abundance with ease and joy",
          "My goals are aligning perfectly for me",
          "I am worthy of all I desire",
          "My success is inevitable and natural",
        ]),
        voiceId: "confident",
        pace: "normal",
        noise: "none",
        lengthSec: 300,
        binauralCategory: "gamma",
        binauralHz: "30-100",
      },
    ];

    // Check existing sessions
    const existingSessions = await db.affirmationSession.findMany({
      where: { userId: user.id },
    });

    if (existingSessions.length > 0) {
      console.log(`⚠️  Found ${existingSessions.length} existing sessions for this user.`);
      console.log("   Skipping seeding to avoid duplicates.");
      console.log("   Delete existing sessions first if you want to re-seed.");
      return;
    }

    // Create sessions
    console.log(`📝 Creating ${SAMPLE_SESSIONS.length} sessions...`);
    for (const sessionData of SAMPLE_SESSIONS) {
      const session = await db.affirmationSession.create({
        data: sessionData,
      });
      console.log(`   ✅ Created: ${session.title} (${session.goal})`);
    }

    console.log("\n🎉 Session seeding completed successfully!");
    console.log(`   Created ${SAMPLE_SESSIONS.length} sessions for user: ${user.email}`);
  } catch (error) {
    console.error("❌ Error seeding sessions:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the seeding
seedSessions();

