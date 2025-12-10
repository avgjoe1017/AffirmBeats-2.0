-- Add affirmationSpacing column to user_preferences table
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "affirmationSpacing" INTEGER NOT NULL DEFAULT 8;

