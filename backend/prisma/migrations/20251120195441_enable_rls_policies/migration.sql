-- Enable Row Level Security (RLS) on all public tables
-- This migration enables RLS and creates security policies to protect data exposed via PostgREST
--
-- IMPORTANT NOTES:
-- 1. Prisma uses a direct database connection with service role, which BYPASSES RLS entirely.
--    These policies only affect PostgREST API access.
-- 2. These policies use auth.uid() which requires Supabase Auth. If you're using Better Auth
--    (not Supabase Auth), PostgREST queries will be blocked unless authenticated via Supabase JWT.
-- 3. To allow Better Auth users to access via PostgREST, you'll need to either:
--    a) Set up Supabase Auth alongside Better Auth and sync user IDs
--    b) Modify policies to use a custom JWT claim or service role only
-- 4. For now, these policies provide security by blocking unauthorized PostgREST access.

-- ============================================================
-- 1. Enable RLS on all tables
-- ============================================================

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tts_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."affirmation_line" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."generation_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."affirmation_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."affirmation_audio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."session_affirmation" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Block all access to _prisma_migrations (internal table)
-- ============================================================

CREATE POLICY "block_all_access_prisma_migrations" ON "public"."_prisma_migrations"
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- ============================================================
-- 3. User-specific tables - users can only access their own data
-- ============================================================

-- User table: users can only view/update their own profile
CREATE POLICY "users_select_own" ON "public"."user"
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "users_update_own" ON "public"."user"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Session table: users can only access their own sessions
CREATE POLICY "sessions_select_own" ON "public"."session"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "sessions_insert_own" ON "public"."session"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "sessions_update_own" ON "public"."session"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "sessions_delete_own" ON "public"."session"
FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- Account table: users can only access their own accounts
CREATE POLICY "accounts_select_own" ON "public"."account"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "accounts_insert_own" ON "public"."account"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "accounts_update_own" ON "public"."account"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "accounts_delete_own" ON "public"."account"
FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- Profile table: users can only access their own profile
CREATE POLICY "profiles_select_own" ON "public"."Profile"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "profiles_insert_own" ON "public"."Profile"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "profiles_update_own" ON "public"."Profile"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- UserPreferences table: users can only access their own preferences
CREATE POLICY "user_preferences_select_own" ON "public"."user_preferences"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "user_preferences_insert_own" ON "public"."user_preferences"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "user_preferences_update_own" ON "public"."user_preferences"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- UserSubscription table: users can only access their own subscription
CREATE POLICY "user_subscriptions_select_own" ON "public"."user_subscription"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "user_subscriptions_insert_own" ON "public"."user_subscription"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "user_subscriptions_update_own" ON "public"."user_subscription"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

-- AffirmationSession table: users can only access their own sessions
CREATE POLICY "affirmation_sessions_select_own" ON "public"."affirmation_session"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "affirmation_sessions_insert_own" ON "public"."affirmation_session"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "affirmation_sessions_update_own" ON "public"."affirmation_session"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "affirmation_sessions_delete_own" ON "public"."affirmation_session"
FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- SessionAffirmation table: users can only access affirmations in their own sessions
CREATE POLICY "session_affirmations_select_own" ON "public"."session_affirmation"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."affirmation_session"
    WHERE "affirmation_session"."id" = "session_affirmation"."sessionId"
    AND "affirmation_session"."userId" = auth.uid()::text
  )
);

CREATE POLICY "session_affirmations_insert_own" ON "public"."session_affirmation"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."affirmation_session"
    WHERE "affirmation_session"."id" = "session_affirmation"."sessionId"
    AND "affirmation_session"."userId" = auth.uid()::text
  )
);

CREATE POLICY "session_affirmations_update_own" ON "public"."session_affirmation"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."affirmation_session"
    WHERE "affirmation_session"."id" = "session_affirmation"."sessionId"
    AND "affirmation_session"."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."affirmation_session"
    WHERE "affirmation_session"."id" = "session_affirmation"."sessionId"
    AND "affirmation_session"."userId" = auth.uid()::text
  )
);

CREATE POLICY "session_affirmations_delete_own" ON "public"."session_affirmation"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."affirmation_session"
    WHERE "affirmation_session"."id" = "session_affirmation"."sessionId"
    AND "affirmation_session"."userId" = auth.uid()::text
  )
);

-- GenerationLog table: users can only access their own logs
CREATE POLICY "generation_logs_select_own" ON "public"."generation_log"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId" OR "userId" IS NULL);

CREATE POLICY "generation_logs_insert_own" ON "public"."generation_log"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NULL);

-- ============================================================
-- 4. Public read tables - allow authenticated read, restrict write
-- ============================================================

-- AffirmationLine: public read access, authenticated write
CREATE POLICY "affirmation_lines_select_public" ON "public"."affirmation_line"
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "affirmation_lines_insert_authenticated" ON "public"."affirmation_line"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "affirmation_lines_update_authenticated" ON "public"."affirmation_line"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- SessionTemplate: public read access, authenticated write
CREATE POLICY "session_templates_select_public" ON "public"."session_template"
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "session_templates_insert_authenticated" ON "public"."session_template"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "session_templates_update_authenticated" ON "public"."session_template"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- AffirmationAudio: public read access, authenticated write
CREATE POLICY "affirmation_audio_select_public" ON "public"."affirmation_audio"
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "affirmation_audio_insert_authenticated" ON "public"."affirmation_audio"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "affirmation_audio_update_authenticated" ON "public"."affirmation_audio"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- TtsCache: authenticated read/write only (internal cache)
CREATE POLICY "tts_cache_select_authenticated" ON "public"."tts_cache"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "tts_cache_insert_authenticated" ON "public"."tts_cache"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "tts_cache_update_authenticated" ON "public"."tts_cache"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verification: authenticated access only (auth-related)
CREATE POLICY "verification_select_authenticated" ON "public"."verification"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "verification_insert_authenticated" ON "public"."verification"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "verification_update_authenticated" ON "public"."verification"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "verification_delete_authenticated" ON "public"."verification"
FOR DELETE
TO authenticated
USING (true);

