/**
 * Script to manually add affirmationSpacing column
 */

import { db } from "../src/db";

async function addAffirmationSpacing() {
  console.log("🔄 Adding affirmationSpacing column...");

  try {
    await db.$executeRaw`
      ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "affirmationSpacing" INTEGER NOT NULL DEFAULT 8
    `;
    console.log("✅ Added affirmationSpacing column");

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

addAffirmationSpacing();

