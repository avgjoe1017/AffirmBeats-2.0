-- CreateTable
CREATE TABLE "affirmation_audio" (
    "id" TEXT NOT NULL,
    "affirmationId" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "pace" TEXT NOT NULL DEFAULT 'normal',
    "cacheKey" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affirmation_audio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "affirmation_audio_affirmationId_idx" ON "affirmation_audio"("affirmationId");

-- CreateIndex
CREATE INDEX "affirmation_audio_cacheKey_idx" ON "affirmation_audio"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "affirmation_audio_affirmationId_voiceId_pace_key" ON "affirmation_audio"("affirmationId", "voiceId", "pace");

-- AddForeignKey
ALTER TABLE "affirmation_audio" ADD CONSTRAINT "affirmation_audio_affirmationId_fkey" FOREIGN KEY ("affirmationId") REFERENCES "affirmation_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;
