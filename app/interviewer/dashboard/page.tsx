"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stats {
  totalInterviewsThisMonth: number;
  averageScore: number;
  completionRate: number;
  pendingEvaluations: number;
  upcomingThisWeek: number;
}

interface ScheduledInterview {
  id: string;
  scheduledAt: string;
  startTime: string;
  endTime: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    japaneseLevel: string;
  };
  jobCategory: string;
  status: string;
}

interface PendingEvaluation {
  id: string;
  conductedAt: string;
  daysSince: number;
  priority: "high" | "medium" | "low";
  candidate: {
    id: string;
    name: string;
    email: string;
    japaneseLevel: string;
  };
  jobCategory: string;
  interviewTime: {
    start: string;
    end: string;
  };
}

export default function InterviewerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [schedule, setSchedule] = useState<ScheduledInterview[]>([]);
  const [pendingEvaluations, setPendingEvaluations] = useState<PendingEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.userType !== "INTERVIEWER") {
      router.push("/unauthorized");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel
      const [statsRes, scheduleRes, evaluationsRes] = await Promise.all([
        fetch("/api/interviewer/stats"),
        fetch("/api/interviewer/schedule?period=week"),
        fetch("/api/interviewer/pending-evaluations"),
      ]);

      if (!statsRes.ok || !scheduleRes.ok || !evaluationsRes.ok) {
        throw new Error("データの取得に失敗しました");
      }

      const statsData = await statsRes.json();
      const scheduleData = await scheduleRes.json();
      const evaluationsData = await evaluationsRes.json();

      setStats(statsData.stats);
      setSchedule(scheduleData.interviews);
      setPendingEvaluations(evaluationsData.pendingEvaluations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "高優先度";
      case "medium":
        return "中優先度";
      case "low":
        return "低優先度";
      default:
        return "";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ようこそ、{session?.user?.name || "面接官"}さん
          </h1>
          <p className="mt-2 text-gray-600">
            本日も面接業務お疲れ様です。ダッシュボードで今日のタスクを確認しましょう。
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-teal-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今月の面接数</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.totalInterviewsThisMonth}
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">平均評価スコア</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.averageScore.toFixed(1)}
                  </p>
                </div>
                <div className="text-4xl">⭐</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">評価完了率</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.completionRate.toFixed(0)}%
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">評価待ち</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.pendingEvaluations}
                  </p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今週の予定</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.upcomingThisWeek}
                  </p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* This Week's Schedule */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">今週の予定</h2>
              <Link
                href="/interviewer/schedule"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                すべて見る →
              </Link>
            </div>

            {schedule.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-500">今週の予定はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedule.slice(0, 5).map((interview) => (
                  <div
                    key={interview.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {interview.candidate.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {interview.candidate.japaneseLevel}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                        {interview.jobCategory}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 space-x-4">
                      <span>📅 {formatDate(interview.scheduledAt)}</span>
                      <span>
                        🕐 {formatTime(interview.startTime)} -{" "}
                        {formatTime(interview.endTime)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/interviewer/interview/${interview.id}`}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        詳細を見る →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Evaluations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                評価待ち
                {pendingEvaluations.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    {pendingEvaluations.length}
                  </span>
                )}
              </h2>
              <Link
                href="/interviewer/evaluations"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                すべて見る →
              </Link>
            </div>

            {pendingEvaluations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-gray-500">評価待ちはありません</p>
                <p className="text-sm text-gray-400 mt-2">すべての評価が完了しています</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEvaluations.slice(0, 5).map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {evaluation.candidate.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {evaluation.candidate.japaneseLevel}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(
                          evaluation.priority
                        )}`}
                      >
                        {getPriorityLabel(evaluation.priority)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <span>📅 {formatDate(evaluation.conductedAt)}</span>
                      <span className="ml-3 text-gray-400">
                        ({evaluation.daysSince}日前)
                      </span>
                    </div>
                    <Link
                      href={`/interviewer/evaluate/${evaluation.id}`}
                      className="inline-block px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                    >
                      評価する
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">クイックアクション</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/interviewer/availability"
              className="flex items-center p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all"
            >
              <div className="text-3xl mr-4">📅</div>
              <div>
                <p className="font-medium text-gray-900">空き枠を設定</p>
                <p className="text-sm text-gray-500">面接可能な時間を登録</p>
              </div>
            </Link>

            <Link
              href="/interviewer/requests"
              className="flex items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="text-3xl mr-4">📬</div>
              <div>
                <p className="font-medium text-gray-900">予約リクエストを確認</p>
                <p className="text-sm text-gray-500">承認待ちの予約を確認</p>
              </div>
            </Link>

            <Link
              href="/interviewer/history"
              className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <div className="text-3xl mr-4">📊</div>
              <div>
                <p className="font-medium text-gray-900">評価履歴</p>
                <p className="text-sm text-gray-500">過去の評価を確認</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
