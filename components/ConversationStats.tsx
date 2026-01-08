"use client";

import { useState, useEffect } from "react";

interface WeeklyStats {
  date: string;
  minutes: number;
}

interface StatsData {
  totalMinutes: number;
  totalSessions: number;
  uniquePartners: number;
  consecutiveDays: number;
  weeklyStats: WeeklyStats[];
  monthlyMinutes: number;
}

interface ConversationStatsProps {
  userId?: string;
  isLearner?: boolean;
}

export default function ConversationStats({ userId, isLearner = true }: ConversationStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Get day names
  const dayNames = isLearner
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["日", "月", "火", "水", "木", "金", "土"];

  // Calculate this week's total
  const thisWeekMinutes = stats.weeklyStats.reduce((sum, day) => sum + day.minutes, 0);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-xl">📊</span>
          {isLearner ? "Conversation Stats" : "会話実績"}
        </h3>
        {stats.consecutiveDays > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
            <span>🔥</span>
            {isLearner ? `${stats.consecutiveDays} days` : `連続 ${stats.consecutiveDays}日`}
          </div>
        )}
      </div>

      {/* Weekly Chart */}
      <div className="mb-4">
        <div className="flex justify-between items-end gap-1 sm:gap-2 h-24 px-1">
          {stats.weeklyStats.map((day, index) => {
            const maxMinutes = Math.max(...stats.weeklyStats.map(d => d.minutes), 30);
            const height = day.minutes > 0 ? Math.max((day.minutes / maxMinutes) * 100, 10) : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                {/* Bar */}
                <div className="w-full flex flex-col items-center justify-end h-16">
                  {day.minutes > 0 && (
                    <div
                      className="w-full max-w-8 bg-gradient-to-t from-sky-500 to-sky-400 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                    ></div>
                  )}
                </div>
                {/* Minutes label */}
                <span className="text-xs text-gray-500">
                  {day.minutes > 0 ? day.minutes : ""}
                </span>
                {/* Day name */}
                <span className="text-xs font-medium text-gray-600">
                  {dayNames[index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-sky-50 rounded-xl p-3 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-sky-600">
            {thisWeekMinutes}
            <span className="text-sm font-normal text-sky-500 ml-1">
              {isLearner ? "min" : "分"}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            {isLearner ? "This Week" : "今週"}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-purple-600">
            {stats.monthlyMinutes}
            <span className="text-sm font-normal text-purple-500 ml-1">
              {isLearner ? "min" : "分"}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            {isLearner ? "This Month" : "今月"}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-green-600">
            {stats.totalSessions}
            <span className="text-sm font-normal text-green-500 ml-1">
              {isLearner ? "sessions" : "回"}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            {isLearner ? "Total Sessions" : "会話数"}
          </p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-orange-600">
            {stats.uniquePartners}
            <span className="text-sm font-normal text-orange-500 ml-1">
              {isLearner ? "people" : "人"}
            </span>
          </p>
          <p className="text-xs text-gray-600">
            {isLearner ? "Partners" : "会話相手"}
          </p>
        </div>
      </div>
    </div>
  );
}
