-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'neutral',
    "pace" TEXT NOT NULL DEFAULT 'normal',
    "noise" TEXT NOT NULL DEFAULT 'rain',
    "pronounStyle" TEXT NOT NULL DEFAULT 'you',
    "intensity" TEXT NOT NULL DEFAULT 'gentle',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "affirmation_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affirmation_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
