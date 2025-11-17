-- AlterTable
ALTER TABLE "affirmation_line" ADD COLUMN     "audioDurationMs" INTEGER;

-- AlterTable
ALTER TABLE "affirmation_session" ADD COLUMN     "silenceBetweenMs" INTEGER NOT NULL DEFAULT 5000;

-- CreateTable
CREATE TABLE "session_affirmation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "affirmationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "silenceAfterMs" INTEGER NOT NULL DEFAULT 5000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_affirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_affirmation_sessionId_idx" ON "session_affirmation"("sessionId");

-- CreateIndex
CREATE INDEX "session_affirmation_affirmationId_idx" ON "session_affirmation"("affirmationId");

-- CreateIndex
CREATE UNIQUE INDEX "session_affirmation_sessionId_position_key" ON "session_affirmation"("sessionId", "position");

-- AddForeignKey
ALTER TABLE "session_affirmation" ADD CONSTRAINT "session_affirmation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "affirmation_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_affirmation" ADD CONSTRAINT "session_affirmation_affirmationId_fkey" FOREIGN KEY ("affirmationId") REFERENCES "affirmation_line"("id") ON DELETE CASCADE ON UPDATE CASCADE;
