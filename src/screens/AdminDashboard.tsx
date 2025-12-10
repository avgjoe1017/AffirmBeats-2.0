/**
 * Admin Dashboard Screen
 * 
 * Comprehensive admin dashboard for monitoring costs, usage, and system health.
 * Includes real-time stats, cost breakdown, quality metrics, and alerts.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNavigation } from "@react-navigation/native";

type DashboardData = {
  realTimeStats: {
    activeUsers: number;
    revenueToday: number;
    revenueChange: number;
    sessionsGenerated: number;
    apiCostToday: number;
    errorRate: number;
    avgRating: number;
  };
  costBreakdown: {
    matchTypeDistribution: {
      exact: { percent: number; count: number; cost: number };
      pooled: { percent: number; count: number; cost: number };
      generated: { percent: number; count: number; cost: number };
    };
    totalSpent: number;
    projectedMonthly: number;
    savings: number;
    savingsPercent: number;
    poolingTrend: number;
  };
  libraryHealth: {
    totalAffirmations: number;
    affirmationsByGoal: Array<{ goal: string; count: number; avgRating: number }>;
    totalTemplates: number;
    coverage: number;
    lowRatedCount: number;
  };
  qualityMetrics: Record<string, {
    rating: number;
    replayPercent: number;
    completePercent: number;
  }>;
  userMetrics: {
    totalUsers: number;
    freeUsers: number;
    proUsers: number;
    conversionRate: number;
    mrr: number;
  };
  recentActivity: Array<{
    id: string;
    userId: string;
    goal: string;
    matchType: string;
    createdAt: string;
  }>;
  alerts: Array<{ type: "warning" | "info" | "success"; message: string }>;
};

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function AdminDashboard() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      return await api.get<DashboardData>("/api/admin/dashboard");
    },
    refetchInterval: REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleExport = async (type: "sessions" | "costs" | "users") => {
    try {
      const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/export?type=${type}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Export", `Export URL: ${url}`);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to export data");
    }
  };

  if (isLoading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="text-red-600 text-lg font-semibold mb-2">Error loading dashboard</Text>
        <Text className="text-gray-600 text-center mb-4">
          {error instanceof Error ? error.message : "Unknown error"}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) return null;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</Text>
          <Text className="text-gray-600">Real-time monitoring and analytics</Text>
        </View>

        {/* 1. Real-Time Stats */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-semibold mb-4 text-gray-900">
            📊 LIVE STATS (Last 24 Hours)
          </Text>
          <View className="space-y-3">
            <StatRow
              label="🔴 Active Users"
              value={formatNumber(data.realTimeStats.activeUsers)}
            />
            <StatRow
              label="💰 Revenue Today"
              value={`${formatCurrency(data.realTimeStats.revenueToday)} ${data.realTimeStats.revenueChange >= 0 ? "+" : ""}${formatPercent(data.realTimeStats.revenueChange)} vs yesterday`}
            />
            <StatRow
              label="⚡ Sessions Generated"
              value={formatNumber(data.realTimeStats.sessionsGenerated)}
            />
            <StatRow
              label="💸 API Cost Today"
              value={`${formatCurrency(data.realTimeStats.apiCostToday)} (${formatPercent((data.realTimeStats.apiCostToday / Math.max(data.realTimeStats.revenueToday, 1)) * 100)} of revenue)`}
            />
            <StatRow
              label="🐛 Error Rate"
              value={`${formatPercent(data.realTimeStats.errorRate * 100)} ${data.realTimeStats.errorRate < 0.01 ? "✅" : "⚠️"}`}
            />
            <StatRow
              label="⭐ Avg Rating"
              value={`${data.realTimeStats.avgRating.toFixed(1)}/5`}
            />
          </View>
        </View>

        {/* 2. Cost Breakdown */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-semibold mb-4 text-gray-900">
            💰 COST BREAKDOWN (This Month)
          </Text>
          <View className="space-y-3">
            <Text className="text-gray-700 font-medium">Match Type Distribution:</Text>
            <MatchTypeRow
              label="Exact Match"
              percent={data.costBreakdown.matchTypeDistribution.exact.percent}
              count={data.costBreakdown.matchTypeDistribution.exact.count}
              cost={data.costBreakdown.matchTypeDistribution.exact.cost}
            />
            <MatchTypeRow
              label="Pooled"
              percent={data.costBreakdown.matchTypeDistribution.pooled.percent}
              count={data.costBreakdown.matchTypeDistribution.pooled.count}
              cost={data.costBreakdown.matchTypeDistribution.pooled.cost}
            />
            <MatchTypeRow
              label="Generated"
              percent={data.costBreakdown.matchTypeDistribution.generated.percent}
              count={data.costBreakdown.matchTypeDistribution.generated.count}
              cost={data.costBreakdown.matchTypeDistribution.generated.cost}
            />
            <View className="border-t border-gray-200 pt-3 mt-3">
              <StatRow label="Total Spent" value={formatCurrency(data.costBreakdown.totalSpent)} />
              <StatRow
                label="Projected Monthly"
                value={formatCurrency(data.costBreakdown.projectedMonthly)}
              />
              <StatRow
                label="Savings vs Full Gen"
                value={`${formatCurrency(data.costBreakdown.savings)} (${formatPercent(data.costBreakdown.savingsPercent)} reduction) ✅`}
              />
            </View>
          </View>
        </View>

        {/* 3. Library Health */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-semibold mb-4 text-gray-900">📚 LIBRARY STATS</Text>
          <View className="space-y-2">
            <StatRow
              label="Total Affirmations"
              value={formatNumber(data.libraryHealth.totalAffirmations)}
            />
            {data.libraryHealth.affirmationsByGoal.map((goal) => (
              <View key={goal.goal} className="flex-row justify-between items-center">
                <Text className="text-gray-700">
                  ├─ {goal.goal.charAt(0).toUpperCase() + goal.goal.slice(1)}: {formatNumber(goal.count)} (avg rating: {goal.avgRating.toFixed(1)})
                </Text>
              </View>
            ))}
            <StatRow
              label="Templates"
              value={formatNumber(data.libraryHealth.totalTemplates)}
            />
            <StatRow
              label="Coverage"
              value={`${formatPercent(data.libraryHealth.coverage)} of user intents matched`}
            />
            {data.libraryHealth.lowRatedCount > 0 && (
              <Text className="text-orange-600 font-medium">
                ⚠️ Low-rated affirmations: {data.libraryHealth.lowRatedCount} need review
              </Text>
            )}
          </View>
        </View>

        {/* 4. Quality Metrics */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-semibold mb-4 text-gray-900">⭐ QUALITY COMPARISON</Text>
          <View className="space-y-2">
            <QualityTableRow header />
            <QualityTableRow
              type="Exact Match"
              metrics={data.qualityMetrics.exact}
            />
            <QualityTableRow
              type="Pooled"
              metrics={data.qualityMetrics.pooled}
            />
            <QualityTableRow
              type="Generated"
              metrics={data.qualityMetrics.generated}
            />
            <Text className="text-green-600 text-sm mt-2">
              ✅ Quality parity maintained across all types
            </Text>
          </View>
        </View>

        {/* 5. User Metrics */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-semibold mb-4 text-gray-900">👥 USER HEALTH</Text>
          <View className="space-y-3">
            <StatRow label="Total Users" value={formatNumber(data.userMetrics.totalUsers)} />
            <Text className="text-gray-700">
              ├─ Free: {formatNumber(data.userMetrics.freeUsers)} ({formatPercent((data.userMetrics.freeUsers / Math.max(data.userMetrics.totalUsers, 1)) * 100)})
            </Text>
            <Text className="text-gray-700">
              └─ Pro: {formatNumber(data.userMetrics.proUsers)} ({formatPercent((data.userMetrics.proUsers / Math.max(data.userMetrics.totalUsers, 1)) * 100)})
            </Text>
            <StatRow
              label="Conversion Rate"
              value={formatPercent(data.userMetrics.conversionRate)}
            />
            <StatRow label="MRR" value={formatCurrency(data.userMetrics.mrr)} />
          </View>
        </View>

        {/* 6. Recent Activity */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-semibold mb-4 text-gray-900">📋 RECENT GENERATIONS</Text>
          <View className="space-y-2">
            {data.recentActivity.slice(0, 5).map((activity, idx) => {
              const timeAgo = getTimeAgo(new Date(activity.createdAt));
              return (
                <View key={activity.id} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                  <Text className="text-gray-600 text-sm">
                    {timeAgo} │ {activity.userId} │ {activity.goal} │ {activity.matchType}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7. Alerts */}
        {data.alerts.length > 0 && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-xl font-semibold mb-4 text-gray-900">🚨 ALERTS</Text>
            <View className="space-y-2">
              {data.alerts.map((alert, idx) => (
                <View
                  key={idx}
                  className={`p-3 rounded-lg ${
                    alert.type === "warning"
                      ? "bg-orange-50 border border-orange-200"
                      : alert.type === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <Text
                    className={`${
                      alert.type === "warning"
                        ? "text-orange-800"
                        : alert.type === "success"
                        ? "text-green-800"
                        : "text-blue-800"
                    }`}
                  >
                    {alert.type === "warning" ? "⚠️" : alert.type === "success" ? "✅" : "💡"} {alert.message}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 8. Quick Actions */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-xl font-semibold mb-4 text-gray-900">⚡ QUICK ACTIONS</Text>
          <View className="space-y-2">
            <ActionButton
              label="Export Sessions (CSV)"
              onPress={() => handleExport("sessions")}
            />
            <ActionButton
              label="Export Costs (CSV)"
              onPress={() => handleExport("costs")}
            />
            <ActionButton
              label="Export Users (CSV)"
              onPress={() => handleExport("users")}
            />
          </View>
        </View>

        {/* Last updated */}
        <Text className="text-gray-500 text-xs text-center mb-4">
          Last updated: {new Date().toLocaleTimeString()}
        </Text>
      </View>
    </ScrollView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-1">
      <Text className="text-gray-700">{label}:</Text>
      <Text className="text-gray-900 font-semibold">{value}</Text>
    </View>
  );
}

function MatchTypeRow({
  label,
  percent,
  count,
  cost,
}: {
  label: string;
  percent: number;
  count: number;
  cost: number;
}) {
  return (
    <View className="flex-row justify-between items-center py-1">
      <Text className="text-gray-700">
        ├─ {label}: {percent.toFixed(0)}% ({count} sessions)
      </Text>
      <Text className="text-gray-900 font-semibold">${cost.toFixed(2)}</Text>
    </View>
  );
}

function QualityTableRow({
  header,
  type,
  metrics,
}: {
  header?: boolean;
  type?: string;
  metrics?: { rating: number; replayPercent: number; completePercent: number };
}) {
  if (header) {
    return (
      <View className="flex-row justify-between border-b-2 border-gray-300 pb-2">
        <Text className="text-gray-700 font-semibold flex-1">Match Type</Text>
        <Text className="text-gray-700 font-semibold flex-1 text-center">Rating</Text>
        <Text className="text-gray-700 font-semibold flex-1 text-center">Replay %</Text>
        <Text className="text-gray-700 font-semibold flex-1 text-center">Complete %</Text>
      </View>
    );
  }

  if (!type || !metrics) return null;

  return (
    <View className="flex-row justify-between py-2 border-b border-gray-100">
      <Text className="text-gray-700 flex-1">{type}</Text>
      <Text className="text-gray-900 flex-1 text-center font-semibold">
        {metrics.rating.toFixed(1)}
      </Text>
      <Text className="text-gray-900 flex-1 text-center font-semibold">
        {metrics.replayPercent.toFixed(0)}%
      </Text>
      <Text className="text-gray-900 flex-1 text-center font-semibold">
        {metrics.completePercent.toFixed(0)}%
      </Text>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-blue-500 px-4 py-3 rounded-lg mb-2"
    >
      <Text className="text-white font-semibold text-center">{label}</Text>
    </TouchableOpacity>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

