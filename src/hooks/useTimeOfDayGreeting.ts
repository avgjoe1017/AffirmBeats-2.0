import { useMemo } from "react";

interface Greeting {
  greeting: string;
  subtext: string;
}

/**
 * Time-of-Day Greeting Hook (Calm Daily Prime Style)
 * 
 * Returns warm, contextual greetings based on time of day
 * without guilt or streaks.
 * 
 * Time ranges:
 * - 5am–11am: Morning
 * - 11am–6pm: Afternoon
 * - 6pm–10pm: Evening
 * - 10pm–5am: Night
 */
export const useTimeOfDayGreeting = (userName?: string): Greeting => {
  return useMemo(() => {
    const hour = new Date().getHours();
    const name = userName ? `, ${userName}` : "";

    // Night (10pm - 5am)
    if (hour >= 22 || hour < 5) {
      return {
        greeting: `Hi${name}`,
        subtext: "Take a breath before you rest.",
      };
    }

    // Morning (5am - 11am)
    if (hour >= 5 && hour < 11) {
      return {
        greeting: `Good morning${name}`,
        subtext: "Today's a great day to focus.",
      };
    }

    // Afternoon (11am - 6pm)
    if (hour >= 11 && hour < 18) {
      return {
        greeting: `Good afternoon${name}`,
        subtext: "You deserve a moment to reset.",
      };
    }

    // Evening (6pm - 10pm)
    return {
      greeting: `Good evening${name}`,
      subtext: "Tonight's a good night to unwind.",
    };
  }, [userName]);
};

/**
 * Context-Aware Session Reordering (Endel Style)
 * 
 * Reorders sessions based on time of day for personalized "Jump Back In"
 */
export const getTimeBasedGoalPriority = (): string[] => {
  const hour = new Date().getHours();

  // Night (8pm - 4am): Prioritize sleep and calm
  if (hour >= 20 || hour < 4) {
    return ["sleep", "calm", "manifest", "focus"];
  }

  // Morning (5am - 11am): Prioritize focus
  if (hour >= 5 && hour < 11) {
    return ["focus", "calm", "manifest", "sleep"];
  }

  // Afternoon (11am - 6pm): Prioritize calm and focus
  if (hour >= 11 && hour < 18) {
    return ["calm", "focus", "manifest", "sleep"];
  }

  // Evening (6pm - 8pm): Prioritize calm
  return ["calm", "manifest", "focus", "sleep"];
};

/**
 * Context-Aware Default Category Suggestion (Endel Style)
 * 
 * Suggests the most relevant category based on:
 * - Time of day
 * - Usage patterns (could be extended with user data)
 */
export const getSuggestedCategory = (): "sleep" | "focus" | "calm" | "manifest" => {
  const hour = new Date().getHours();

  // After 8pm: Suggest Sleep
  if (hour >= 20) {
    return "sleep";
  }

  // Morning (5am - 11am): Suggest Focus
  if (hour >= 5 && hour < 11) {
    return "focus";
  }

  // Default to Calm for most of the day
  return "calm";
};

