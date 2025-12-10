import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import type { AppType } from "../types";
import {
  type GetSubscriptionResponse,
  upgradeSubscriptionRequestSchema,
  type UpgradeSubscriptionResponse,
  type CancelSubscriptionResponse,
  verifyPurchaseRequestSchema,
  type VerifyPurchaseResponse,
} from "@/shared/contracts";
import { checkAndResetIfNeeded } from "../utils/subscriptionReset";
import { logger } from "../lib/logger";
import { rateLimiters } from "../middleware/rateLimit";

const subscription = new Hono<AppType>();

// Subscription limits
const SUBSCRIPTION_LIMITS = {
  free: {
    customSessionsPerMonth: 3, // Updated from 1 to 3 per PRICING_TIERS.md
    voices: ["neutral", "confident", "whisper"], // All voices available in free tier
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
      customSessionsLimit: 3, // Updated from 1 to 3
      canCreateCustomSession: true,
    } satisfies GetSubscriptionResponse, 200);
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
  } satisfies GetSubscriptionResponse, 200);
});

// POST /api/subscription/upgrade - Upgrade to Pro
subscription.post("/upgrade", rateLimiters.api, zValidator("json", upgradeSubscriptionRequestSchema), async (c) => {
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

  await getOrCreateSubscription(session.userId);

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
  } satisfies UpgradeSubscriptionResponse, 200);
});

// POST /api/subscription/cancel - Cancel subscription
subscription.post("/cancel", rateLimiters.api, async (c) => {
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
  } satisfies CancelSubscriptionResponse, 200);
});

// POST /api/subscription/verify-purchase - Verify IAP purchase and upgrade to Pro
subscription.post(
  "/verify-purchase",
  rateLimiters.api,
  zValidator("json", verifyPurchaseRequestSchema),
  async (c) => {
    const session = c.get("session");
    if (!session) {
      return c.json({ 
        success: false, 
        message: "Authentication required" 
      } satisfies VerifyPurchaseResponse, 401);
    }

    const { productId, platform } = c.req.valid("json");

    // Verify product ID matches expected Pro products (monthly or annual)
    const validProductIds = ["com.recenter.pro.monthly", "com.recenter.pro.annual"];
    if (!validProductIds.includes(productId)) {
      logger.warn("Invalid product ID for purchase verification", { 
        userId: session.userId, 
        productId 
      });
      return c.json({ 
        success: false, 
        message: "Invalid product ID" 
      } satisfies VerifyPurchaseResponse, 400);
    }

    // Determine billing period from product ID
    const billingPeriod: "monthly" | "yearly" = productId.includes("annual") ? "yearly" : "monthly";

    logger.info("Verifying purchase", { 
      userId: session.userId, 
      productId, 
      billingPeriod,
      platform 
    });

    try {
      await getOrCreateSubscription(session.userId);

      // Update to Pro subscription
      const now = new Date();
      const periodEnd = new Date(now);
      if (billingPeriod === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

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

      logger.info("Purchase verified and subscription upgraded", { 
        userId: session.userId 
      });

      return c.json({
        success: true,
        message: "Purchase verified successfully. You now have Pro access!",
      } satisfies VerifyPurchaseResponse, 200);
    } catch (error) {
      logger.error("Failed to verify purchase", error, { 
        userId: session.userId 
      });
      return c.json({ 
        success: false, 
        message: "Failed to verify purchase. Please try again." 
      } satisfies VerifyPurchaseResponse, 500);
    }
  }
);

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
