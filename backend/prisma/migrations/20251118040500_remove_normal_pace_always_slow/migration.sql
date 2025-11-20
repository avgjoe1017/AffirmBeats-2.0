-- Delete duplicate "normal" pace records, keeping "slow" ones
-- If both exist for same affirmation+voice, delete the "normal" one
DELETE FROM "affirmation_audio" a1
USING "affirmation_audio" a2
WHERE a1."affirmationId" = a2."affirmationId"
  AND a1."voiceId" = a2."voiceId"
  AND a1."pace" = 'normal'
  AND a2."pace" = 'slow';

-- Update any remaining "normal" records to "slow" (in case no "slow" version existed)
UPDATE "affirmation_audio" SET "pace" = 'slow' WHERE "pace" = 'normal' OR "pace" IS NULL;

-- Drop the old unique constraint
ALTER TABLE "affirmation_audio" DROP CONSTRAINT IF EXISTS "affirmation_audio_affirmationId_voiceId_pace_key";

-- Add new unique constraint without pace
ALTER TABLE "affirmation_audio" ADD CONSTRAINT "affirmation_audio_affirmationId_voiceId_key" UNIQUE ("affirmationId", "voiceId");

-- Set default value to 'slow'
ALTER TABLE "affirmation_audio" ALTER COLUMN "pace" SET DEFAULT 'slow';

