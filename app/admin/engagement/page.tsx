"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

// Admin emails that can access this page
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com", "admin@dojo.com"];

interface EngagementLog {
  id: string;
  sessionId: string;
  foreignerSpeakSec: number;
  seniorSpeakSec: number;
  silenceSec: number;
  seniorEnergyRating: number | null;
  recordedAt: string;
}

interface SessionStats {
  sessionId: string;
  foreignerSpeakSec: number;
  seniorSpeakSec: number;
  silenceSec: number;
  totalSec: number;
  foreignerRate: number;
  seniorRate: number;
  silenceRate: number;
  recordedAt: string;
  status: "good" | "warning" | "critical";
  energyLevel: "high" | "medium" | "low";
  seniorEnergyRating: number | null;
  subjectiveEnergy: "high" | "medium" | "low" | null;
  matchesObjective: boolean | null;
}

interface Stats {
  totalSessions: number;
  avgForeignerRate: number;
  avgSilenceSec: number;
  needFollowUp: number;
  highEnergyCount: number;
  lowEnergyCount: number;
  ratedSessions: number;
  matchingRate: number;
}

export default function AdminEngagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<EngagementLog[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      session?.user?.email &&
      !ADMIN_EMAILS.includes(session.user.email)
    ) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      fetchEngagementData();
    }
  }, [session]);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("engagement_logs")
        .select("*")
        .order("recorded_at", { ascending: false });

      if (fetchError) throw fetchError;

      const engagementLogs = (data || []) as EngagementLog[];
      setLogs(engagementLogs);

      // セッション別統計を計算
      const sessionStatsArray = engagementLogs.map((log) => {
        const totalSec =
          log.foreignerSpeakSec + log.seniorSpeakSec + log.silenceSec;
        const foreignerRate =
          totalSec > 0 ? (log.foreignerSpeakSec / totalSec) * 100 : 0;
        const seniorRate =
          totalSec > 0 ? (log.seniorSpeakSec / totalSec) * 100 : 0;
        const silenceRate =
          totalSec > 0 ? (log.silenceSec / totalSec) * 100 : 0;

        let status: "good" | "warning" | "critical" = "good";
        if (foreignerRate < 30) status = "critical";
        else if (foreignerRate < 40) status = "warning";

        // 客観的元気度の判定（発話率ベース）
        let energyLevel: "high" | "medium" | "low" = "medium";
        if (foreignerRate >= 40) energyLevel = "high";
        else if (foreignerRate >= 25) energyLevel = "medium";
        else energyLevel = "low";

        // 主観的元気度の判定（シニアの評価）
        let subjectiveEnergy: "high" | "medium" | "low" | null = null;
        if (log.seniorEnergyRating) {
          if (log.seniorEnergyRating >= 4) subjectiveEnergy = "high";
          else if (log.seniorEnergyRating === 3) subjectiveEnergy = "medium";
          else subjectiveEnergy = "low";
        }

        // 主観と客観の一致度
        const matchesObjective =
          subjectiveEnergy !== null ? subjectiveEnergy === energyLevel : null;

        return {
          sessionId: log.sessionId,
          foreignerSpeakSec: log.foreignerSpeakSec,
          seniorSpeakSec: log.seniorSpeakSec,
          silenceSec: log.silenceSec,
          totalSec,
          foreignerRate,
          seniorRate,
          silenceRate,
          recordedAt: log.recordedAt,
          status,
          energyLevel,
          seniorEnergyRating: log.seniorEnergyRating,
          subjectiveEnergy,
          matchesObjective,
        };
      });

      setSessionStats(sessionStatsArray);

      // 全体統計を計算
      const totalSessions = engagementLogs.length;
      const avgForeignerRate =
        totalSessions > 0
          ? sessionStatsArray.reduce((sum, s) => sum + s.foreignerRate, 0) /
            totalSessions
          : 0;
      const avgSilenceSec =
        totalSessions > 0
          ? engagementLogs.reduce((sum, log) => sum + log.silenceSec, 0) /
            totalSessions
          : 0;
      const needFollowUp = sessionStatsArray.filter(
        (s) => s.foreignerRate < 30
      ).length;
      const highEnergyCount = sessionStatsArray.filter(
        (s) => s.energyLevel === "high"
      ).length;
      const lowEnergyCount = sessionStatsArray.filter(
        (s) => s.energyLevel === "low"
      ).length;

      // 主観評価と客観評価の一致率
      const ratedSessions = sessionStatsArray.filter(
        (s) => s.seniorEnergyRating !== null
      ).length;
      const matchingSessions = sessionStatsArray.filter(
        (s) => s.matchesObjective === true
      ).length;
      const matchingRate =
        ratedSessions > 0 ? (matchingSessions / ratedSessions) * 100 : 0;

      setStats({
        totalSessions,
        avgForeignerRate,
        avgSilenceSec,
        needFollowUp,
        highEnergyCount,
        lowEnergyCount,
        ratedSessions,
        matchingRate,
      });
    } catch (err) {
      console.error(err);
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "critical":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            緊急
          </span>
        );
      case "warning":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            注意
          </span>
        );
      case "good":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            良好
          </span>
        );
    }
  };

  const getEnergyBadge = (energyLevel: "high" | "medium" | "low") => {
    switch (energyLevel) {
      case "high":
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl">😊</span>
            <span className="text-sm font-medium text-green-700">
              とても元気
            </span>
          </div>
        );
      case "medium":
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl">😐</span>
            <span className="text-sm font-medium text-yellow-700">
              普通
            </span>
          </div>
        );
      case "low":
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl">😔</span>
            <span className="text-sm font-medium text-red-700">
              元気がない
            </span>
          </div>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Do Jo
              </Link>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Admin
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin/reservations"
                className="text-gray-600 hover:text-gray-900"
              >
                予約管理
              </Link>
              <Link
                href="/admin/users"
                className="text-gray-600 hover:text-gray-900"
              >
                ユーザー一覧
              </Link>
              <Link
                href="/admin/feedback"
                className="text-gray-600 hover:text-gray-900"
              >
                スコア一覧
              </Link>
              <Link
                href="/admin/products"
                className="text-gray-600 hover:text-gray-900"
              >
                商品管理
              </Link>
              <Link
                href="/admin/engagement"
                className="text-gray-900 font-medium"
              >
                エンゲージメント
              </Link>
              <span className="text-gray-600">{session.user.email}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          エンゲージメントレポート
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-blue-900 text-sm">
            <strong>💡 このレポートについて：</strong>
            <br />
            「シニアの感覚」は、セッション後にシニアが主観的に評価した学習者の元気度です。
            <br />
            「発話データ」は、音声の発話量を自動測定した客観的な元気度です。
            <br />
            両者を比較することで、シニアの感覚と実際のデータの相関を確認できます。
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-6">
              <p className="text-sm text-gray-500 mb-1">総セッション数</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalSessions}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl shadow p-6">
              <p className="text-sm text-blue-600 mb-1">外国人の平均発話率</p>
              <p className="text-3xl font-bold text-blue-900">
                {stats.avgForeignerRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl shadow p-6">
              <p className="text-sm text-purple-600 mb-1">平均沈黙時間</p>
              <p className="text-3xl font-bold text-purple-900">
                {Math.round(stats.avgSilenceSec)}秒
              </p>
            </div>
            <div className="bg-teal-50 rounded-xl shadow p-6">
              <p className="text-sm text-teal-600 mb-1">主観・客観の一致率</p>
              <p className="text-3xl font-bold text-teal-900">
                {stats.matchingRate.toFixed(0)}%
              </p>
              <p className="text-xs text-teal-600 mt-1">
                {stats.ratedSessions}件中
              </p>
            </div>
          </div>
        )}

        {/* Energy Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">😊</span>
                <p className="text-sm text-green-600 font-medium">元気な学習者</p>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {stats.highEnergyCount}人
              </p>
              <p className="text-xs text-green-600 mt-1">
                発話率40%以上
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">😐</span>
                <p className="text-sm text-yellow-600 font-medium">普通の学習者</p>
              </div>
              <p className="text-3xl font-bold text-yellow-900">
                {stats.totalSessions - stats.highEnergyCount - stats.lowEnergyCount}人
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                発話率25-40%
              </p>
            </div>
            <div className="bg-red-50 rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">😔</span>
                <p className="text-sm text-red-600 font-medium">元気がない学習者</p>
              </div>
              <p className="text-3xl font-bold text-red-900">
                {stats.lowEnergyCount}人
              </p>
              <p className="text-xs text-red-600 mt-1">
                発話率25%未満（要フォロー）
              </p>
            </div>
          </div>
        )}

        {/* Session List */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              セッション別レポート
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    セッションID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    シニアの感覚
                    <br />
                    <span className="text-xs text-gray-400">（主観評価）</span>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    発話データ
                    <br />
                    <span className="text-xs text-gray-400">（客観評価）</span>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    一致度
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    外国人発話率
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    発話比率グラフ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    記録日時
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessionStats.map((stat) => (
                  <tr key={stat.sessionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-gray-900">
                        {stat.sessionId.substring(0, 8)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {stat.subjectiveEnergy ? (
                        getEnergyBadge(stat.subjectiveEnergy)
                      ) : (
                        <span className="text-xs text-gray-400">未評価</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getEnergyBadge(stat.energyLevel)}</td>
                    <td className="px-6 py-4">
                      {stat.matchesObjective === null ? (
                        <span className="text-xs text-gray-400">-</span>
                      ) : stat.matchesObjective ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          ✓ 一致
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          不一致
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(stat.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {stat.foreignerRate.toFixed(1)}%
                        </p>
                        <p className="text-gray-500">{stat.foreignerSpeakSec}秒</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-48 h-6 bg-gray-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-blue-500 h-full"
                          style={{ width: `${stat.foreignerRate}%` }}
                          title={`外国人: ${stat.foreignerRate.toFixed(1)}%`}
                        ></div>
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${stat.seniorRate}%` }}
                          title={`シニア: ${stat.seniorRate.toFixed(1)}%`}
                        ></div>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-xs text-gray-600">外国人</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-xs text-gray-600">シニア</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-200 rounded"></div>
                          <span className="text-xs text-gray-600">沈黙</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(stat.recordedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sessionStats.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p className="text-4xl mb-2">📊</p>
              <p>エンゲージメントデータがありません</p>
            </div>
          )}
        </div>

        {/* Session Count */}
        <div className="mt-4 text-sm text-gray-500 text-right">
          {sessionStats.length}件のセッションを表示中
        </div>
      </main>
    </div>
  );
}
