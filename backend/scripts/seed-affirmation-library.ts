/**
 * Seed Initial Affirmation Library
 * 
 * Populates the affirmation library with affirmations from default sessions
 * and creates initial session templates for common intents.
 */

import { db } from "../src/db";

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
    intent: "help me sleep better",
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
    intent: "help me focus and be productive",
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
    intent: "help me feel calm and peaceful",
    binauralCategory: "alpha",
    binauralHz: "8-12",
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
    intent: "help me manifest my goals and dreams",
    binauralCategory: "theta",
    binauralHz: "4-8",
  },
];

async function seedAffirmationLibrary() {
  console.log("🌱 Seeding affirmation library...");

  try {
    // Clear existing data (optional - comment out if you want to keep existing)
    // await db.affirmationLine.deleteMany({});
    // await db.sessionTemplate.deleteMany({});

    let totalAffirmations = 0;
    let totalTemplates = 0;

    for (const session of DEFAULT_SESSIONS) {
      // Extract keywords from intent
      const keywords = extractKeywords(session.intent);
      const themes = extractThemes(session.intent, session.goal);

      // Save each affirmation to the pool
      const affirmationIds: string[] = [];
      
      for (const text of session.affirmations) {
        // Check if affirmation already exists
        let affirmation = await db.affirmationLine.findFirst({
          where: {
            text,
            goal: session.goal,
          },
        });

        if (!affirmation) {
          // Create new affirmation
          affirmation = await db.affirmationLine.create({
            data: {
              text,
              goal: session.goal,
              tags: themes,
              emotion: themes[0] || "general",
              useCount: 0,
            },
          });
          totalAffirmations++;
        } else {
          // Update tags if they've changed
          await db.affirmationLine.update({
            where: { id: affirmation.id },
            data: { tags: themes },
          });
        }

        affirmationIds.push(affirmation.id);
      }

      // Check if template already exists
      let template = await db.sessionTemplate.findUnique({
        where: { id: session.id },
      });

      if (!template) {
        // Create new template
        template = await db.sessionTemplate.create({
          data: {
            id: session.id,
            title: session.title,
            goal: session.goal,
            intent: session.intent,
            intentKeywords: keywords,
            affirmationIds,
            binauralCategory: session.binauralCategory,
            binauralHz: session.binauralHz,
            lengthSec: 600, // Default length
            isDefault: true,
            useCount: 0,
          },
        });
        totalTemplates++;
      } else {
        // Update existing template
        await db.sessionTemplate.update({
          where: { id: session.id },
          data: {
            intentKeywords: keywords,
            affirmationIds,
          },
        });
      }

      console.log(`✅ ${template.id === session.id ? 'Created' : 'Updated'} template: ${template.title}`);
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   - ${totalAffirmations} affirmations added to pool`);
    console.log(`   - ${totalTemplates} session templates created`);
  } catch (error) {
    console.error("❌ Error seeding library:", error);
    throw error;
  }
}

function extractKeywords(intent: string): string[] {
  const words = intent
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !["help", "want", "need", "feel", "make", "get", "have", "me", "my"].includes(word));

  return [...new Set(words)];
}

function extractThemes(intent: string, goal: string): string[] {
  // Simple theme extraction based on goal and common words
  const themes: string[] = [];
  const intentLower = intent.toLowerCase();

  // Goal-specific themes
  if (goal === "sleep") {
    if (intentLower.includes("sleep") || intentLower.includes("rest")) themes.push("sleep", "rest");
    if (intentLower.includes("anxiety") || intentLower.includes("stress")) themes.push("anxiety", "stress");
    if (intentLower.includes("calm") || intentLower.includes("peace")) themes.push("calm", "peace");
  } else if (goal === "focus") {
    if (intentLower.includes("focus") || intentLower.includes("concentrate")) themes.push("focus", "concentration");
    if (intentLower.includes("productiv") || intentLower.includes("work")) themes.push("productivity", "work");
    if (intentLower.includes("energy") || intentLower.includes("motivat")) themes.push("energy", "motivation");
  } else if (goal === "calm") {
    if (intentLower.includes("anxiety") || intentLower.includes("stress")) themes.push("anxiety", "stress");
    if (intentLower.includes("calm") || intentLower.includes("peace")) themes.push("calm", "peace");
    if (intentLower.includes("relax") || intentLower.includes("rest")) themes.push("relaxation", "rest");
  } else if (goal === "manifest") {
    if (intentLower.includes("goal") || intentLower.includes("dream")) themes.push("goals", "dreams");
    if (intentLower.includes("abund") || intentLower.includes("success")) themes.push("abundance", "success");
    if (intentLower.includes("wealth") || intentLower.includes("money")) themes.push("wealth", "prosperity");
  }

  // Add goal itself as a theme
  themes.push(goal);

  return [...new Set(themes)];
}

// Run if called directly
if (require.main === module) {
  seedAffirmationLibrary()
    .then(() => {
      console.log("✅ Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export { seedAffirmationLibrary };

