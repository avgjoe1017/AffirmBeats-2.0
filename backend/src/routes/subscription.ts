import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import type { AppType } from "../index";
import {
  getSubscriptionResponseSchema,
  upgradeSubscriptionRequestSchema,
  upgradeSubscriptionResponseSchema,
  cancelSubscriptionResponseSchema,
} from "@/shared/contracts";
import { checkAndResetIfNeeded } from "../utils/subscriptionReset";

const subscription = new Hono<AppType>();

// Subscription limits
const SUBSCRIPTION_LIMITS = {
  free: {
    customSessionsPerMonth: 1,
    voices: ["neutral", "confident"], // Standard voices
  },
  pro: {
    customSessionsPerMonth: Infinity,
    voices: ["neutral", "confident", "whisper"], // All voices including premium
  },
};

// Helper to get or create subscription
async function getOrCreateSubscription(userId: string) {
  let subscription = await db.userSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Create default free subscription
    subscription = await db.userSubscription.create({
      data: {
        userId,
        tier: "free",
        status: "active",
      },
    });
  }

  // Check if we need to reset monthly usage (lazy reset)
  await checkAndResetIfNeeded(userId);

  // Refresh subscription after potential reset
  subscription = await db.userSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error("Failed to retrieve subscription");
  }

  return subscription;
}

// GET /api/subscription - Get user subscription status
subscription.get("/", async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({
      tier: "free",
      status: "active",
      billingPeriod: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      customSessionsUsedThisMonth: 0,
      customSessionsLimit: 1,
      canCreateCustomSession: true,
    } satisfies typeof getSubscriptionResponseSchema._type, 200);
  }

  const userSubscription = await getOrCreateSubscription(session.userId);

  const limit = userSubscription.tier === "pro"
    ? SUBSCRIPTION_LIMITS.pro.customSessionsPerMonth
    : SUBSCRIPTION_LIMITS.free.customSessionsPerMonth;

  const canCreate = userSubscription.tier === "pro" ||
    userSubscription.customSessionsUsedThisMonth < limit;

  return c.json({
    tier: userSubscription.tier as "free" | "pro",
    status: userSubscription.status as "active" | "cancelled" | "expired",
    billingPeriod: userSubscription.billingPeriod as "monthly" | "yearly" | null,
    currentPeriodEnd: userSubscription.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd,
    customSessionsUsedThisMonth: userSubscription.customSessionsUsedThisMonth,
    customSessionsLimit: limit === Infinity ? 999 : limit,
    canCreateCustomSession: canCreate,
  } satisfies typeof getSubscriptionResponseSchema._type, 200);
});

// POST /api/subscription/upgrade - Upgrade to Pro
subscription.post("/upgrade", zValidator("json", upgradeSubscriptionRequestSchema), async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ success: false, message: "Authentication required" }, 401);
  }

  const { billingPeriod } = c.req.valid("json");

  // Calculate period end date
  const now = new Date();
  const periodEnd = new Date(now);
  if (billingPeriod === "monthly") {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const userSubscription = await getOrCreateSubscription(session.userId);

  // Update to Pro
  await db.userSubscription.update({
    where: { userId: session.userId },
    data: {
      tier: "pro",
      status: "active",
      billingPeriod,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  return c.json({
    success: true,
    message: `Successfully upgraded to Pro (${billingPeriod})`,
  } satisfies typeof upgradeSubscriptionResponseSchema._type, 200);
});

// POST /api/subscription/cancel - Cancel subscription
subscription.post("/cancel", async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ success: false, message: "Authentication required" }, 401);
  }

  const userSubscription = await getOrCreateSubscription(session.userId);

  if (userSubscription.tier === "free") {
    return c.json({ success: false, message: "No active subscription to cancel" }, 400);
  }

  // Mark for cancellation at period end
  await db.userSubscription.update({
    where: { userId: session.userId },
    data: {
      cancelAtPeriodEnd: true,
    },
  });

  return c.json({
    success: true,
    message: "Subscription will be cancelled at the end of the current billing period",
  } satisfies typeof cancelSubscriptionResponseSchema._type, 200);
});

// POST /api/subscription/track-usage - Internal endpoint to track custom session creation
subscription.post("/track-usage", async (c) => {
  const session = c.get("session");
  if (!session) {
    return c.json({ success: false }, 401);
  }

  const userSubscription = await getOrCreateSubscription(session.userId);

  // Increment usage counter
  await db.userSubscription.update({
    where: { userId: session.userId },
    data: {
      customSessionsUsedThisMonth: userSubscription.customSessionsUsedThisMonth + 1,
    },
  });

  return c.json({ success: true }, 200);
});

export { subscription, SUBSCRIPTION_LIMITS, getOrCreateSubscription };
