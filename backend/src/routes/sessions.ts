import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
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
import { matchOrGenerate } from "../lib/affirmationMatcher";
import { generateAffirmationAudio } from "../utils/affirmationAudio";

const sessionsRouter = new Hono<AppType>();

// Initialize OpenAI client (if API key is available)
const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

// Default user intentions for each goal type (used when no custom prompt is provided)
const DEFAULT_INTENTIONS = {
  sleep: "I want to release the day and welcome deep, restorative rest",
  focus: "I want to sharpen my focus and complete my tasks with clarity and purpose",
  calm: "I want to find peace and center myself in the present moment",
  manifest: "I want to create and receive the abundance and success I'm working toward",
};

/**
 * Creates a personalized affirmation prompt based on user intention and goal
 */
export function createAffirmationPrompt(
  userIntention: string,
  goal: "sleep" | "focus" | "calm" | "manifest"
): string {
  const styleGuides = {
    sleep: "Focus on release, relaxation, and peace. Use calming language.",
    focus: "Emphasize clarity, capability, and completion. Use action-oriented language.",
    calm: "Center on presence, acceptance, and groundedness. Stay in the NOW.",
    manifest: "Balance desire with deserving. Use magnetic, receiving language.",
  };

  const toneExamples = {
    sleep: "I release the day and welcome deep rest\nI am safe, supported, and at peace",
    focus: "I complete what I start with clarity\nI am capable of achieving this goal",
    calm: "I breathe and center myself right now\nI am grounded in this present moment",
    manifest: "I am ready to receive what I desire\nI deserve the abundance I'm creating",
  };

  return `You are an expert affirmation writer specializing in ${goal} and personal transformation.

USER'S SPECIFIC INTENTION:

"${userIntention}"

Your task: Create 6-10 affirmations that feel personally crafted for THIS person's unique situation.

CRITICAL REQUIREMENTS:

1. FIRST PERSON ONLY: Start with "I am", "I", or "My"

2. PRESENT TENSE: Write as if it's already happening now

3. ULTRA-SPECIFIC: Reference their exact words/situation - not generic platitudes

4. CONCISE: Maximum 12 words per affirmation

5. VARIED STRUCTURE: Mix "I am" / "I [verb]" / "My [noun]" - don't repeat patterns

6. EMOTIONAL: Make them FEEL something, not just read words

7. NO FLUFF: No therapy jargon, medical claims, or abstract metaphors

STYLE GUIDE FOR ${goal.toUpperCase()}:

${styleGuides[goal]}

TONE EXAMPLES (for inspiration):

${toneExamples[goal]}

AVOID THESE MISTAKES:

❌ "I am abundant" (too vague)

❌ "I attract wealth effortlessly" (sounds like magic, not empowering)

❌ "The universe provides" (not first person)

❌ "Money flows to me like water" (we said no metaphors!)

INSTEAD, MAKE THEM CONCRETE:

✅ "I am building financial security"

✅ "I take actions that create the income I need"

✅ "I deserve to be paid for the value I provide"

STRUCTURAL VARIETY:

- At least 2 start with "I am [quality/state]"

- At least 2 start with "I [action verb]"

- At least 1 starts with "My [noun]"

- Mix 6-8 word affirmations with 9-12 word affirmations

- No more than 2 consecutive lines with the same opening

OUTPUT FORMAT:

Plain text only. One affirmation per line. No numbering. No bullets. No markdown.

Between 6-10 total lines.

Now create deeply personalized affirmations for: "${userIntention}"

Remember: These should feel like they were written FOR this person, not AT this person.`;
}

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
/**
 * Seed default sessions into the database
 * Called on server startup to ensure default sessions are available
 * 
 * Note: Default sessions are NOT seeded into the database because:
 * 1. The schema requires userId (non-nullable with required relation)
 * 2. Making userId optional would require a migration
 * 3. Default sessions are served directly from DEFAULT_SESSIONS array for guest users
 * 4. For the playlist endpoint, we need to handle default sessions specially
 * 
 * Instead, the playlist endpoint should check if sessionId starts with "default-"
 * and generate TTS on-the-fly or return an empty playlist.
 */
export async function seedDefaultSessions() {
  logger.info("Default sessions are served from memory (not seeded to database)");
  // Default sessions are returned directly from DEFAULT_SESSIONS array
  // No database seeding needed
}

export const DEFAULT_SESSIONS = [
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
    voiceId: "premium1",
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
    voiceId: "premium1",
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
    voiceId: "premium1",
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
    voiceId: "premium1",
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
    voiceId: "premium1",
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
    voiceId: "premium1",
    pace: "slow",
    noise: "rain",
    lengthSec: 480,
    isFavorite: false,
    createdAt: new Date("2024-11-18T14:00:00Z").toISOString(),
    binauralCategory: "theta",
    binauralHz: "4-7",
  },
];

// Generate affirmations using hybrid system (exact match → pooled → generated)
async function generateAffirmations(
  goal: "sleep" | "focus" | "calm" | "manifest",
  customPrompt?: string,
  userId?: string,
  isFirstSession: boolean = false
): Promise<{
  affirmations: string[];
  matchType: "exact" | "pooled" | "generated" | "fallback";
  affirmationIds?: string[];
  templateId?: string;
  cost: number;
}> {
  // Use custom prompt if provided, otherwise use default intention for the goal
  const userIntention = customPrompt || DEFAULT_INTENTIONS[goal];

  // Use hybrid matching system
  const matchResult = await matchOrGenerate(userIntention, goal, userId, isFirstSession);

  return {
    affirmations: matchResult.affirmations,
    matchType: matchResult.type,
    affirmationIds: matchResult.affirmationIds,
    templateId: matchResult.templateId,
    cost: matchResult.cost,
  };
}

/**
 * Process affirmations for a session:
 * 1. Create/update AffirmationLine records
 * 2. Generate audio for each affirmation
 * 3. Create SessionAffirmation junction records
 * Returns array of affirmation IDs
 */
async function processSessionAffirmations(
  affirmations: string[],
  affirmationIds: string[] | undefined,
  goal: "sleep" | "focus" | "calm" | "manifest",
  voiceType: string,
  pace: "slow" | "normal",
  sessionId: string,
  silenceBetweenMs: number = 8000 // Default 8 seconds (8000ms) to match default affirmationSpacing
): Promise<string[]> {
  const processedAffirmationIds: string[] = [];

  for (let i = 0; i < affirmations.length; i++) {
    const text = affirmations[i];
    if (!text) {
      logger.warn(`Skipping empty affirmation at index ${i}`);
      continue;
    }

    let affirmationId: string | undefined;

    // If we have an existing affirmation ID (from library match), use it
    if (affirmationIds && affirmationIds[i]) {
      affirmationId = affirmationIds[i];
    }

    // Create new AffirmationLine record if we don't have an ID
    if (!affirmationId) {
      const newAffirmation = await db.affirmationLine.create({
        data: {
          text,
          goal,
          tags: [], // Can be enhanced later with AI tagging
        },
      });
      affirmationId = newAffirmation.id;
    }

    // affirmationId is guaranteed to be defined at this point
    if (!affirmationId) {
      logger.error(`Failed to get affirmation ID for text at index ${i}`);
      continue;
    }

    // Generate audio for this affirmation (or use cached)
    try {
      const audioResult = await generateAffirmationAudio(
        affirmationId,
        text,
        voiceType as any,
        goal,
        pace
      );
      logger.debug(`Generated audio for affirmation ${affirmationId}`, {
        durationMs: audioResult.durationMs,
        audioUrl: audioResult.audioUrl,
      });
    } catch (error) {
      logger.error(`Failed to generate audio for affirmation ${affirmationId}`, error, {
        text: text.substring(0, 50),
        voiceType,
        goal,
        pace,
      });
      // Continue even if audio generation fails - audio can be generated later
      // But log it so we know what's happening
    }

    // Create SessionAffirmation junction record
    await db.sessionAffirmation.create({
      data: {
        sessionId,
        affirmationId,
        position: i + 1, // 1-indexed
        silenceAfterMs: silenceBetweenMs,
      },
    });

    processedAffirmationIds.push(affirmationId);
  }

  return processedAffirmationIds;
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
  let affirmationSpacing = 8; // Default 8 seconds

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
      affirmationSpacing = preferences.affirmationSpacing || 8; // Default to 8 if not set
    }
  }

  // Normalize voice to supported set (handle legacy "whisper" value)
  const allowedVoices = [
    "neutral",
    "confident",
    "premium1",
    "premium2",
    "premium3",
    "premium4",
    "premium5",
    "premium6",
    "premium7",
    "premium8",
  ];

  if (!allowedVoices.includes(voice)) {
    logger.warn("Unsupported voice in preferences, falling back to neutral", {
      userId: user?.id,
      voice,
    });
    voice = "neutral";
  }

  // Check if this is user's first session
  const isFirstSession = user
    ? (await db.affirmationSession.count({ where: { userId: user.id } })) === 0
    : false;

  // Generate affirmations with optional custom prompt using hybrid system
  const generationResult = await generateAffirmations(
    goal,
    customPrompt,
    user?.id,
    isFirstSession
  );

  // Log the generation for analytics
  const generationLog = await db.generationLog.create({
    data: {
      userId: user?.id || null,
      userIntent: customPrompt || DEFAULT_INTENTIONS[goal],
      goal,
      matchType: generationResult.matchType,
      affirmationsUsed: generationResult.affirmationIds || generationResult.affirmations,
      templateId: generationResult.templateId || null,
      apiCost: generationResult.cost,
      confidence: generationResult.matchType === "exact" || generationResult.matchType === "pooled" ? 0.8 : 1.0,
    },
  });

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

  // Calculate silence duration from user preference (convert seconds to milliseconds)
  const silenceBetweenMs = affirmationSpacing * 1000; // Convert seconds to milliseconds

  // Generate a temporary session ID for guest users
  const sessionId = user
    ? (
        await db.affirmationSession.create({
          data: {
            userId: user.id,
            goal,
            title,
            affirmations: JSON.stringify(generationResult.affirmations), // Legacy field
            voiceId: voice,
            pace,
            noise,
            lengthSec,
            silenceBetweenMs,
            isFavorite: false,
            binauralCategory: binauralCategory || null,
            binauralHz: binauralHz || null,
          },
        })
      ).id
    : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Process affirmations: create AffirmationLine records, generate audio, create SessionAffirmation records
  // Only process if user is authenticated (guest sessions don't get persisted audio)
  if (user) {
    try {
      await processSessionAffirmations(
        generationResult.affirmations,
        generationResult.affirmationIds,
        goal,
        voice,
        pace as "slow" | "normal",
        sessionId,
        silenceBetweenMs
      );
    } catch (error) {
      logger.error("Failed to process session affirmations", error, { sessionId });
      // Continue anyway - session can still be created, audio can be generated later
    }
  }

  // Update generation log with session ID
  await db.generationLog.update({
    where: { id: generationLog.id },
    data: { sessionId: user ? sessionId : null },
  });

  const sessionCreationDuration = Date.now() - sessionGenerationStartTime;
  loggers.sessionCreated(sessionId, user?.id || "guest", goal);
  metricHelpers.sessionCreation(goal, sessionCreationDuration);

  // Log cost savings
  if (generationResult.matchType !== "generated") {
    logger.info("Cost saved by using library", {
      matchType: generationResult.matchType,
      cost: generationResult.cost,
      saved: 0.21 - generationResult.cost,
    });
  }

  // Invalidate user sessions cache if authenticated
  if (user) {
    await deleteCache(`sessions:${user.id}`);
  }

  return c.json({
    sessionId,
    title,
    affirmations: generationResult.affirmations,
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
sessionsRouter.post("/create", rateLimiters.api, zValidator("json", createCustomSessionRequestSchema), async (c) => {
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
  let affirmationSpacing = 8; // Default 8 seconds

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
      affirmationSpacing = preferences.affirmationSpacing || 8; // Default to 8 if not set
    }
  }

  // Normalize voice to supported set (handle legacy "whisper" value)
  const allowedVoices = [
    "neutral",
    "confident",
    "premium1",
    "premium2",
    "premium3",
    "premium4",
    "premium5",
    "premium6",
    "premium7",
    "premium8",
  ];

  if (!allowedVoices.includes(voice)) {
    logger.warn("Unsupported voice in preferences, falling back to neutral", {
      userId: user?.id,
      voice,
    });
    voice = "neutral";
  }

  // Calculate session length based on pace and number of affirmations
  const baseLengthPerAffirmation = 30; // 30 seconds per affirmation
  const lengthMultiplier = pace === "slow" ? 1.3 : 1.0;
  const lengthSec = Math.round(affirmations.length * baseLengthPerAffirmation * lengthMultiplier);

  // Calculate silence duration from user preference (convert seconds to milliseconds)
  const silenceBetweenMs = affirmationSpacing * 1000; // Convert seconds to milliseconds

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
          silenceBetweenMs,
          isFavorite: false,
          binauralCategory,
          binauralHz,
        },
      });
      sessionId = session.id;
      
      // Process affirmations: create AffirmationLine records, generate audio, create SessionAffirmation records
      try {
        await processSessionAffirmations(
          affirmations,
          undefined, // No existing affirmation IDs for custom sessions
          goal,
          voice,
          pace as "slow" | "normal",
          sessionId,
          silenceBetweenMs
        );
        logger.info("Processed individual affirmations for custom session", { sessionId, affirmationsCount: affirmations.length });
      } catch (error) {
        logger.error("Failed to process session affirmations for custom session", error, { sessionId });
        // Continue anyway - session can still be created, audio can be generated later
      }
      
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
// GET /api/sessions/:id/playlist - Get session audio playlist
// ============================================
sessionsRouter.get("/:id/playlist", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("id");
  const baseUrl = `${c.req.header("x-forwarded-proto") || "http"}://${c.req.header("host") || "localhost:3000"}`;

  logger.info("Fetching session playlist", { sessionId, userId: user?.id || "guest" });

  // Check if this is a default session (not in database)
  const isDefaultSession = sessionId.startsWith("default-");
  
  if (isDefaultSession) {
    // Default sessions are not in the database - they're served from DEFAULT_SESSIONS array
    // For now, return empty playlist (client will fall back to legacy TTS system)
    logger.info("Default session requested - returning empty playlist (will use legacy TTS)", { sessionId });
    
    // Find the default session in the DEFAULT_SESSIONS array
    const defaultSession = DEFAULT_SESSIONS.find(s => s.id === sessionId);
    if (!defaultSession) {
      return c.json({
        error: "NOT_FOUND",
        code: "NOT_FOUND",
        message: "Default session not found.",
      }, 404);
    }
    
    return c.json({
      sessionId: sessionId,
      totalDurationMs: 0,
      silenceBetweenMs: 8000, // Default spacing
      affirmations: [],
      binauralCategory: defaultSession.binauralCategory || undefined,
      binauralHz: defaultSession.binauralHz || undefined,
      backgroundNoise: defaultSession.noise || undefined,
    });
  }

  // Get session from database (for user sessions)
  const session = await db.affirmationSession.findUnique({
    where: { id: sessionId },
    include: {
      sessionAffirmations: {
        include: {
          affirmation: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!session) {
    return c.json({
      error: "NOT_FOUND",
      code: "NOT_FOUND",
      message: "Session not found or not processed yet",
    }, 404);
  }

  // Check if user has access (must be owner or it's a default session)
  if (session.userId && session.userId !== user?.id) {
    return c.json({
      error: "FORBIDDEN",
      code: "FORBIDDEN",
      message: "You don't have permission to access this session.",
    }, 403);
  }

  // Build playlist from SessionAffirmation records
  // If session has no individual affirmations, return empty playlist (legacy sessions use single audio file)
  if (!session.sessionAffirmations || session.sessionAffirmations.length === 0) {
    logger.info("Session has no individual affirmations, returning empty playlist", { sessionId });
    return c.json({
      sessionId: session.id,
      totalDurationMs: 0,
      silenceBetweenMs: session.silenceBetweenMs,
      affirmations: [],
      binauralCategory: session.binauralCategory || undefined,
      binauralHz: session.binauralHz || undefined,
      backgroundNoise: session.noise || undefined,
    });
  }

  // For default sessions, use the session's voiceId directly
  // For user sessions, use user preferences
  let preferredVoice: string = "neutral";
  
  if (isDefaultSession) {
    // Default sessions use their own voiceId
    preferredVoice = session.voiceId || "neutral";
  } else if (user) {
    // User sessions use user preferences
    const preferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
    });
    if (preferences) {
      preferredVoice = preferences.voice || "neutral";
    }
  }

  // Check if user has premium access
  // Default sessions always have access to premium voices
  let hasPremiumAccess = false;
  if (isDefaultSession) {
    // Default sessions always have access to premium voices
    hasPremiumAccess = true;
  } else if (user) {
    const subscription = await db.userSubscription.findUnique({
      where: { userId: user.id },
    });
    hasPremiumAccess = subscription?.tier === "pro";
  }

  // Map premium voices to allowed voices
  const allowedVoices = ["neutral", "confident"];
  if (hasPremiumAccess) {
    allowedVoices.push("premium1", "premium2", "premium3", "premium4", "premium5", "premium6", "premium7", "premium8");
  }

  // If user's preferred voice is not allowed, fall back to neutral
  if (!allowedVoices.includes(preferredVoice)) {
    preferredVoice = "neutral";
  }

  // OPTIMIZATION: Batch load all audio versions in a single query instead of N queries
  // This eliminates the N+1 query problem (30 queries → 1 query for 10 affirmations)
  const affirmationIds = session.sessionAffirmations.map(sa => sa.affirmationId);
  
  // Load all audio versions for all affirmations in one query
  const allAudioVersions = await db.affirmationAudio.findMany({
    where: {
      affirmationId: { in: affirmationIds },
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  });

  // Create lookup maps for O(1) access
  // Map: affirmationId -> Map: voiceId -> audioVersion
  const audioVersionMap = new Map<string, Map<string, typeof allAudioVersions[0]>>();
  for (const audioVersion of allAudioVersions) {
    if (!audioVersionMap.has(audioVersion.affirmationId)) {
      audioVersionMap.set(audioVersion.affirmationId, new Map());
    }
    audioVersionMap.get(audioVersion.affirmationId)!.set(audioVersion.voiceId, audioVersion);
  }

  // Build playlist by matching audio versions in memory (O(N) instead of O(N²))
  const affirmations = session.sessionAffirmations.map((sa) => {
    const affirmationAudioMap = audioVersionMap.get(sa.affirmationId);
    
    // Try to find the preferred audio version first
    let audioVersion = affirmationAudioMap?.get(preferredVoice);
    
    // If not found, try any allowed voice
    if (!audioVersion && affirmationAudioMap) {
      for (const voiceId of allowedVoices) {
        audioVersion = affirmationAudioMap.get(voiceId);
        if (audioVersion) break;
      }
    }
    
    // If still not found, try any voice (for admin/testing)
    if (!audioVersion && affirmationAudioMap) {
      // Get first available voice version
      audioVersion = Array.from(affirmationAudioMap.values())[0];
    }

    // Fall back to legacy fields if no audio version exists
    const audioUrl = audioVersion
      ? `${baseUrl}${audioVersion.audioUrl}`
      : sa.affirmation.ttsAudioUrl
      ? `${baseUrl}${sa.affirmation.ttsAudioUrl}`
      : null;

    const durationMs = audioVersion
      ? audioVersion.durationMs
      : sa.affirmation.audioDurationMs || 0;

    return {
      id: sa.affirmationId,
      text: sa.affirmation.text,
      audioUrl,
      durationMs,
      silenceAfterMs: sa.silenceAfterMs,
      voiceId: audioVersion?.voiceId || sa.affirmation.ttsVoiceId || null,
    };
  });

  // Calculate total duration
  const totalDurationMs = affirmations.reduce((sum, aff) => {
    return sum + (aff.durationMs || 0) + aff.silenceAfterMs;
  }, 0);

  return c.json({
    sessionId: session.id,
    totalDurationMs,
    silenceBetweenMs: session.silenceBetweenMs,
    affirmations,
    binauralCategory: session.binauralCategory || undefined,
    binauralHz: session.binauralHz || undefined,
    backgroundNoise: session.noise || undefined,
  });
});

// ============================================
// PATCH /api/sessions/:id/favorite - Toggle favorite
// ============================================
sessionsRouter.patch("/:id/favorite", rateLimiters.api, zValidator("json", toggleFavoriteRequestSchema), async (c) => {
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
sessionsRouter.delete("/:id", rateLimiters.api, async (c) => {
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
sessionsRouter.patch("/:id", rateLimiters.api, zValidator("json", updateSessionRequestSchema), async (c) => {
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

// ============================================
// POST /api/sessions/:id/feedback - Rate session quality
// ============================================
sessionsRouter.post("/:id/feedback", zValidator("json", z.object({
  rating: z.number().min(1).max(5),
  wasReplayed: z.boolean().optional(),
})), async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("id");
  const { rating, wasReplayed } = c.req.valid("json");

  logger.info("Session feedback received", { sessionId, rating, wasReplayed });

  // Find generation log for this session
  const generationLog = await db.generationLog.findFirst({
    where: {
      sessionId: sessionId === "temp" ? null : sessionId,
      userId: user?.id || null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (generationLog) {
    // Update generation log
    await db.generationLog.update({
      where: { id: generationLog.id },
      data: {
        wasRated: true,
        userRating: rating,
        wasReplayed: wasReplayed || false,
      },
    });

    // If this was a pooled session and highly rated, boost affirmation ratings
    if (generationLog.matchType === "pooled" && rating >= 4 && generationLog.affirmationsUsed.length > 0) {
      // Try to parse affirmation IDs (they might be IDs or full text)
      const affirmationIds = generationLog.affirmationsUsed.filter(id => id.length < 50); // Likely IDs, not full text
      
      if (affirmationIds.length > 0) {
        await db.affirmationLine.updateMany({
          where: { id: { in: affirmationIds } },
          data: {
            useCount: { increment: 1 },
            // Update average rating
            userRating: {
              // Simple increment - could be more sophisticated
              increment: 0.1,
            },
          },
        });
      }
    }

    // If this was an exact match template, boost template rating
    if (generationLog.matchType === "exact" && generationLog.templateId && rating >= 4) {
      await db.sessionTemplate.update({
        where: { id: generationLog.templateId },
        data: {
          useCount: { increment: 1 },
          userRating: {
            increment: 0.1,
          },
        },
      });
    }
  }

  return c.json({ success: true });
});

export { sessionsRouter };
