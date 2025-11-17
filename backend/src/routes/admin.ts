/**
 * Admin Dashboard Routes
 * 
 * Provides aggregated metrics and analytics for admin monitoring.
 * All routes are protected by adminAuth middleware (requires authentication + admin email).
 */

import { Hono } from "hono";
import { type AppType } from "../types";
import { db } from "../db";
import { logger } from "../lib/logger";
import { metrics } from "../lib/metrics";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { adminAuth } from "../middleware/adminAuth";

const adminRouter = new Hono<AppType>();

// Apply admin authentication to all admin routes
adminRouter.use("*", adminAuth);

/**
 * GET /api/admin/dashboard
 * Get comprehensive dashboard metrics
 */
adminRouter.get("/dashboard", async (c) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    // Run independent queries in parallel to reduce connection overhead
    const [
      activeUsers24h,
      sessions24h,
      activeProSubscriptions,
      activeProSubscriptionsYesterday,
    ] = await Promise.all([
      db.user.count({
        where: {
          createdAt: { gte: last24Hours },
        },
      }),
      db.affirmationSession.count({
        where: {
          createdAt: { gte: last24Hours },
        },
      }),
      db.userSubscription.count({
        where: {
          tier: "pro",
          status: "active",
        },
      }),
      db.userSubscription.count({
        where: {
          tier: "pro",
          status: "active",
          createdAt: { lt: startOfToday },
        },
      }),
    ]);

    // Get subscription pricing (assuming $9.99/month for pro)
    const PRO_MONTHLY_PRICE = 9.99;
    const revenueTodayAmount = activeProSubscriptions * (PRO_MONTHLY_PRICE / 30); // Approximate daily
    const revenueYesterdayAmount = activeProSubscriptionsYesterday * (PRO_MONTHLY_PRICE / 30);
    const revenueChange = revenueYesterdayAmount > 0
      ? ((revenueTodayAmount - revenueYesterdayAmount) / revenueYesterdayAmount) * 100
      : revenueTodayAmount > 0 ? 100 : 0; // If we have revenue today but none yesterday, it's +100%

    // API costs (run in parallel)
    const [costsToday, costsThisMonth] = await Promise.all([
      db.generationLog.aggregate({
        where: {
          createdAt: { gte: startOfToday },
        },
        _sum: {
          apiCost: true,
        },
        _count: true,
      }),
      db.generationLog.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
        },
        _sum: {
          apiCost: true,
        },
        _count: true,
      }),
    ]);
    const apiCostToday = costsToday._sum.apiCost || 0;
    const apiCostThisMonth = costsThisMonth._sum.apiCost || 0;

    // Error rate from metrics with breakdown
    const apiRequestStats = metrics.getSummary("api.request.count");
    const apiErrorStats = metrics.getSummary("api.error.count");
    const errorRate = apiRequestStats && apiRequestStats.count > 0
      ? (apiErrorStats?.count || 0) / apiRequestStats.count
      : 0;

    // Get error breakdown by status code (from last 24h)
    const last24hErrors = metrics.getMetrics("api.error.count", last24Hours.getTime());
    const last24hRequests = metrics.getMetrics("api.request.count", last24Hours.getTime());
    
    // Group errors by status code from tags
    const errorBreakdown: Record<string, number> = {
      "400": 0,
      "401": 0,
      "403": 0,
      "404": 0,
      "500": 0,
      "timeout": 0,
      "other": 0,
    };

    last24hErrors.forEach((error) => {
      const status = error.tags?.status || error.tags?.error || "other";
      if (status.startsWith("4")) {
        errorBreakdown[status] = (errorBreakdown[status] || 0) + 1;
      } else if (status.startsWith("5")) {
        errorBreakdown["500"] = (errorBreakdown["500"] || 0) + 1;
      } else if (status.includes("timeout") || status.includes("TIMEOUT")) {
        errorBreakdown["timeout"] = (errorBreakdown["timeout"] || 0) + 1;
      } else {
        errorBreakdown["other"] = (errorBreakdown["other"] || 0) + 1;
      }
    });

    // Get recent errors for detail view (last 10)
    const recentErrors = last24hErrors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((err) => ({
        timestamp: err.timestamp,
        path: err.tags?.path || "unknown",
        method: err.tags?.method || "unknown",
        error: err.tags?.error || "unknown",
        status: err.tags?.status || "unknown",
      }));

    // Average rating
    const ratingStats = await db.generationLog.aggregate({
      where: {
        wasRated: true,
        userRating: { not: null },
      },
      _avg: {
        userRating: true,
      },
    });
    const avgRating = ratingStats._avg.userRating || 0;

    // Cost breakdown by match type (this month)
    const costBreakdown = await db.generationLog.groupBy({
      by: ["matchType"],
      where: {
        createdAt: { gte: startOfMonth },
      },
      _count: true,
      _sum: {
        apiCost: true,
      },
    });

    // Get confidence score distribution for pooled and exact matches
    const confidenceScores = await db.generationLog.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        matchType: { in: ["exact", "pooled"] },
        confidence: { not: null },
      },
      select: {
        confidence: true,
        matchType: true,
      },
    });

    // Group confidence scores into buckets
    const confidenceDistribution = {
      "0.9-1.0": { exact: 0, pooled: 0 },
      "0.8-0.9": { exact: 0, pooled: 0 },
      "0.7-0.8": { exact: 0, pooled: 0 },
      "0.6-0.7": { exact: 0, pooled: 0 },
      "0.5-0.6": { exact: 0, pooled: 0 },
      "<0.5": { exact: 0, pooled: 0 },
    };

    confidenceScores.forEach((log) => {
      const conf = log.confidence || 0;
      const bucket = conf >= 0.9 ? "0.9-1.0" :
                     conf >= 0.8 ? "0.8-0.9" :
                     conf >= 0.7 ? "0.7-0.8" :
                     conf >= 0.6 ? "0.6-0.7" :
                     conf >= 0.5 ? "0.5-0.6" : "<0.5";
      if (log.matchType === "exact" || log.matchType === "pooled") {
        confidenceDistribution[bucket][log.matchType as "exact" | "pooled"]++;
      }
    });

    // Template coverage analysis
    const allIntents = await db.generationLog.findMany({
      where: {
        createdAt: { gte: startOfMonth },
      },
      select: {
        userIntent: true,
        matchType: true,
      },
      take: 1000, // Sample for analysis
    });

    const intentCoverage = {
      matched: allIntents.filter(i => i.matchType !== "generated").length,
      unmatched: allIntents.filter(i => i.matchType === "generated").length,
    };
    const coveragePercent = allIntents.length > 0 
      ? (intentCoverage.matched / allIntents.length) * 100 
      : 0;

    const matchTypeStats = {
      exact: { count: 0, cost: 0 },
      pooled: { count: 0, cost: 0 },
      generated: { count: 0, cost: 0 },
    };

    costBreakdown.forEach((item) => {
      const type = item.matchType as keyof typeof matchTypeStats;
      if (matchTypeStats[type]) {
        matchTypeStats[type].count = item._count;
        matchTypeStats[type].cost = item._sum.apiCost || 0;
      }
    });

    const totalSessions = matchTypeStats.exact.count + matchTypeStats.pooled.count + matchTypeStats.generated.count;
    const totalCost = matchTypeStats.exact.cost + matchTypeStats.pooled.cost + matchTypeStats.generated.cost;

    // Calculate percentages
    const exactPercent = totalSessions > 0 ? (matchTypeStats.exact.count / totalSessions) * 100 : 0;
    const pooledPercent = totalSessions > 0 ? (matchTypeStats.pooled.count / totalSessions) * 100 : 0;
    const generatedPercent = totalSessions > 0 ? (matchTypeStats.generated.count / totalSessions) * 100 : 0;

    // Projected monthly cost (extrapolate from current)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const projectedMonthlyCost = daysElapsed > 0 ? (apiCostThisMonth / daysElapsed) * daysInMonth : 0;

    // Savings vs full generation (if all were generated at $0.21 each)
    const fullGenCost = totalSessions * 0.21;
    const savings = fullGenCost - totalCost;
    const savingsPercent = fullGenCost > 0 ? (savings / fullGenCost) * 100 : 0;

    // Affirmation library stats (run in parallel)
    const [totalAffirmations, affirmationsByGoal, totalTemplates] = await Promise.all([
      db.affirmationLine.count(),
      db.affirmationLine.groupBy({
        by: ["goal"],
        _count: true,
        _avg: {
          userRating: true,
        },
      }),
      db.sessionTemplate.count(),
    ]);

    // Coverage calculation (percentage of sessions that matched)
    const matchedSessions = matchTypeStats.exact.count + matchTypeStats.pooled.count;
    const coverage = totalSessions > 0 ? (matchedSessions / totalSessions) * 100 : 0;

    // Low-rated affirmations (< 3.0)
    const lowRatedAffirmations = await db.affirmationLine.count({
      where: {
        userRating: { lt: 3.0 },
      },
    });

    // Quality metrics by match type (run in parallel)
    const [qualityByMatchType, replayStats, completionStats] = await Promise.all([
      db.generationLog.groupBy({
        by: ["matchType"],
        where: {
          wasRated: true,
          userRating: { not: null },
        },
        _avg: {
          userRating: true,
        },
        _count: {
          wasRated: true,
        },
      }),
      db.generationLog.groupBy({
        by: ["matchType"],
        where: {
          wasReplayed: true,
        },
        _count: {
          wasReplayed: true,
        },
      }),
      db.generationLog.groupBy({
        by: ["matchType"],
        _count: true,
      }),
    ]);

    const qualityMetrics: Record<string, {
      rating: number;
      replayPercent: number;
      completePercent: number;
    }> = {};

    ["exact", "pooled", "generated"].forEach((type) => {
      const quality = qualityByMatchType.find((q) => q.matchType === type);
      const replay = replayStats.find((r) => r.matchType === type);
      const complete = completionStats.find((c) => c.matchType === type);
      const total = matchTypeStats[type as keyof typeof matchTypeStats].count;

      qualityMetrics[type] = {
        rating: quality?._avg.userRating || 0,
        replayPercent: total > 0 ? ((replay?._count.wasReplayed || 0) / total) * 100 : 0,
        completePercent: total > 0 ? ((complete?._count || 0) / total) * 100 : 0,
      };
    });

    // User metrics (run in parallel)
    const [totalUsers, usersByTier] = await Promise.all([
      db.user.count(),
      db.userSubscription.groupBy({
        by: ["tier"],
        _count: true,
      }),
    ]);

    const freeUsers = usersByTier.find((u) => u.tier === "free")?._count || 0;
    const proUsers = usersByTier.find((u) => u.tier === "pro")?._count || 0;

    // Conversion rate (users who upgraded to pro)
    const conversionRate = totalUsers > 0 ? (proUsers / totalUsers) * 100 : 0;

    // MRR (Monthly Recurring Revenue)
    const mrr = proUsers * PRO_MONTHLY_PRICE;

    // Recent activity (last 20 generations)
    const recentActivity = await db.generationLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        goal: true,
        matchType: true,
        createdAt: true,
      },
    });

    // Alerts
    const alerts: Array<{ type: "warning" | "info" | "success"; message: string }> = [];

    // Critical: Error rate alert
    if (errorRate > 0.02) {
      alerts.push({
        type: "warning",
        message: `🚨 CRITICAL: Error rate is ${(errorRate * 100).toFixed(2)}% (target: <0.5%) - Investigate immediately`,
      });
    } else if (errorRate > 0.005) {
      alerts.push({
        type: "warning",
        message: `⚠️ Error rate is ${(errorRate * 100).toFixed(2)}% - Monitor closely`,
      });
    }

    if (lowRatedAffirmations > 0) {
      alerts.push({
        type: "warning",
        message: `${lowRatedAffirmations} affirmations rated <3.0 - Review needed`,
      });
    }

    // Check for unmatched intents (intents that resulted in generated sessions)
    const unmatchedIntents = await db.generationLog.findMany({
      where: {
        matchType: "generated",
        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      select: {
        userIntent: true,
      },
      take: 100,
    });

    // Group by intent to find frequently unmatched ones
    const intentCounts = new Map<string, number>();
    unmatchedIntents.forEach((log) => {
      const count = intentCounts.get(log.userIntent) || 0;
      intentCounts.set(log.userIntent, count + 1);
    });

    const frequentUnmatched = Array.from(intentCounts.entries())
      .filter(([_, count]) => count >= 5)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3);

    frequentUnmatched.forEach(([intent, count]) => {
      alerts.push({
        type: "info",
        message: `"${intent.substring(0, 30)}..." unmatched ${count}x → Create template`,
      });
    });

    // Cost trend (check if costs are up)
    const costsLastWeek = await db.generationLog.aggregate({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: {
        apiCost: true,
      },
    });

    const costsThisWeek = await db.generationLog.aggregate({
      where: {
        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
      _sum: {
        apiCost: true,
      },
    });

    const costLastWeek = costsLastWeek._sum.apiCost || 0;
    const costThisWeek = costsThisWeek._sum.apiCost || 0;
    const costChangeWeek = costLastWeek > 0 ? ((costThisWeek - costLastWeek) / costLastWeek) * 100 : 0;

    if (costChangeWeek > 15) {
      alerts.push({
        type: "warning",
        message: `API costs up ${costChangeWeek.toFixed(0)}% this week - Investigate`,
      });
    }

    // Success alert for high pooling rate
    if (pooledPercent > 80) {
      alerts.push({
        type: "success",
        message: `New high: ${pooledPercent.toFixed(0)}% pooling rate achieved!`,
      });
    }

    // Get yesterday's stats for comparison
    const yesterdayStart = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(startOfToday);
    
    const [
      sessionsYesterday,
      costsYesterday,
      revenueYesterday,
      activeUsersYesterday,
    ] = await Promise.all([
      db.affirmationSession.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
      }),
      db.generationLog.aggregate({
        where: {
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
        _sum: { apiCost: true },
      }),
      Promise.resolve(revenueYesterdayAmount), // Already calculated
      db.user.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
      }),
    ]);

    const apiCostYesterday = costsYesterday._sum.apiCost || 0;
    const costChange = apiCostYesterday > 0 
      ? ((apiCostToday - apiCostYesterday) / apiCostYesterday) * 100 
      : apiCostToday > 0 ? 100 : 0;
    const sessionsChange = sessionsYesterday > 0
      ? ((sessions24h - sessionsYesterday) / sessionsYesterday) * 100
      : sessions24h > 0 ? 100 : 0;
    const usersChange = activeUsersYesterday > 0
      ? ((activeUsers24h - activeUsersYesterday) / activeUsersYesterday) * 100
      : activeUsers24h > 0 ? 100 : 0;

    // Get error rate from yesterday for comparison
    const yesterdayErrors = metrics.getMetrics("api.error.count", yesterdayStart.getTime());
    const yesterdayRequests = metrics.getMetrics("api.request.count", yesterdayStart.getTime());
    const yesterdayErrorCount = yesterdayErrors.length;
    const yesterdayRequestCount = yesterdayRequests.length;
    const errorRateYesterday = yesterdayRequestCount > 0 
      ? yesterdayErrorCount / yesterdayRequestCount 
      : 0;
    const errorRateChange = errorRateYesterday > 0
      ? ((errorRate - errorRateYesterday) / errorRateYesterday) * 100
      : errorRate > 0 ? 100 : 0;

    return c.json({
      realTimeStats: {
        activeUsers: activeUsers24h,
        activeUsersChange: usersChange,
        revenueToday: revenueTodayAmount,
        revenueChange: revenueChange,
        sessionsGenerated: sessions24h,
        sessionsChange: sessionsChange,
        apiCostToday: apiCostToday,
        apiCostChange: costChange,
        errorRate: errorRate,
        errorRateChange: errorRateChange,
        errorBreakdown: errorBreakdown,
        recentErrors: recentErrors,
        avgRating: avgRating,
      },
      costBreakdown: {
        matchTypeDistribution: {
          exact: {
            percent: exactPercent,
            count: matchTypeStats.exact.count,
            cost: matchTypeStats.exact.cost,
          },
          pooled: {
            percent: pooledPercent,
            count: matchTypeStats.pooled.count,
            cost: matchTypeStats.pooled.cost,
          },
          generated: {
            percent: generatedPercent,
            count: matchTypeStats.generated.count,
            cost: matchTypeStats.generated.cost,
          },
        },
        totalSpent: apiCostThisMonth,
        projectedMonthly: projectedMonthlyCost,
        savings: savings,
        savingsPercent: savingsPercent,
        poolingTrend: pooledPercent, // Can compare with previous week
        confidenceDistribution: confidenceDistribution,
        templateCoverage: {
          matched: intentCoverage.matched,
          unmatched: intentCoverage.unmatched,
          coveragePercent: coveragePercent,
        },
      },
      libraryHealth: {
        totalAffirmations: totalAffirmations,
        affirmationsByGoal: affirmationsByGoal.map((a) => ({
          goal: a.goal,
          count: a._count,
          avgRating: a._avg.userRating || 0,
        })),
        totalTemplates: totalTemplates,
        coverage: coverage,
        lowRatedCount: lowRatedAffirmations,
      },
      qualityMetrics: qualityMetrics,
      userMetrics: {
        totalUsers: totalUsers,
        freeUsers: freeUsers,
        proUsers: proUsers,
        conversionRate: conversionRate,
        mrr: mrr,
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        userId: a.userId?.substring(0, 8) || "anonymous",
        goal: a.goal,
        matchType: a.matchType,
        createdAt: a.createdAt.toISOString(),
      })),
      alerts: alerts,
    });
  } catch (error) {
    logger.error("Failed to fetch admin dashboard data", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to fetch dashboard data",
      },
      500
    );
  }
});

/**
 * GET /api/admin/error-trend
 * Get error rate trend data for graphing
 */
adminRouter.get("/error-trend", async (c) => {
  try {
    const days = parseInt(c.req.query("days") || "7");
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);
    
    // Get all error and request metrics in the time range
    const errors = metrics.getMetrics("api.error.count", startTime);
    const requests = metrics.getMetrics("api.request.count", startTime);
    
    // Group by hour (or day if >7 days)
    const bucketSize = days > 7 ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 1 day or 1 hour
    const buckets: Record<number, { errors: number; requests: number }> = {};
    
    // Initialize buckets
    const numBuckets = Math.ceil((now - startTime) / bucketSize);
    for (let i = 0; i < numBuckets; i++) {
      const bucketTime = startTime + (i * bucketSize);
      buckets[bucketTime] = { errors: 0, requests: 0 };
    }
    
    // Count errors and requests per bucket
    errors.forEach((error) => {
      const bucketTime = Math.floor(error.timestamp / bucketSize) * bucketSize;
      if (buckets[bucketTime]) {
        buckets[bucketTime].errors++;
      }
    });
    
    requests.forEach((request) => {
      const bucketTime = Math.floor(request.timestamp / bucketSize) * bucketSize;
      if (buckets[bucketTime]) {
        buckets[bucketTime].requests++;
      }
    });
    
    // Calculate error rates and format for chart
    const trendData = Object.entries(buckets)
      .map(([timeStr, data]) => {
        const time = parseInt(timeStr);
        const errorRate = data.requests > 0 ? (data.errors / data.requests) * 100 : 0;
        return {
          time,
          timestamp: time,
          errorRate,
          errors: data.errors,
          requests: data.requests,
        };
      })
      .sort((a, b) => a.time - b.time);
    
    return c.json({ trendData, bucketSize: bucketSize / (60 * 60 * 1000) }); // Return bucket size in hours
  } catch (error) {
    logger.error("Failed to fetch error trend", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch error trend" }, 500);
  }
});

/**
 * GET /api/admin/export
 * Export analytics data as CSV
 */
const exportRequestSchema = z.object({
  type: z.enum(["sessions", "costs", "users", "affirmations", "templates"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(),
});

adminRouter.get("/export", zValidator("query", exportRequestSchema), async (c) => {
  const { type = "sessions", startDate, endDate } = c.req.valid("query");

  try {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let csv = "";

    if (type === "sessions") {
      const sessions = await db.generationLog.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        select: {
          id: true,
          userId: true,
          goal: true,
          matchType: true,
          apiCost: true,
          userRating: true,
          wasReplayed: true,
          createdAt: true,
        },
      });

      csv = "ID,User ID,Goal,Match Type,Cost,Rating,Replayed,Created At\n";
      sessions.forEach((s) => {
        csv += `${s.id},${s.userId || "anonymous"},${s.goal},${s.matchType},${s.apiCost},${s.userRating || ""},${s.wasReplayed},${s.createdAt.toISOString()}\n`;
      });
    } else if (type === "costs") {
      const costs = await db.generationLog.groupBy({
        by: ["matchType", "goal"],
        where: {
          createdAt: { gte: start, lte: end },
        },
        _sum: {
          apiCost: true,
        },
        _count: true,
      });

      csv = "Match Type,Goal,Count,Total Cost,Avg Cost\n";
      costs.forEach((c) => {
        const avgCost = c._count > 0 ? (c._sum.apiCost || 0) / c._count : 0;
        csv += `${c.matchType},${c.goal},${c._count},${c._sum.apiCost || 0},${avgCost}\n`;
      });
    } else if (type === "users") {
      const users = await db.user.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
        include: {
          subscription: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          subscription: {
            select: {
              tier: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      csv = "ID,Email,Name,Tier,Status,Joined At\n";
      users.forEach((u) => {
        csv += `${u.id},${u.email || ""},${u.name || ""},${u.subscription?.tier || "free"},${u.subscription?.status || "active"},${u.createdAt.toISOString()}\n`;
      });
    } else if (type === "affirmations") {
      const { goal } = c.req.valid("query");
      const where: any = {};
      if (goal) where.goal = goal;

      const affirmations = await db.affirmationLine.findMany({
        where,
        orderBy: { useCount: "desc" },
      });

      csv = "ID,Text,Goal,Emotion,Tags,Use Count,Rating,Created At\n";
      affirmations.forEach((a) => {
        csv += `${a.id},"${a.text.replace(/"/g, '""')}",${a.goal},${a.emotion || ""},"${(a.tags || []).join("; ")}",${a.useCount || 0},${a.userRating || ""},${a.createdAt.toISOString()}\n`;
      });
    } else if (type === "templates") {
      const templates = await db.sessionTemplate.findMany({
        orderBy: { useCount: "desc" },
      });

      csv = "ID,Title,Goal,Intent,Keywords,Affirmation IDs,Use Count,Rating,Is Default,Created At\n";
      templates.forEach((t) => {
        csv += `${t.id},"${t.title.replace(/"/g, '""')}",${t.goal},"${t.intent.replace(/"/g, '""')}","${t.intentKeywords.join("; ")}","${t.affirmationIds.join("; ")}",${t.useCount || 0},${t.userRating || ""},${t.isDefault},${t.createdAt.toISOString()}\n`;
      });
    }

    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", `attachment; filename="${type}-export-${Date.now()}.csv"`);
    return c.text(csv);
  } catch (error) {
    logger.error("Failed to export data", error);
    return c.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to export data",
      },
      500
    );
  }
});

/**
 * GET /api/admin/affirmations
 * Get all affirmations with filtering and pagination
 */
const getAffirmationsSchema = z.object({
  goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(),
  emotion: z.string().optional(),
  minRating: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["rating", "useCount", "createdAt"]).optional().default("useCount"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
});

adminRouter.get("/affirmations", zValidator("query", getAffirmationsSchema), async (c) => {
  try {
    const { goal, emotion, minRating, search, sortBy, order, page, limit } = c.req.valid("query");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (goal) where.goal = goal;
    if (emotion) where.emotion = emotion;
    if (minRating) where.userRating = { gte: minRating };
    if (search) {
      where.OR = [
        { text: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === "rating") orderBy.userRating = order;
    else if (sortBy === "useCount") orderBy.useCount = order;
    else orderBy.createdAt = order;

    const [affirmations, total] = await Promise.all([
      db.affirmationLine.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.affirmationLine.count({ where }),
    ]);

    return c.json({
      affirmations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch affirmations", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch affirmations" }, 500);
  }
});

/**
 * POST /api/admin/affirmations
 * Create new affirmation
 */
const createAffirmationSchema = z.object({
  text: z.string().min(1),
  goal: z.enum(["sleep", "focus", "calm", "manifest"]),
  tags: z.array(z.string()).optional(),
  emotion: z.string().optional(),
});

adminRouter.post("/affirmations", zValidator("json", createAffirmationSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const affirmation = await db.affirmationLine.create({
      data: {
        text: data.text,
        goal: data.goal,
        tags: data.tags || [],
        emotion: data.emotion || null,
      },
    });
    return c.json(affirmation);
  } catch (error) {
    logger.error("Failed to create affirmation", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to create affirmation" }, 500);
  }
});

/**
 * PATCH /api/admin/affirmations/:id
 * Update affirmation
 */
const updateAffirmationSchema = z.object({
  text: z.string().min(1).optional(),
  goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(),
  tags: z.array(z.string()).optional(),
  emotion: z.string().optional(),
});

adminRouter.patch("/affirmations/:id", zValidator("json", updateAffirmationSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const affirmation = await db.affirmationLine.update({
      where: { id },
      data,
    });
    return c.json(affirmation);
  } catch (error) {
    logger.error("Failed to update affirmation", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to update affirmation" }, 500);
  }
});

/**
 * DELETE /api/admin/affirmations/:id
 * Delete affirmation
 */
adminRouter.delete("/affirmations/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Check if used in templates
    const templates = await db.sessionTemplate.findMany({
      where: {
        affirmationIds: { has: id },
      },
    });

    if (templates.length > 0) {
      return c.json({
        error: "IN_USE",
        message: `Affirmation is used in ${templates.length} template(s)`,
        templates: templates.map((t) => ({ id: t.id, title: t.title })),
      }, 400);
    }

    await db.affirmationLine.delete({
      where: { id },
    });

    return c.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete affirmation", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to delete affirmation" }, 500);
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering
 */
const getUsersSchema = z.object({
  tier: z.enum(["free", "pro"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
});

adminRouter.get("/users", zValidator("query", getUsersSchema), async (c) => {
  try {
    const { tier, search, page, limit } = c.req.valid("query");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (tier) {
      where.subscription = { tier };
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          subscription: true,
          _count: {
            select: {
              affirmationSessions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.user.count({ where }),
    ]);

    // Get last active time and session counts
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const lastSession = await db.affirmationSession.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });

        return {
          ...user,
          lastActive: lastSession?.createdAt || user.createdAt,
          sessionCount: user._count.affirmationSessions,
        };
      })
    );

    return c.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch users", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch users" }, 500);
  }
});

/**
 * GET /api/admin/users/:id
 * Get user details
 */
adminRouter.get("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = await db.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        preferences: true,
      },
    });

    if (!user) {
      return c.json({ error: "NOT_FOUND", message: "User not found" }, 404);
    }

    // Get user stats
    const [sessions, recentSessions, ratings] = await Promise.all([
      db.affirmationSession.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.generationLog.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          goal: true,
          matchType: true,
          userRating: true,
          wasReplayed: true,
          createdAt: true,
        },
      }),
      db.generationLog.aggregate({
        where: {
          userId: id,
          wasRated: true,
          userRating: { not: null },
        },
        _avg: { userRating: true },
        _count: { wasRated: true },
      }),
    ]);

    const favoriteCount = await db.affirmationSession.count({
      where: { userId: id, isFavorite: true },
    });

    const replayCount = await db.generationLog.count({
      where: { userId: id, wasReplayed: true },
    });

    return c.json({
      user,
      stats: {
        totalSessions: sessions.length,
        favoriteCount,
        replayCount,
        avgRating: ratings._avg.userRating || 0,
        ratingCount: ratings._count.wasRated,
      },
      recentSessions,
    });
  } catch (error) {
    logger.error("Failed to fetch user details", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch user details" }, 500);
  }
});

/**
 * PATCH /api/admin/users/:id/tier
 * Update user subscription tier
 */
const updateTierSchema = z.object({
  tier: z.enum(["free", "pro"]),
});

adminRouter.patch("/users/:id/tier", zValidator("json", updateTierSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const { tier } = c.req.valid("json");

    // Get or create subscription
    let subscription = await db.userSubscription.findUnique({
      where: { userId: id },
    });

    if (subscription) {
      subscription = await db.userSubscription.update({
        where: { userId: id },
        data: { tier, status: tier === "pro" ? "active" : "active" },
      });
    } else {
      subscription = await db.userSubscription.create({
        data: {
          userId: id,
          tier,
          status: "active",
        },
      });
    }

    return c.json(subscription);
  } catch (error) {
    logger.error("Failed to update user tier", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to update user tier" }, 500);
  }
});

/**
 * POST /api/admin/users/:id/reset-usage
 * Reset user's monthly usage counter
 */
adminRouter.post("/users/:id/reset-usage", async (c) => {
  try {
    const id = c.req.param("id");
    const subscription = await db.userSubscription.findUnique({
      where: { userId: id },
    });

    if (!subscription) {
      return c.json({ error: "NOT_FOUND", message: "User subscription not found" }, 404);
    }

    const updated = await db.userSubscription.update({
      where: { userId: id },
      data: {
        customSessionsUsedThisMonth: 0,
        lastResetDate: new Date(),
      },
    });

    return c.json(updated);
  } catch (error) {
    logger.error("Failed to reset user usage", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to reset user usage" }, 500);
  }
});

/**
 * GET /api/admin/templates
 * Get all session templates
 */
adminRouter.get("/templates", async (c) => {
  try {
    const templates = await db.sessionTemplate.findMany({
      orderBy: { useCount: "desc" },
    });

    // Get usage stats from generation logs
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const usage = await db.generationLog.count({
          where: { templateId: template.id },
        });

        const ratings = await db.generationLog.aggregate({
          where: {
            templateId: template.id,
            wasRated: true,
            userRating: { not: null },
          },
          _avg: { userRating: true },
        });

        // Get affirmation details
        const affirmations = await Promise.all(
          template.affirmationIds.map(async (id) => {
            try {
              return await db.affirmationLine.findUnique({
                where: { id },
                select: { id: true, text: true, goal: true },
              });
            } catch {
              return { id, text: `[Affirmation ${id} not found]` };
            }
          })
        );

        return {
          ...template,
          actualUseCount: usage,
          avgRating: ratings._avg.userRating || 0,
          affirmations,
        };
      })
    );

    return c.json({ templates: templatesWithStats });
  } catch (error) {
    logger.error("Failed to fetch templates", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch templates" }, 500);
  }
});

/**
 * POST /api/admin/templates
 * Create new session template
 */
const createTemplateSchema = z.object({
  title: z.string().min(1),
  goal: z.enum(["sleep", "focus", "calm", "manifest"]),
  intent: z.string().min(1),
  intentKeywords: z.array(z.string()),
  affirmationIds: z.array(z.string()),
  binauralCategory: z.string().optional(),
  binauralHz: z.string().optional(),
  lengthSec: z.number().int().positive(),
  isDefault: z.boolean().optional().default(false),
});

adminRouter.post("/templates", zValidator("json", createTemplateSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const template = await db.sessionTemplate.create({
      data,
    });
    return c.json(template);
  } catch (error) {
    logger.error("Failed to create template", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to create template" }, 500);
  }
});

/**
 * PATCH /api/admin/templates/:id
 * Update session template
 */
const updateTemplateSchema = z.object({
  title: z.string().min(1).optional(),
  goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(),
  intent: z.string().min(1).optional(),
  intentKeywords: z.array(z.string()).optional(),
  affirmationIds: z.array(z.string()).optional(),
  binauralCategory: z.string().optional().nullable(),
  binauralHz: z.string().optional().nullable(),
  lengthSec: z.number().int().positive().optional(),
  isDefault: z.boolean().optional(),
});

adminRouter.patch("/templates/:id", zValidator("json", updateTemplateSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const template = await db.sessionTemplate.update({
      where: { id },
      data,
    });
    return c.json(template);
  } catch (error) {
    logger.error("Failed to update template", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to update template" }, 500);
  }
});

/**
 * DELETE /api/admin/templates/:id
 * Delete session template
 */
adminRouter.delete("/templates/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const template = await db.sessionTemplate.findUnique({
      where: { id },
    });

    if (template?.isDefault) {
      return c.json({
        error: "CANNOT_DELETE",
        message: "Cannot delete default templates",
      }, 400);
    }

    await db.sessionTemplate.delete({
      where: { id },
    });

    return c.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete template", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to delete template" }, 500);
  }
});

/**
 * GET /api/admin/default-sessions
 * Get default sessions (from code, not database)
 */
adminRouter.get("/default-sessions", async (c) => {
  try {
    // Import DEFAULT_SESSIONS from sessions.ts
    const { DEFAULT_SESSIONS } = await import("./sessions");
    return c.json({ sessions: DEFAULT_SESSIONS });
  } catch (error) {
    logger.error("Failed to fetch default sessions", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch default sessions" }, 500);
  }
});

/**
 * GET /api/admin/config
 * Get system configuration
 */
adminRouter.get("/config", async (c) => {
  try {
    const { loadConfig } = await import("../lib/configStorage");
    const config = await loadConfig();

    // Return config with static voice/binaural settings
    return c.json({
      ...config,
      voices: {
        neutral: {
          voiceId: "ZqvIIuD5aI9JFejebHiH",
          stability: 0.50,
          similarity: 0.75,
          tier: "free",
        },
        confident: {
          voiceId: "xGDJhCwcqw94ypljc95Z",
          stability: 0.60,
          similarity: 0.80,
          tier: "free",
        },
        premium1: {
          voiceId: "qxTFXDYbGcR8GaHSjczg",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
        premium2: {
          voiceId: "BpjGufoPiobT79j2vtj4",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
        premium3: {
          voiceId: "eUdJpUEN3EslrgE24PKx",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
        premium4: {
          voiceId: "7JxUWWyYwXK8kmqmKEnT",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
        premium5: {
          voiceId: "wdymxIQkYn7MJCYCQF2Q",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
        premium6: {
          voiceId: "zA6D7RyKdc2EClouEMkP",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
        premium7: {
          voiceId: "KGZeK6FsnWQdrkDHnDNA",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
        premium8: {
          voiceId: "wgHvco1wiREKN0BdyVx5",
          stability: 0.50,
          similarity: 0.75,
          tier: "pro",
        },
      },
      binaural: {
        delta: { hz: "0.5-4", description: "Sleep, deep rest" },
        theta: { hz: "4-8", description: "Meditation, creativity" },
        alpha: { hz: "8-14", description: "Relaxation, light focus" },
        beta: { hz: "14-30", description: "Alert, focused, productive" },
        gamma: { hz: "30-100", description: "Peak performance, insight" },
      },
    });
  } catch (error) {
    logger.error("Failed to fetch config", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch config" }, 500);
  }
});

/**
 * PATCH /api/admin/config
 * Update system configuration
 */
const updateConfigSchema = z.object({
  matching: z.object({
    exactMatchThreshold: z.number().min(0).max(1).optional(),
    pooledMatchThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
  costs: z.object({
    dailyAlert: z.number().positive().optional(),
    monthlyBudget: z.number().positive().optional(),
    maxCostPerSession: z.number().positive().optional(),
  }).optional(),
  generation: z.object({
    alwaysGenerateFirst: z.boolean().optional(),
    proUserGenerationRate: z.number().min(0).max(1).optional(),
    freeUserGenerationRate: z.number().min(0).max(1).optional(),
  }).optional(),
});

adminRouter.patch("/config", zValidator("json", updateConfigSchema), async (c) => {
  try {
    const { saveConfig } = await import("../lib/configStorage");
    const data = c.req.valid("json");
    const updated = await saveConfig(data);
    logger.info("Config updated", { data });
    return c.json({ success: true, config: updated });
  } catch (error) {
    logger.error("Failed to update config", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to update config" }, 500);
  }
});

/**
 * POST /api/admin/voice/test
 * Test voice generation with sample text
 */
const testVoiceSchema = z.object({
  voice: z.enum(["neutral", "confident", "premium1", "premium2", "premium3", "premium4", "premium5", "premium6", "premium7", "premium8"]),
  text: z.string().min(1).max(500).optional().default("I am calm, centered, and at peace."),
});

adminRouter.post("/voice/test", zValidator("json", testVoiceSchema), async (c) => {
  try {
    const { voice, text } = c.req.valid("json");
    
    // Import TTS generation logic
    const { generateTTS } = await import("../utils/ttsCache");
    const { env } = await import("../env");
    
    const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return c.json({ error: "ELEVENLABS_API_KEY not configured" }, 500);
    }

    const VOICE_IDS: Record<string, string> = {
      neutral: "ZqvIIuD5aI9JFejebHiH",
      confident: "xGDJhCwcqw94ypljc95Z",
      premium1: "qxTFXDYbGcR8GaHSjczg",
      premium2: "BpjGufoPiobT79j2vtj4",
      premium3: "eUdJpUEN3EslrgE24PKx",
      premium4: "7JxUWWyYwXK8kmqmKEnT",
      premium5: "wdymxIQkYn7MJCYCQF2Q",
      premium6: "zA6D7RyKdc2EClouEMkP",
      premium7: "KGZeK6FsnWQdrkDHnDNA",
      premium8: "wgHvco1wiREKN0BdyVx5",
    };

    const voiceId = VOICE_IDS[voice];
    if (!voiceId) {
      return c.json({ error: "Invalid voice" }, 400);
    }

    // Generate TTS
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("ElevenLabs API error", { status: response.status, error });
      return c.json({ error: "Failed to generate audio", details: error }, 500);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return c.json({
      success: true,
      voice,
      text,
      audioBase64: base64Audio,
      audioFormat: "audio/mpeg",
      size: audioBuffer.byteLength,
    });
  } catch (error) {
    logger.error("Failed to test voice", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to test voice" }, 500);
  }
});

/**
 * POST /api/admin/affirmations/bulk-delete
 * Bulk delete affirmations
 */
const bulkDeleteAffirmationsSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

adminRouter.post("/affirmations/bulk-delete", zValidator("json", bulkDeleteAffirmationsSchema), async (c) => {
  try {
    const { ids } = c.req.valid("json");

    // Check which affirmations are used in templates
    const templates = await db.sessionTemplate.findMany({
      where: {
        affirmationIds: { hasSome: ids },
      },
    });

    const usedIds = new Set<string>();
    templates.forEach(template => {
      template.affirmationIds.forEach(id => {
        if (ids.includes(id)) {
          usedIds.add(id);
        }
      });
    });

    if (usedIds.size > 0) {
      return c.json({
        error: "IN_USE",
        message: `${usedIds.size} affirmation(s) are used in templates`,
        usedIds: Array.from(usedIds),
        templates: templates.map(t => ({ id: t.id, title: t.title })),
      }, 400);
    }

    // Delete affirmations
    const result = await db.affirmationLine.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    logger.info("Bulk deleted affirmations", { count: result.count });
    return c.json({ success: true, deleted: result.count });
  } catch (error) {
    logger.error("Failed to bulk delete affirmations", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to bulk delete" }, 500);
  }
});

/**
 * POST /api/admin/affirmations/bulk-update
 * Bulk update affirmations (e.g., change goal, add tags)
 */
const bulkUpdateAffirmationsSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  updates: z.object({
    goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(),
    tags: z.array(z.string()).optional(),
    emotion: z.string().optional().nullable(),
  }),
});

adminRouter.post("/affirmations/bulk-update", zValidator("json", bulkUpdateAffirmationsSchema), async (c) => {
  try {
    const { ids, updates } = c.req.valid("json");

    // If tags are being updated, we need to merge with existing tags
    if (updates.tags) {
      // Fetch current affirmations to get existing tags
      const affirmations = await db.affirmationLine.findMany({
        where: { id: { in: ids } },
        select: { id: true, tags: true },
      });

      // Update each affirmation individually to merge tags
      await Promise.all(
        affirmations.map(async (aff) => {
          const existingTags = aff.tags || [];
          const newTags = Array.from(new Set([...existingTags, ...updates.tags!]));
          await db.affirmationLine.update({
            where: { id: aff.id },
            data: { ...updates, tags: newTags },
          });
        })
      );

      logger.info("Bulk updated affirmations with tag merge", { count: affirmations.length });
      return c.json({ success: true, updated: affirmations.length });
    }

    // For other updates, use updateMany
    const result = await db.affirmationLine.updateMany({
      where: {
        id: { in: ids },
      },
      data: updates,
    });

    logger.info("Bulk updated affirmations", { count: result.count });
    return c.json({ success: true, updated: result.count });
  } catch (error) {
    logger.error("Failed to bulk update affirmations", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to bulk update" }, 500);
  }
});

/**
 * POST /api/admin/affirmations/bulk-regenerate-audio
 * Invalidate TTS cache for selected affirmations (forces regeneration on next use)
 */
const bulkRegenerateAudioSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

adminRouter.post("/affirmations/bulk-regenerate-audio", zValidator("json", bulkRegenerateAudioSchema), async (c) => {
  try {
    const { ids } = c.req.valid("json");

    // Note: TTS is cached per session, not per affirmation
    // This endpoint invalidates cache entries that contain these affirmations
    // In a production system, you'd want to track which cache keys contain which affirmations
    
    // For now, we'll delete all cache entries (simple but effective)
    // In production, you'd want a more sophisticated cache invalidation strategy
    const { deleteAllCache } = await import("../utils/ttsCache");
    
    try {
      await deleteAllCache();
      logger.info("Invalidated TTS cache for bulk regenerate", { affirmationIds: ids });
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache, but continuing", cacheError);
    }

    return c.json({ 
      success: true, 
      message: `Cache invalidated for ${ids.length} affirmation(s). Audio will regenerate on next use.`,
      invalidated: ids.length,
    });
  } catch (error) {
    logger.error("Failed to bulk regenerate audio", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to regenerate audio" }, 500);
  }
});

/**
 * POST /api/admin/templates/bulk-delete
 * Bulk delete templates
 */
const bulkDeleteTemplatesSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

adminRouter.post("/templates/bulk-delete", zValidator("json", bulkDeleteTemplatesSchema), async (c) => {
  try {
    const { ids } = c.req.valid("json");

    // Check for default templates
    const templates = await db.sessionTemplate.findMany({
      where: {
        id: { in: ids },
      },
    });

    const defaultTemplates = templates.filter(t => t.isDefault);
    if (defaultTemplates.length > 0) {
      return c.json({
        error: "CANNOT_DELETE",
        message: "Cannot delete default templates",
        defaultIds: defaultTemplates.map(t => t.id),
      }, 400);
    }

    // Delete templates
    const result = await db.sessionTemplate.deleteMany({
      where: {
        id: { in: ids },
        isDefault: false,
      },
    });

    logger.info("Bulk deleted templates", { count: result.count });
    return c.json({ success: true, deleted: result.count });
  } catch (error) {
    logger.error("Failed to bulk delete templates", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to bulk delete" }, 500);
  }
});

/**
 * GET /api/admin/logs
 * Get generation logs with filtering
 */
const getLogsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  goal: z.enum(["sleep", "focus", "calm", "manifest"]).optional(),
  matchType: z.enum(["exact", "pooled", "generated"]).optional(),
  userId: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(100),
});

adminRouter.get("/logs", zValidator("query", getLogsSchema), async (c) => {
  try {
    const { startDate, endDate, goal, matchType, userId, page, limit } = c.req.valid("query");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (goal) where.goal = goal;
    if (matchType) where.matchType = matchType;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      db.generationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          // Include user email if available
        },
      }),
      db.generationLog.count({ where }),
    ]);

    // Get user emails for logs
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        if (!log.userId) {
          return { ...log, userEmail: null };
        }
        const user = await db.user.findUnique({
          where: { id: log.userId },
          select: { email: true },
        });
        return { ...log, userEmail: user?.email || null };
      })
    );

    return c.json({
      logs: logsWithUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch logs", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch logs" }, 500);
  }
});

/**
 * GET /api/admin/logs/:id
 * Get detailed log entry
 */
adminRouter.get("/logs/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const log = await db.generationLog.findUnique({
      where: { id },
    });

    if (!log) {
      return c.json({ error: "NOT_FOUND", message: "Log not found" }, 404);
    }

    // Get user info if available
    let user = null;
    if (log.userId) {
      user = await db.user.findUnique({
        where: { id: log.userId },
        select: { id: true, email: true, name: true },
      });
    }

    // Get template info if exact match
    let template = null;
    if (log.templateId) {
      template = await db.sessionTemplate.findUnique({
        where: { id: log.templateId },
      });
    }

    // Get affirmation details if pooled
    let affirmations = null;
    if (log.affirmationsUsed && log.affirmationsUsed.length > 0) {
      if (log.matchType === "pooled") {
        // Try to fetch affirmation details (if IDs are stored)
        affirmations = await Promise.all(
          log.affirmationsUsed.map(async (id) => {
            try {
              return await db.affirmationLine.findUnique({
                where: { id },
                select: { id: true, text: true, goal: true },
              });
            } catch {
              return { id, text: id }; // Fallback if not found
            }
          })
        );
      }
    }

    return c.json({
      log,
      user,
      template,
      affirmations,
    });
  } catch (error) {
    logger.error("Failed to fetch log details", error);
    return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch log details" }, 500);
  }
});

export { adminRouter };

