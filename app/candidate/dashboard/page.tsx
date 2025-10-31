"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { CenteredSpinner } from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import UsageStats from "@/components/candidate/UsageStats";
import NextInterviewCard from "@/components/candidate/NextInterviewCard";
import RecentFeedback from "@/components/candidate/RecentFeedback";
import QuickActions from "@/components/candidate/QuickActions";

interface DashboardData {
  usage: {
    used: number;
    limit: number;
    remaining: number;
  };
  nextInterview: {
    id: string;
    scheduledAt: string;
    interviewer: {
      name: string;
      expertise?: string[];
    };
    jobCategory?: string;
    status: string;
  } | null;
  recentFeedback: Array<{
    id: string;
    date: string;
    interviewer: string;
    jobCategory?: string;
    score: number;
    createdAt: string;
  }>;
  stats: {
    totalInterviews: number;
    pendingInterviews: number;
    averageScore: number;
    completedThisMonth: number;
  };
}

export default function CandidateDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/candidate/dashboard");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ダッシュボードデータの取得に失敗しました");
      }

      setDashboardData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <CenteredSpinner size="lg" text="読み込み中..." fullScreen />;
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="エラーが発生しました"
            message={error || "ダッシュボードを表示できませんでした"}
            variant="card"
            severity="error"
            onRetry={fetchDashboardData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ダッシュボード
          </h1>
          <p className="text-gray-600">
            ようこそ、{session?.user?.name}さん！今日も一緒に頑張りましょう
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">総面接回数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.stats.totalInterviews}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">平均スコア</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.stats.averageScore}%
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">今月完了</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.stats.completedThisMonth}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">承認待ち</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboardData.stats.pendingInterviews}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Usage Stats */}
            <UsageStats
              used={dashboardData.usage.used}
              limit={dashboardData.usage.limit}
              remaining={dashboardData.usage.remaining}
            />

            {/* Next Interview */}
            <NextInterviewCard interview={dashboardData.nextInterview} />

            {/* Recent Feedback */}
            <RecentFeedback
              feedback={dashboardData.recentFeedback}
              averageScore={dashboardData.stats.averageScore}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <QuickActions
              hasResume={true} // TODO: Get from API
              remainingInterviews={dashboardData.usage.remaining}
              pendingInterviews={dashboardData.stats.pendingInterviews}
            />

            {/* Motivational Card */}
            <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-xl shadow-lg p-6 text-white">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">今月の目標</h3>
              <p className="text-sm text-white/90 mb-4">
                面接を通じて日本語スキルを向上させましょう！
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">進捗状況</span>
                  <span className="text-sm font-bold">
                    {dashboardData.usage.used}/{dashboardData.usage.limit}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(dashboardData.usage.used / dashboardData.usage.limit) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">📚</span>
                <h3 className="text-lg font-bold text-gray-900">学習のヒント</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>面接前に自己紹介を練習しましょう</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>フィードバックを確認して弱点を克服</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>定期的に面接を受けて継続的に改善</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
