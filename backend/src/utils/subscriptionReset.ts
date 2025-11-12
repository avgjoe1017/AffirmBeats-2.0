/**
 * Subscription Reset Utility
 * 
 * Resets monthly usage counters for free tier subscriptions that have
 * exceeded their 30-day billing period.
 * 
 * This should be called periodically (e.g., daily via cron job or scheduled task).
 */

import { db } from "../db";

/**
 * Reset monthly usage counters for subscriptions that have exceeded 30 days
 * since their last reset date.
 * 
 * @returns Number of subscriptions reset
 */
export async function resetMonthlyCounters(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log(`🔄 [Subscription Reset] Checking for subscriptions to reset (last reset before ${thirtyDaysAgo.toISOString()})`);

  const result = await db.userSubscription.updateMany({
    where: {
      lastResetDate: { lt: thirtyDaysAgo },
      tier: "free", // Only reset free tier counters
    },
    data: {
      customSessionsUsedThisMonth: 0,
      lastResetDate: new Date(),
    },
  });

  if (result.count > 0) {
    console.log(`✅ [Subscription Reset] Reset ${result.count} subscription counter(s)`);
  } else {
    console.log(`ℹ️  [Subscription Reset] No subscriptions needed reset`);
  }

  return result.count;
}

/**
 * Check if a subscription needs reset and reset it if needed.
 * This is a lazy check that can be called on-demand.
 * 
 * @param userId User ID to check
 * @returns true if reset occurred, false otherwise
 */
export async function checkAndResetIfNeeded(userId: string): Promise<boolean> {
  const subscription = await db.userSubscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.tier === "pro") {
    return false;
  }

  const now = new Date();
  const lastReset = new Date(subscription.lastResetDate);
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceReset >= 30) {
    await db.userSubscription.update({
      where: { userId },
      data: {
        customSessionsUsedThisMonth: 0,
        lastResetDate: now,
      },
    });
    console.log(`🔄 [Subscription Reset] Reset counter for user ${userId} (${daysSinceReset} days since last reset)`);
    return true;
  }

  return false;
}

