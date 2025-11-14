-- CreateTable
CREATE TABLE "tts_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "affirmationsCount" INTEGER NOT NULL,
    "voiceType" TEXT NOT NULL,
    "pace" TEXT NOT NULL,
    "affirmationSpacing" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "tts_cache_cacheKey_key" ON "tts_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "tts_cache_lastAccessedAt_idx" ON "tts_cache"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "tts_cache_cacheKey_idx" ON "tts_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "affirmation_session_userId_createdAt_idx" ON "affirmation_session"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "affirmation_session_userId_isFavorite_idx" ON "affirmation_session"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "affirmation_session_goal_idx" ON "affirmation_session"("goal");

-- CreateIndex
CREATE INDEX "user_subscription_lastResetDate_tier_idx" ON "user_subscription"("lastResetDate", "tier");

-- CreateIndex
CREATE INDEX "user_subscription_tier_status_idx" ON "user_subscription"("tier", "status");
