-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "handle" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'neutral',
    "pace" TEXT NOT NULL DEFAULT 'normal',
    "noise" TEXT NOT NULL DEFAULT 'rain',
    "pronounStyle" TEXT NOT NULL DEFAULT 'you',
    "intensity" TEXT NOT NULL DEFAULT 'gentle',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affirmation_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "affirmations" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "pace" TEXT NOT NULL,
    "noise" TEXT NOT NULL,
    "lengthSec" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "binauralCategory" TEXT,
    "binauralHz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affirmation_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingPeriod" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "customSessionsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tts_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "affirmationsCount" INTEGER NOT NULL,
    "voiceType" TEXT NOT NULL,
    "pace" TEXT NOT NULL,
    "affirmationSpacing" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tts_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affirmation_line" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "tags" TEXT[],
    "emotion" TEXT,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "userRating" DOUBLE PRECISION,
    "ttsAudioUrl" TEXT,
    "ttsVoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affirmation_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_template" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "intentKeywords" TEXT[],
    "affirmationIds" TEXT[],
    "binauralCategory" TEXT,
    "binauralHz" TEXT,
    "lengthSec" INTEGER NOT NULL,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "userRating" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userIntent" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "affirmationsUsed" TEXT[],
    "sessionId" TEXT,
    "templateId" TEXT,
    "wasRated" BOOLEAN NOT NULL DEFAULT false,
    "userRating" INTEGER,
    "wasReplayed" BOOLEAN NOT NULL DEFAULT false,
    "apiCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_handle_key" ON "Profile"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "affirmation_session_userId_createdAt_idx" ON "affirmation_session"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "affirmation_session_userId_isFavorite_idx" ON "affirmation_session"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "affirmation_session_goal_idx" ON "affirmation_session"("goal");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscription_userId_key" ON "user_subscription"("userId");

-- CreateIndex
CREATE INDEX "user_subscription_lastResetDate_tier_idx" ON "user_subscription"("lastResetDate", "tier");

-- CreateIndex
CREATE INDEX "user_subscription_tier_status_idx" ON "user_subscription"("tier", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tts_cache_cacheKey_key" ON "tts_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "tts_cache_lastAccessedAt_idx" ON "tts_cache"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "tts_cache_cacheKey_idx" ON "tts_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "affirmation_line_goal_useCount_idx" ON "affirmation_line"("goal", "useCount");

-- CreateIndex
CREATE INDEX "affirmation_line_goal_idx" ON "affirmation_line"("goal");

-- CreateIndex
CREATE INDEX "session_template_goal_useCount_idx" ON "session_template"("goal", "useCount");

-- CreateIndex
CREATE INDEX "session_template_goal_isDefault_idx" ON "session_template"("goal", "isDefault");

-- CreateIndex
CREATE INDEX "session_template_intentKeywords_idx" ON "session_template"("intentKeywords");

-- CreateIndex
CREATE INDEX "generation_log_userId_createdAt_idx" ON "generation_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "generation_log_goal_matchType_idx" ON "generation_log"("goal", "matchType");

-- CreateIndex
CREATE INDEX "generation_log_matchType_createdAt_idx" ON "generation_log"("matchType", "createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affirmation_session" ADD CONSTRAINT "affirmation_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscription" ADD CONSTRAINT "user_subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
