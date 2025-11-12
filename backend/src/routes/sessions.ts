import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  generateSessionRequestSchema,
  type GenerateSessionResponse,
  type GetSessionsResponse,
  toggleFavoriteRequestSchema,
  createCustomSessionRequestSchema,
  type CreateCustomSessionResponse,
  updateSessionRequestSchema,
  type UpdateSessionResponse,
} from "@/shared/contracts";
import { type AppType } from "../types";
import { db } from "../db";
import OpenAI from "openai";
import { getOrCreateSubscription, SUBSCRIPTION_LIMITS } from "./subscription";

const sessionsRouter = new Hono<AppType>();

// Initialize OpenAI client (if API key is available)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Affirmation prompts for each goal type
const AFFIRMATION_PROMPTS = {
  sleep: `Write 6 short, declarative affirmations in FIRST PERSON about sleep and rest.
- Exactly 6 lines, each ≤ 10 words.
- Present tense, no metaphors, no therapy or medical claims.
- Tone: sleepy, calming, gentle.
- Start affirmations with "I am" or "I" or "My".
Output: plaintext lines, no numbering, one line per affirmation.`,

  focus: `Write 6 short, declarative affirmations in FIRST PERSON about focus and productivity.
- Exactly 6 lines, each ≤ 10 words.
- Present tense, no metaphors, no therapy or medical claims.
- Tone: energizing, confident, motivating.
- Start affirmations with "I am" or "I" or "My".
Output: plaintext lines, no numbering, one line per affirmation.`,

  calm: `Write 6 short, declarative affirmations in FIRST PERSON about peace and calm.
- Exactly 6 lines, each ≤ 10 words.
- Present tense, no metaphors, no therapy or medical claims.
- Tone: gentle, reassuring, peaceful.
- Start affirmations with "I am" or "I" or "My".
Output: plaintext lines, no numbering, one line per affirmation.`,

  manifest: `Write 6 short, declarative affirmations in FIRST PERSON about manifestation, abundance, and achieving goals.
- Exactly 6 lines, each ≤ 10 words.
- Present tense, no metaphors, no therapy or medical claims.
- Tone: powerful, confident, abundant, empowering.
- Start affirmations with "I am" or "I" or "My".
Output: plaintext lines, no numbering, one line per affirmation.`,
};

// Fallback affirmations when OpenAI is unavailable
const FALLBACK_AFFIRMATIONS = {
  sleep: [
    "I am safe and ready to rest",
    "My body knows how to relax deeply",
    "I deserve peaceful and restorative sleep",
    "My mind is calm and quiet",
    "I release all tension from my day",
    "I trust my body to restore itself",
  ],
  focus: [
    "I am focused and in control",
    "My mind is clear and sharp",
    "I accomplish tasks with ease and confidence",
    "I am capable of great things",
    "My energy flows toward my goals",
    "I work with purpose and clarity",
  ],
  calm: [
    "I am at peace with this moment",
    "My breath brings me back to center",
    "I am safe and supported right now",
    "I release what I cannot control",
    "My heart is open and at ease",
    "I trust the journey I am on",
  ],
  manifest: [
    "I am a powerful creator of my reality",
    "My dreams are becoming my reality now",
    "I attract abundance with ease and joy",
    "My goals are aligning perfectly for me",
    "I am worthy of all I desire",
    "My success is inevitable and natural",
  ],
};

// Default sessions for all users (especially guests)
const DEFAULT_SESSIONS = [
  {
    id: "default-sleep-1",
    title: "Evening Wind Down",
    goal: "sleep",
    affirmations: [
      "I am ready to release the day",
      "My body knows how to rest deeply",
      "I deserve this peaceful moment",
      "My mind is settling into stillness",
      "I am safe and supported here",
      "I trust my body to restore itself",
    ],
    voiceId: "neutral",
    pace: "slow",
    noise: "rain",
    lengthSec: 600,
    isFavorite: false,
    createdAt: new Date("2024-11-01T22:00:00Z").toISOString(),
  },
  {
    id: "default-focus-1",
    title: "Morning Momentum",
    goal: "focus",
    affirmations: [
      "I am capable of great focus",
      "My mind is clear and ready",
      "I accomplish what matters today",
      "My energy serves my purpose",
      "I work with confidence and ease",
      "I am exactly where I need to be",
    ],
    voiceId: "confident",
    pace: "normal",
    noise: "brown",
    lengthSec: 300,
    isFavorite: false,
    createdAt: new Date("2024-11-02T08:00:00Z").toISOString(),
  },
  {
    id: "default-calm-1",
    title: "Midday Reset",
    goal: "calm",
    affirmations: [
      "I am at peace in this moment",
      "My breath brings me back to calm",
      "I release what I cannot control",
      "My heart is open and at ease",
      "I trust the flow of my life",
      "I am held by something greater",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "rain",
    lengthSec: 420,
    isFavorite: false,
    createdAt: new Date("2024-11-03T14:00:00Z").toISOString(),
  },
  {
    id: "default-sleep-2",
    title: "Deep Rest",
    goal: "sleep",
    affirmations: [
      "I am safe and ready to rest",
      "My body melts into relaxation",
      "I let go of all that no longer serves",
      "My mind drifts into peaceful dreams",
      "I deserve this healing sleep",
      "I wake refreshed and renewed",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "rain",
    lengthSec: 900,
    isFavorite: false,
    createdAt: new Date("2024-11-04T23:00:00Z").toISOString(),
  },
  {
    id: "default-focus-2",
    title: "Power Hour",
    goal: "focus",
    affirmations: [
      "I am focused and in control",
      "My mind cuts through distractions easily",
      "I bring my best to this work",
      "My actions create meaningful results",
      "I am present with each task",
      "I finish what I start",
    ],
    voiceId: "confident",
    pace: "fast",
    noise: "none",
    lengthSec: 180,
    isFavorite: false,
    createdAt: new Date("2024-11-05T10:00:00Z").toISOString(),
  },
  {
    id: "default-calm-2",
    title: "Gentle Presence",
    goal: "calm",
    affirmations: [
      "I am enough exactly as I am",
      "My presence is a gift to the world",
      "I move through life with grace",
      "My peace comes from within",
      "I am connected to all that is",
      "I rest in the beauty of now",
    ],
    voiceId: "neutral",
    pace: "slow",
    noise: "brown",
    lengthSec: 480,
    isFavorite: false,
    createdAt: new Date("2024-11-06T16:00:00Z").toISOString(),
  },
  {
    id: "default-manifest-1",
    title: "Abundance Flow",
    goal: "manifest",
    affirmations: [
      "I am a magnet for abundance",
      "My dreams are manifesting right now",
      "I attract success with ease and joy",
      "My desires flow to me effortlessly",
      "I am worthy of unlimited prosperity",
      "My reality reflects my highest vision",
    ],
    voiceId: "confident",
    pace: "normal",
    noise: "none",
    lengthSec: 360,
    isFavorite: false,
    createdAt: new Date("2024-11-07T09:00:00Z").toISOString(),
  },
  {
    id: "default-manifest-2",
    title: "Dream Builder",
    goal: "manifest",
    affirmations: [
      "I am creating my ideal life today",
      "My goals align perfectly with my purpose",
      "I attract opportunities that serve me",
      "My success is unfolding naturally",
      "I am powerful beyond measure",
      "My vision becomes reality with each breath",
    ],
    voiceId: "confident",
    pace: "normal",
    noise: "brown",
    lengthSec: 540,
    isFavorite: false,
    createdAt: new Date("2024-11-08T11:00:00Z").toISOString(),
  },
];

// Generate affirmations using OpenAI or fallback
async function generateAffirmations(
  goal: "sleep" | "focus" | "calm" | "manifest",
  customPrompt?: string
): Promise<string[]> {
  // Use OpenAI if available
  if (openai) {
    try {
      console.log(`🤖 [Sessions] Generating affirmations for goal: ${goal} using OpenAI`);

      // If custom prompt is provided, customize the generation
      const basePrompt = customPrompt
        ? `The user wants to work on: "${customPrompt}". Create 6-10 affirmations aligned with this goal in the context of ${goal}.
- Between 6-10 lines, each ≤ 10 words.
- Present tense, FIRST PERSON, no metaphors, no therapy or medical claims.
- Start affirmations with "I am" or "I" or "My".
- Make them specific to the user's intention.
Output: plaintext lines, no numbering, one line per affirmation.`
        : AFFIRMATION_PROMPTS[goal];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: basePrompt }],
        temperature: 0.8,
        max_tokens: 200,
      });

      const content = completion.choices[0]?.message?.content || "";
      const affirmations = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.match(/^\d+[\.)]/)) // Remove numbering
        .slice(0, 10); // Allow up to 10 affirmations

      if (affirmations.length >= 6) {
        console.log(`✅ [Sessions] Generated ${affirmations.length} affirmations via OpenAI`);
        return affirmations;
      }
    } catch (error) {
      console.error("❌ [Sessions] OpenAI generation failed:", error);
    }
  }

  // Fallback to predefined affirmations
  console.log(`📝 [Sessions] Using fallback affirmations for goal: ${goal}`);
  return FALLBACK_AFFIRMATIONS[goal];
}

// ============================================
// POST /api/sessions/generate - Generate new session
// ============================================
sessionsRouter.post("/generate", rateLimiters.openai, zValidator("json", generateSessionRequestSchema), async (c) => {
  const user = c.get("user");

  const { goal, customPrompt } = c.req.valid("json");
  console.log(`🎵 [Sessions] Generating session for ${user ? `user: ${user.id}` : 'guest'}, goal: ${goal}${customPrompt ? ', with custom prompt' : ''}`);

  // Use default preferences if user is not authenticated
  let voice = "neutral";
  let pace = "normal";
  let noise = "rain";

  // If user is authenticated, get their preferences
  if (user) {
    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });
    if (preferences) {
      voice = preferences.voice;
      pace = preferences.pace;
      noise = preferences.noise;
    }
  }

  // Generate affirmations with optional custom prompt
  const affirmations = await generateAffirmations(goal, customPrompt);

  // Calculate session length based on pace
  const baseLengthSec = 180; // 3 minutes base
  const lengthMultiplier = pace === "slow" ? 1.3 : pace === "fast" ? 0.8 : 1.0;
  const lengthSec = Math.round(baseLengthSec * lengthMultiplier);

  // Create title
  const goalTitles = {
    sleep: "Sleep Session",
    focus: "Focus Session",
    calm: "Calm Session",
    manifest: "Manifest Session",
  };
  const title = `${goalTitles[goal]} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  // Generate a temporary session ID for guest users
  const sessionId = user
    ? (
        await db.affirmationSession.create({
          data: {
            userId: user.id,
            goal,
            title,
            affirmations: JSON.stringify(affirmations),
            voiceId: voice,
            pace,
            noise,
            lengthSec,
            isFavorite: false,
          },
        })
      ).id
    : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`✅ [Sessions] Session ${user ? 'created' : 'generated'}: ${sessionId}`);

  return c.json({
    sessionId,
    title,
    affirmations,
    goal,
    voiceId: voice,
    pace,
    noise,
    lengthSec,
  } satisfies GenerateSessionResponse);
});

// ============================================
// POST /api/sessions/create - Create custom session
// ============================================
sessionsRouter.post("/create", zValidator("json", createCustomSessionRequestSchema), async (c) => {
  const user = c.get("user");

  const { title, binauralCategory, binauralHz, affirmations, goal: providedGoal } = c.req.valid("json");

  console.log(`🎵 [Sessions] Creating custom session for ${user ? `user: ${user.id}` : 'guest'}`);
  console.log(`📝 [Sessions] Title: ${title}, Category: ${binauralCategory}, Affirmations: ${affirmations.length}`);

  // Check subscription limits for authenticated users (atomic check + increment)
  let userSubscription = user ? await getOrCreateSubscription(user.id) : null;
  if (user && userSubscription) {
    const limit = userSubscription.tier === "pro"
      ? SUBSCRIPTION_LIMITS.pro.customSessionsPerMonth
      : SUBSCRIPTION_LIMITS.free.customSessionsPerMonth;

    // For Pro users, no limit check needed
    if (userSubscription.tier !== "pro") {
      // Atomically check limit and increment counter using updateMany with WHERE clause
      // This prevents race conditions - only one request can succeed if at limit
      const updateResult = await db.userSubscription.updateMany({
        where: {
          userId: user.id,
          customSessionsUsedThisMonth: { lt: limit }, // Only update if under limit
        },
        data: {
          customSessionsUsedThisMonth: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        console.log(`⛔ [Sessions] User ${user.id} has reached custom session limit`);
        return c.json(
          {
            message: `You've reached your limit of ${limit} custom session${limit > 1 ? 's' : ''} per month. Upgrade to Pro for unlimited custom sessions.`
          },
          403
        );
      }

      // Refresh subscription to get updated counter
      userSubscription = await db.userSubscription.findUnique({
        where: { userId: user.id },
      });
    }
  }

  // Infer goal from binaural category if not provided
  const categoryToGoalMap: Record<string, "sleep" | "focus" | "calm" | "manifest"> = {
    delta: "sleep",
    theta: "calm",
    alpha: "calm",
    beta: "focus",
    gamma: "manifest",
  };
  const goal = providedGoal || categoryToGoalMap[binauralCategory];

  // Use default preferences if user is not authenticated
  let voice = "neutral";
  let pace = "normal";
  let noise = "rain";

  // If user is authenticated, get their preferences
  if (user) {
    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });
    if (preferences) {
      voice = preferences.voice;
      pace = preferences.pace;
      noise = preferences.noise;
    }
  }

  // Calculate session length based on pace and number of affirmations
  const baseLengthPerAffirmation = 30; // 30 seconds per affirmation
  const lengthMultiplier = pace === "slow" ? 1.3 : pace === "fast" ? 0.8 : 1.0;
  const lengthSec = Math.round(affirmations.length * baseLengthPerAffirmation * lengthMultiplier);

  // Generate a temporary session ID for guest users, or save to DB for authenticated users
  let sessionId: string;
  
  if (user) {
    try {
      // Create session in database
      const session = await db.affirmationSession.create({
        data: {
          userId: user.id,
          goal,
          title,
          affirmations: JSON.stringify(affirmations),
          voiceId: voice,
          pace,
          noise,
          lengthSec,
          isFavorite: false,
          binauralCategory,
          binauralHz,
        },
      });
      sessionId = session.id;
      
      // Usage was already tracked atomically above (for free tier)
      // For Pro users, no tracking needed
      if (userSubscription && userSubscription.tier === "pro") {
        console.log(`📊 [Sessions] Pro user - unlimited sessions`);
      } else if (userSubscription) {
        console.log(`📊 [Sessions] Usage tracked: ${userSubscription.customSessionsUsedThisMonth} custom sessions this month`);
      }
    } catch (error) {
      // If session creation fails, rollback the counter increment for free tier
      if (userSubscription && userSubscription.tier !== "pro") {
        await db.userSubscription.update({
          where: { userId: user.id },
          data: {
            customSessionsUsedThisMonth: { decrement: 1 },
          },
        });
        console.log(`⚠️ [Sessions] Rolled back counter due to session creation failure`);
      }
      throw error;
    }
  } else {
    sessionId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  console.log(`✅ [Sessions] Custom session ${user ? 'created' : 'generated'}: ${sessionId}`);

  return c.json({
    sessionId,
    title,
    affirmations,
    goal,
    voiceId: voice,
    pace,
    noise,
    lengthSec,
    binauralCategory: binauralCategory as string,
    binauralHz: binauralHz as string,
  } satisfies CreateCustomSessionResponse);
});

// ============================================
// GET /api/sessions - Get all user sessions
// ============================================
sessionsRouter.get("/", async (c) => {
  const user = c.get("user");

  // For guest users, return default sessions
  if (!user) {
    console.log(`📚 [Sessions] Returning default sessions for guest user`);
    return c.json({
      sessions: DEFAULT_SESSIONS,
    } satisfies GetSessionsResponse);
  }

  console.log(`📚 [Sessions] Fetching sessions for user: ${user.id}`);

  const userSessions = await db.affirmationSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Combine user sessions with default sessions
  const allSessions = [
    ...userSessions.map((session) => ({
      id: session.id,
      title: session.title,
      goal: session.goal,
      affirmations: JSON.parse(session.affirmations) as string[],
      voiceId: session.voiceId,
      pace: session.pace,
      noise: session.noise,
      lengthSec: session.lengthSec,
      isFavorite: session.isFavorite,
      createdAt: session.createdAt.toISOString(),
    })),
    ...DEFAULT_SESSIONS,
  ];

  return c.json({
    sessions: allSessions,
  } satisfies GetSessionsResponse);
});

// ============================================
// PATCH /api/sessions/:id/favorite - Toggle favorite
// ============================================
sessionsRouter.patch("/:id/favorite", zValidator("json", toggleFavoriteRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");
  const { isFavorite } = c.req.valid("json");

  // Prevent modifying default sessions
  if (sessionId.startsWith("default-")) {
    return c.json({ message: "Cannot modify default sessions" }, 403);
  }

  console.log(`⭐ [Sessions] Toggling favorite for session: ${sessionId}, value: ${isFavorite}`);

  // Verify session belongs to user
  const session = await db.affirmationSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return c.json({ message: "Session not found" }, 404);
  }

  // Update favorite status
  await db.affirmationSession.update({
    where: { id: sessionId },
    data: { isFavorite },
  });

  return c.json({ success: true });
});

// ============================================
// DELETE /api/sessions/:id - Delete session
// ============================================
sessionsRouter.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");

  // Prevent deleting default sessions
  if (sessionId.startsWith("default-")) {
    return c.json({ message: "Cannot delete default sessions" }, 403);
  }

  console.log(`🗑️ [Sessions] Deleting session: ${sessionId}`);

  // Verify session belongs to user before deleting
  const session = await db.affirmationSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return c.json({ message: "Session not found" }, 404);
  }

  await db.affirmationSession.delete({
    where: { id: sessionId },
  });

  return c.json({ success: true });
});

// ============================================
// PATCH /api/sessions/:id - Update session
// ============================================
sessionsRouter.patch("/:id", zValidator("json", updateSessionRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const sessionId = c.req.param("id");
  const updates = c.req.valid("json");

  // Prevent modifying default sessions
  if (sessionId.startsWith("default-")) {
    return c.json({ message: "Cannot modify default sessions" }, 403);
  }

  console.log(`✏️ [Sessions] Updating session: ${sessionId}`);

  // Verify session belongs to user
  const session = await db.affirmationSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return c.json({ message: "Session not found" }, 404);
  }

  // Build update data
  const updateData: {
    title?: string;
    binauralCategory?: string;
    binauralHz?: string;
    affirmations?: string;
  } = {};
  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  if (updates.binauralCategory !== undefined) {
    updateData.binauralCategory = updates.binauralCategory;
  }
  if (updates.binauralHz !== undefined) {
    updateData.binauralHz = updates.binauralHz;
  }
  if (updates.affirmations !== undefined) {
    updateData.affirmations = JSON.stringify(updates.affirmations);
  }

  // Update session in database
  await db.affirmationSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  console.log(`✅ [Sessions] Session updated successfully: ${sessionId}`);

  return c.json({ success: true } satisfies UpdateSessionResponse);
});

export { sessionsRouter };
