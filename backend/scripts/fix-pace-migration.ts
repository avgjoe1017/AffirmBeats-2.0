/**
 * Script to manually apply the pace migration
 * This fixes the unique constraint to remove pace from it
 */

import { db } from "../src/db";

async function fixPaceMigration() {
  console.log("🔄 Starting pace migration fix...");

  try {
    // Delete duplicate "normal" pace records, keeping "slow" ones
    console.log("Deleting duplicate 'normal' pace records...");
    const deleteResult = await db.$executeRaw`
      DELETE FROM "affirmation_audio" a1
      USING "affirmation_audio" a2
      WHERE a1."affirmationId" = a2."affirmationId"
        AND a1."voiceId" = a2."voiceId"
        AND a1."pace" = 'normal'
        AND a2."pace" = 'slow'
    `;
    console.log(`✅ Deleted ${deleteResult} duplicate records`);

    // Update any remaining "normal" records to "slow"
    console.log("Updating remaining 'normal' records to 'slow'...");
    const updateResult = await db.$executeRaw`
      UPDATE "affirmation_audio" SET "pace" = 'slow' WHERE "pace" = 'normal' OR "pace" IS NULL
    `;
    console.log(`✅ Updated ${updateResult} records`);

    // Drop the old unique constraint
    console.log("Dropping old unique constraint...");
    await db.$executeRaw`
      ALTER TABLE "affirmation_audio" DROP CONSTRAINT IF EXISTS "affirmation_audio_affirmationId_voiceId_pace_key"
    `;
    console.log("✅ Dropped old constraint");

    // Add new unique constraint without pace
    console.log("Adding new unique constraint...");
    await db.$executeRaw`
      ALTER TABLE "affirmation_audio" ADD CONSTRAINT "affirmation_audio_affirmationId_voiceId_key" UNIQUE ("affirmationId", "voiceId")
    `;
    console.log("✅ Added new constraint");

    // Set default value to 'slow'
    console.log("Setting default pace to 'slow'...");
    await db.$executeRaw`
      ALTER TABLE "affirmation_audio" ALTER COLUMN "pace" SET DEFAULT 'slow'
    `;
    console.log("✅ Set default pace");

    console.log("🎉 Pace migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

fixPaceMigration();

