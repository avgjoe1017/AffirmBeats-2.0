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
import { rateLimiters } from "../middleware/rateLimit";
import { getOrCreateSubscription, SUBSCRIPTION_LIMITS } from "./subscription";
import { logger, loggers } from "../lib/logger";
import { metricHelpers } from "../lib/metrics";
import { getCached, deleteCache, deleteCachePattern } from "../lib/redis";
import { env } from "../env";

const sessionsRouter = new Hono<AppType>();

// Initialize OpenAI client (if API key is available)
const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

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
      "I let my body soften and release the day.",
      "My breath slows, and my whole system settles into safety.",
      "I trust my body to move into deep, nourishing rest.",
      "I release tension, effort, and pressure with every exhale.",
      "I am safe to let go and drift into sleep.",
      "My mind quiets, my body heals, and I sink into deep recovery.",
    ],
    voiceId: "neutral",
    pace: "slow",
    noise: "rain",
    lengthSec: 600,
    isFavorite: false,
    createdAt: new Date("2024-11-01T22:00:00Z").toISOString(),
    binauralCategory: "delta",
    binauralHz: "0.5-4",
  },
  {
    id: "default-focus-1",
    title: "Morning Momentum",
    goal: "focus",
    affirmations: [
      "I start my day grounded, clear, and ready.",
      "My mind wakes up with purpose and steady energy.",
      "I move into focus with calm confidence.",
      "I take meaningful action toward what matters most.",
      "I trust my ability to create momentum today.",
      "I choose clarity, discipline, and aligned effort.",
    ],
    voiceId: "confident",
    pace: "normal",
    noise: "brown",
    lengthSec: 300,
    isFavorite: false,
    createdAt: new Date("2024-11-02T08:00:00Z").toISOString(),
    binauralCategory: "alpha",
    binauralHz: "8-15",
  },
  {
    id: "default-calm-1",
    title: "Midday Reset",
    goal: "calm",
    affirmations: [
      "I pause and come back to myself.",
      "My breath resets my nervous system with every slow exhale.",
      "I release what's pulling me out of balance.",
      "I return to the moment with grounded awareness.",
      "I feel calmer, softer, and more centered now.",
      "I move forward with a clearer mind and a relaxed body.",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "rain",
    lengthSec: 420,
    isFavorite: false,
    createdAt: new Date("2024-11-03T14:00:00Z").toISOString(),
    binauralCategory: "alpha",
    binauralHz: "8-12",
  },
  {
    id: "default-sleep-2",
    title: "Deep Rest",
    goal: "sleep",
    affirmations: [
      "I let my whole body drop into stillness.",
      "My muscles unwind, and my mind slows down.",
      "I enter deep, uninterrupted rest easily.",
      "My body knows how to repair, restore, and rejuvenate.",
      "I am drifting into peaceful, healing sleep.",
      "I wake up renewed, restored, and replenished.",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "rain",
    lengthSec: 900,
    isFavorite: false,
    createdAt: new Date("2024-11-04T23:00:00Z").toISOString(),
    binauralCategory: "delta",
    binauralHz: "0.5-4",
  },
  {
    id: "default-focus-2",
    title: "Power Hour",
    goal: "focus",
    affirmations: [
      "I lock into laser-sharp focus with ease.",
      "My mind is clear, organized, and fully present.",
      "I move through this hour with intention and discipline.",
      "I stay on task and in control of my attention.",
      "My effort compounds — every minute counts.",
      "I finish this session proud of my clarity and output.",
    ],
    voiceId: "confident",
    pace: "normal",
    noise: "none",
    lengthSec: 180,
    isFavorite: false,
    createdAt: new Date("2024-11-05T10:00:00Z").toISOString(),
    binauralCategory: "beta",
    binauralHz: "14-20",
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
    binauralCategory: "alpha",
    binauralHz: "8-14",
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
    binauralCategory: "theta",
    binauralHz: "4-8",
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
    binauralCategory: "theta",
    binauralHz: "4-8",
  },
  {
    id: "default-identity-1",
    title: "Identity Priming: Step Into the Version of You Who Already Has It",
    goal: "manifest",
    affirmations: [
      "Take a slow breath in. Let your shoulders soften. Feel your body settle into a state of ease.",
      "As you breathe, notice how your mind becomes more spacious. This relaxed state matters.",
      "When the nervous system settles, the brain becomes more open to new patterns, new possibilities, new identities.",
      "Now bring to mind the version of you who already has what you're moving toward. Don't force an image. Just sense them.",
      "Notice how they carry themselves. How they speak. How they move through a room. How they make decisions without hesitation.",
      "This version of you exists in your brain's predictive maps — the internal models it uses to guide your behavior.",
      "Right now, you're letting that map become clearer. Ask yourself softly: What is one quality this version of me embodies with ease?",
      "Maybe it's confidence. Maybe calm clarity. Maybe self-belief. Let that quality fill your body, the same way warmth fills you when you step into the sun.",
      "Your brain learns through repetition and experience. Each time you feel this quality on purpose, the neural pathways behind it strengthen.",
      "Now bring your attention to one small action this version of you takes by default. Something simple. Something doable.",
      "See yourself doing it not in the future, but as if it's already your norm. Take one more slow breath.",
      "Let the identity settle into your body. You're not becoming someone new. You're remembering who you're capable of being. This is already inside you.",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "rain",
    lengthSec: 600,
    isFavorite: false,
    createdAt: new Date("2024-11-09T10:00:00Z").toISOString(),
    binauralCategory: "theta",
    binauralHz: "4-7",
  },
  {
    id: "default-manifest-3",
    title: "Future Memory: Encode Success as a Lived Experience",
    goal: "manifest",
    affirmations: [
      "Get comfortable. Let your eyes rest or close. Feel the breath move easily in and out.",
      "Your brain stores experiences as memories, but it also stores imagined experiences using the same neural machinery.",
      "Today, you're creating a future memory — something your mind can use as a guide.",
      "Bring your attention to a moment in the future where things have worked out the way you hope. Let the scene appear gently.",
      "Where are you? What's around you? What does the air feel like on your skin? Take your time. Slow imagery creates stronger neural encoding.",
      "Notice who's with you. Notice your posture. Notice the expression on your face — that calm, grounded sense of I did it.",
      "Feel the emotion of this moment. Not forced. Just the natural feeling that rises when something meaningful aligns.",
      "Your hippocampus tags memories with emotion. This emotional signal tells your brain: This matters. Keep it close.",
      "Let that feeling expand in your chest. Warm. Steady. Real.",
      "Now gently pair this future memory with a present-day anchor — maybe the feeling of your hands resting where they are or the sensation of your breath moving in your body.",
      "This creates a bridge between who you are and who you're becoming. Take a final breath and let the memory settle inside you.",
    ],
    voiceId: "neutral",
    pace: "slow",
    noise: "brown",
    lengthSec: 540,
    isFavorite: false,
    createdAt: new Date("2024-11-10T14:00:00Z").toISOString(),
    binauralCategory: "theta",
    binauralHz: "4-7",
  },
  {
    id: "default-calm-3",
    title: "Nervous System Reset for Receivership",
    goal: "calm",
    affirmations: [
      "Sit in a position that feels easy. Drop your shoulders. Unclench your jaw.",
      "Begin with a slow inhale and a long, gentle exhale. Longer exhales activate the parasympathetic nervous system — the part of you wired for calm, openness, and creativity.",
      "Let your breath fall into a soft rhythm. Relaxed. Steady. Feel your spine lengthen. Feel your body grow heavier.",
      "As your nervous system shifts into safety, your mind becomes more receptive. Ideas flow more freely. Possibilities feel closer. Receiving feels natural, not effortful.",
      "Place one hand over your chest or stomach if that feels supportive. Feel the warmth of your own touch. Your body recognizes this as safety.",
      "Say quietly to yourself, in your mind: I allow what supports me. I let good things come toward me. I am open to what aligns.",
      "No force. Just openness. Let your breath slow one more degree.",
      "Feel the subtle expansion across your ribs as you inhale. Feel the soft release as you exhale.",
      "You are safe. You are steady. You are ready to receive.",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "rain",
    lengthSec: 480,
    isFavorite: false,
    createdAt: new Date("2024-11-11T09:00:00Z").toISOString(),
    binauralCategory: "alpha",
    binauralHz: "8-12",
  },
  {
    id: "default-identity-2",
    title: "Self-Image Recalibration: Rewrite Limiting Beliefs",
    goal: "manifest",
    affirmations: [
      "Find stillness. Let your breath soften.",
      "In this session, you'll gently explore a belief that feels limiting — and soften its hold. Not through forcing positivity, but through updating your internal model with new information.",
      "Bring to mind a belief you carry about yourself. Something that feels tight or old or heavy. Maybe it begins with, I'm not someone who…",
      "Notice the belief without judgment. Your brain learned this at some point, often to protect you. You're not fighting it. You're simply examining it with more clarity.",
      "Ask yourself: Where did this belief come from? Whose voice does it sound like? Let the answer arise naturally.",
      "Awareness is part of the reconsolidation process — the brain's way of updating old patterns.",
      "Now gently introduce evidence that doesn't match the belief. Times you did show up differently. Moments you surprised yourself. Small wins you rarely give yourself credit for.",
      "Your brain can't hold contradictory stories without adjusting something. Right now, it's adjusting for the better.",
      "Now choose a new, more accurate belief one that feels possible. Not overly positive. Just true.",
      "Say it softly in your mind: I'm learning to… I'm becoming someone who… I'm capable of…",
      "Let it settle. Let it feel like a new doorway opening. Breathe once more. You've begun the recalibration.",
    ],
    voiceId: "neutral",
    pace: "slow",
    noise: "brown",
    lengthSec: 600,
    isFavorite: false,
    createdAt: new Date("2024-11-12T15:00:00Z").toISOString(),
    binauralCategory: "theta",
    binauralHz: "4-7",
  },
  {
    id: "default-manifest-4",
    title: "Visualization for Goal Concreteness + Action Bias",
    goal: "manifest",
    affirmations: [
      "Get comfortable and settle into your breath.",
      "Your brain is more likely to act on what it can clearly picture. Today you'll make your goal concrete, specific, and deeply familiar.",
      "Bring your attention to a goal you care about. Choose one that feels meaningful.",
      "Now imagine the exact moment you take action toward it. Not the achievement — the action.",
      "Where are you? What time of day is it? What are you wearing? What's in your hands? Let the scene sharpen just a little.",
      "Concrete details activate networks responsible for planning and decision making.",
      "Imagine yourself following through with ease. Your body moves almost automatically. Your mind feels clear.",
      "Now add a simple implementation intention — a when X, I do Y plan.",
      "For example: When I sit at my desk, I open the project. When I finish my coffee, I write for 10 minutes. When I feel resistance, I take one tiny step anyway.",
      "Repeat your version quietly in your mind. Your brain is wiring this in as a natural response.",
      "Take one final breath in and release.",
    ],
    voiceId: "confident",
    pace: "normal",
    noise: "none",
    lengthSec: 420,
    isFavorite: false,
    createdAt: new Date("2024-11-13T11:00:00Z").toISOString(),
    binauralCategory: "theta",
    binauralHz: "4-7",
  },
  {
    id: "default-calm-4",
    title: "Gratitude Shift for Dopamine + Motivation Regulation",
    goal: "calm",
    affirmations: [
      "Close your eyes gently. Let your breath relax.",
      "Gratitude shifts your brain into an expanded, resourceful state. It's not about ignoring hardship — it's about widening your perspective so you can see more possibility.",
      "Bring to mind one interaction from the past day that felt positive. Something small is enough.",
      "Let the moment play softly in your mind. What happened? Who was there? How did it make you feel?",
      "Now choose one internal trait you're grateful for — something about who you are. Maybe resilience. Maybe your way of caring. Maybe your curiosity.",
      "Let that trait feel real in your body. Gratitude isn't just a thought — it creates measurable shifts in dopamine and emotional regulation.",
      "Take a breath and notice: What did this make possible for me? Let the feeling expand gently.",
      "Close with this quiet thought: I'm grateful for what's unfolding. Let that sense of steadiness rest in your chest.",
    ],
    voiceId: "neutral",
    pace: "slow",
    noise: "rain",
    lengthSec: 360,
    isFavorite: false,
    createdAt: new Date("2024-11-14T16:00:00Z").toISOString(),
    binauralCategory: "alpha",
    binauralHz: "8-12",
  },
  {
    id: "default-identity-3",
    title: "Subconscious Priming Through Auditory Repetition",
    goal: "manifest",
    affirmations: [
      "Sit comfortably. Let your breath slow to a natural rhythm.",
      "Repetition is one of the most efficient ways the brain learns new information.",
      "When you hear something calmly and consistently, your subconscious begins to accept it as familiar — and familiarity feels safe.",
      "Allow your body to settle. Long exhales. Soft shoulders.",
      "You'll now hear a set of identity-based statements. Let them drift in. No need to force belief — your brain will soften toward them over time.",
      "I am becoming more grounded. I act on what matters to me. I am capable of change.",
      "My future is shaped by the choices I make now. I am worthy of good things.",
      "I move with clarity and confidence. I trust the path I'm building.",
      "Let each phrase land gently. Your mind absorbs far more than it analyzes.",
      "Take one last slow breath. Feel the statements settle into the space beneath your awareness.",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "brown",
    lengthSec: 480,
    isFavorite: false,
    createdAt: new Date("2024-11-15T10:00:00Z").toISOString(),
    binauralCategory: "theta",
    binauralHz: "4-7",
  },
  {
    id: "default-focus-3",
    title: "The Tiny Shift Session: Build Momentum Through Micro-Wins",
    goal: "focus",
    affirmations: [
      "Relax your breath. Let your body soften.",
      "Big goals can feel overwhelming. Your brain responds best to tiny, achievable steps — micro-wins that build confidence and forward motion.",
      "Bring to mind one goal you've been wanting to move toward.",
      "Now ask yourself: What is the smallest possible action I could take today?",
      "Something that takes less than 60 seconds. Something you can't fail.",
      "Picture yourself doing that tiny action with ease. See it. Feel it. Let your brain memorize the sensation of completion.",
      "Now imagine the small hit of relief or satisfaction that follows. That emotional reward is what starts the dopamine loop of continued action.",
      "Say quietly to yourself: Tiny steps become my identity. They add up. They move me forward.",
      "Take a breath and let this micro-shift settle into your nervous system.",
    ],
    voiceId: "confident",
    pace: "normal",
    noise: "none",
    lengthSec: 300,
    isFavorite: false,
    createdAt: new Date("2024-11-16T13:00:00Z").toISOString(),
    binauralCategory: "beta",
    binauralHz: "12-20",
  },
  {
    id: "default-focus-4",
    title: "State Change for Creativity + Problem Solving",
    goal: "focus",
    affirmations: [
      "Settle comfortably. Let your breath fall into an easy rhythm.",
      "Right now, you're shifting your mind into a more creative state — one where ideas connect more freely and solutions feel closer.",
      "Begin with a gentle breathing pattern: Inhale for 1… Hold for 4… Exhale for 2. Repeat this pattern a few times.",
      "This temporarily disrupts habitual thought loops and opens space for new connections.",
      "Now let your mind drift lightly. Not fully focused. Not fully wandering. Just open.",
      "This taps into the default mode network — the part of the brain involved in insight, imagination, and big-picture thinking.",
      "Allow thoughts, images, or ideas to float through. No pressure to figure anything out.",
      "Notice if a connection emerges… A new way of seeing something… A possibility you hadn't considered.",
      "Let it be gentle. Let it be spacious. Take one more breath. And return slowly to presence.",
    ],
    voiceId: "neutral",
    pace: "slow",
    noise: "brown",
    lengthSec: 420,
    isFavorite: false,
    createdAt: new Date("2024-11-17T11:00:00Z").toISOString(),
    binauralCategory: "beta",
    binauralHz: "12-20",
  },
  {
    id: "default-healing-1",
    title: "Embodied Worthiness: Rebuild Internal Safety",
    goal: "calm",
    affirmations: [
      "Sit comfortably and place one hand on your chest or stomach.",
      "Feel your breath move beneath your hand.",
      "Worthiness is not a belief — it's a felt sense of safety. Today, you're helping your body remember that you are allowed to belong, to receive, and to take up space.",
      "Notice the warmth of your hand. Notice the rise and fall of your breath. Your body reads this as comfort.",
      "Say softly in your mind: I'm allowed to feel supported. I'm allowed to receive.",
      "I am safe in who I am. I deserve good things that come my way.",
      "Feel the statements warm your chest, like a small light expanding outward.",
      "Your nervous system recognizes this warmth. It relaxes into it.",
      "Take a slow breath in and a soft breath out.",
      "You are enough. You are safe. You are worthy. Let that truth settle in your body.",
    ],
    voiceId: "whisper",
    pace: "slow",
    noise: "rain",
    lengthSec: 480,
    isFavorite: false,
    createdAt: new Date("2024-11-18T14:00:00Z").toISOString(),
    binauralCategory: "theta",
    binauralHz: "4-7",
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
      logger.info("Generating affirmations using OpenAI", { goal, hasCustomPrompt: !!customPrompt });

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
        logger.info("Generated affirmations via OpenAI", { goal, count: affirmations.length });
        return affirmations;
      }
    } catch (error) {
      logger.error("OpenAI generation failed", error, { goal });
    }
  }

  // Fallback to predefined affirmations
  logger.info("Using fallback affirmations", { goal });
  return FALLBACK_AFFIRMATIONS[goal];
}

// ============================================
// POST /api/sessions/generate - Generate new session
// ============================================
sessionsRouter.post("/generate", rateLimiters.openai, zValidator("json", generateSessionRequestSchema), async (c) => {
  const user = c.get("user");

  const { goal, customPrompt, binauralCategory, binauralHz } = c.req.valid("json");
  const sessionGenerationStartTime = Date.now();
  logger.info("Generating session", { 
    userId: user?.id || "guest", 
    goal, 
    hasCustomPrompt: !!customPrompt,
    binauralCategory,
  });

  // Use default preferences if user is not authenticated
  let voice = "neutral";
  let pace = "normal";
  let noise = "rain";

  // If user is authenticated, get their preferences (with caching)
  if (user) {
    const preferences = await getCached(
      `preferences:${user.id}`,
      async () => {
        return await db.userPreferences.findUnique({
          where: { userId: user.id },
        });
      },
      3600 // Cache for 1 hour
    );
    
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
  const lengthMultiplier = pace === "slow" ? 1.3 : 1.0;
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
            binauralCategory: binauralCategory || null,
            binauralHz: binauralHz || null,
          },
        })
      ).id
    : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const sessionCreationDuration = Date.now() - sessionGenerationStartTime;
  loggers.sessionCreated(sessionId, user?.id || "guest", goal);
  metricHelpers.sessionCreation(goal, sessionCreationDuration);

  // Invalidate user sessions cache if authenticated
  if (user) {
    await deleteCache(`sessions:${user.id}`);
  }

  return c.json({
    sessionId,
    title,
    affirmations,
    goal,
    voiceId: voice,
    pace,
    noise,
    lengthSec,
    binauralCategory: binauralCategory || undefined,
    binauralHz: binauralHz || undefined,
  } satisfies GenerateSessionResponse);
});

// ============================================
// POST /api/sessions/create - Create custom session
// ============================================
sessionsRouter.post("/create", zValidator("json", createCustomSessionRequestSchema), async (c) => {
  const user = c.get("user");

  const { title, binauralCategory, binauralHz, affirmations, goal: providedGoal } = c.req.valid("json");
  const customSessionCreationStartTime = Date.now();

  logger.info("Creating custom session", { 
    userId: user?.id || "guest", 
    title, 
    binauralCategory, 
    affirmationsCount: affirmations.length 
  });

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
        logger.warn("Custom session limit exceeded", { 
          userId: user.id, 
          limit, 
          used: userSubscription.customSessionsUsedThisMonth 
        });
        return c.json(
          {
            error: "SUBSCRIPTION_LIMIT_EXCEEDED",
            code: "SUBSCRIPTION_LIMIT_EXCEEDED",
            message: `You've reached your limit of ${limit} custom session${limit > 1 ? 's' : ''} per month. Upgrade to Pro for unlimited custom sessions.`,
            details: {
              limit,
              used: userSubscription.customSessionsUsedThisMonth,
              tier: userSubscription.tier,
              upgradeUrl: "/subscription",
            },
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
  const goal: "sleep" | "focus" | "calm" | "manifest" = providedGoal || categoryToGoalMap[binauralCategory] || "calm";

  // Use default preferences if user is not authenticated
  let voice = "neutral";
  let pace = "normal";
  let noise = "rain";

  // If user is authenticated, get their preferences (with caching)
  if (user) {
    const preferences = await getCached(
      `preferences:${user.id}`,
      async () => {
        return await db.userPreferences.findUnique({
          where: { userId: user.id },
        });
      },
      3600 // Cache for 1 hour
    );
    
    if (preferences) {
      voice = preferences.voice;
      pace = preferences.pace;
      noise = preferences.noise;
    }
  }

  // Calculate session length based on pace and number of affirmations
  const baseLengthPerAffirmation = 30; // 30 seconds per affirmation
  const lengthMultiplier = pace === "slow" ? 1.3 : 1.0;
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
        logger.debug("Pro user - unlimited sessions", { userId: user.id });
      } else if (userSubscription) {
        logger.debug("Usage tracked", { 
          userId: user.id, 
          customSessionsUsedThisMonth: userSubscription.customSessionsUsedThisMonth 
        });
      }
      
      // Invalidate cache
      await deleteCache(`sessions:${user.id}`);
    } catch (error) {
      // If session creation fails, rollback the counter increment for free tier
      if (userSubscription && userSubscription.tier !== "pro") {
        await db.userSubscription.update({
          where: { userId: user.id },
          data: {
            customSessionsUsedThisMonth: { decrement: 1 },
          },
        });
        logger.warn("Rolled back counter due to session creation failure", { userId: user.id });
      }
      loggers.sessionError("", user.id, error as Error);
      throw error;
    }
  } else {
    sessionId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const customSessionCreationDuration = Date.now() - customSessionCreationStartTime;
  loggers.sessionCreated(sessionId, user?.id || "guest", goal);
  metricHelpers.sessionCreation(goal, customSessionCreationDuration);

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
    logger.debug("Returning default sessions for guest user");
    return c.json({
      sessions: DEFAULT_SESSIONS,
    } satisfies GetSessionsResponse);
  }

  logger.info("Fetching sessions", { userId: user.id });

  // Get user sessions with caching
  const userSessions = await getCached(
    `sessions:${user.id}`,
    async () => {
      return await db.affirmationSession.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    },
    300 // Cache for 5 minutes
  );

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
      binauralCategory: session.binauralCategory || undefined,
      binauralHz: session.binauralHz || undefined,
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
    return c.json({ 
      error: "UNAUTHORIZED",
      code: "UNAUTHORIZED",
      message: "Please sign in to access your sessions.",
    }, 401);
  }

  const sessionId = c.req.param("id");
  const { isFavorite } = c.req.valid("json");

  // Prevent modifying default sessions
  if (sessionId.startsWith("default-")) {
    return c.json({ 
      error: "FORBIDDEN",
      code: "FORBIDDEN",
      message: "Default sessions cannot be modified.",
    }, 403);
  }

  logger.info("Toggling favorite", { sessionId, userId: user.id, isFavorite });

  // Verify session belongs to user
  const session = await db.affirmationSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return c.json({ 
      error: "NOT_FOUND",
      code: "NOT_FOUND",
      message: "Session not found or you don't have permission to access it.",
    }, 404);
  }

  // Update favorite status
  await db.affirmationSession.update({
    where: { id: sessionId },
    data: { isFavorite },
  });

  // Invalidate cache
  await deleteCache(`sessions:${user.id}`);

  return c.json({ success: true });
});

// ============================================
// DELETE /api/sessions/:id - Delete session
// ============================================
sessionsRouter.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ 
      error: "UNAUTHORIZED",
      code: "UNAUTHORIZED",
      message: "Please sign in to access your sessions.",
    }, 401);
  }

  const sessionId = c.req.param("id");

  // Prevent deleting default sessions
  if (sessionId.startsWith("default-")) {
    return c.json({ message: "Cannot delete default sessions" }, 403);
  }

  logger.info("Deleting session", { sessionId, userId: user.id });

  // Verify session belongs to user before deleting
  const session = await db.affirmationSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return c.json({ 
      error: "NOT_FOUND",
      code: "NOT_FOUND",
      message: "Session not found or you don't have permission to access it.",
    }, 404);
  }

  await db.affirmationSession.delete({
    where: { id: sessionId },
  });

  // Invalidate cache
  await deleteCache(`sessions:${user.id}`);

  logger.info("Session deleted", { sessionId, userId: user.id });

  return c.json({ success: true });
});

// ============================================
// PATCH /api/sessions/:id - Update session
// ============================================
sessionsRouter.patch("/:id", zValidator("json", updateSessionRequestSchema), async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ 
      error: "UNAUTHORIZED",
      code: "UNAUTHORIZED",
      message: "Please sign in to access your sessions.",
    }, 401);
  }

  const sessionId = c.req.param("id");
  const updates = c.req.valid("json");

  // Prevent modifying default sessions
  if (sessionId.startsWith("default-")) {
    return c.json({ 
      error: "FORBIDDEN",
      code: "FORBIDDEN",
      message: "Default sessions cannot be modified.",
    }, 403);
  }

  logger.info("Updating session", { sessionId, userId: user.id, updates });

  // Verify session belongs to user
  const session = await db.affirmationSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return c.json({ 
      error: "NOT_FOUND",
      code: "NOT_FOUND",
      message: "Session not found or you don't have permission to access it.",
    }, 404);
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

  // Invalidate cache
  await deleteCache(`sessions:${user.id}`);

  logger.info("Session updated successfully", { sessionId, userId: user.id });

  return c.json({ success: true } satisfies UpdateSessionResponse);
});

export { sessionsRouter };
