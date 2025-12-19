"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayout: number;
  completedSessions: number;
  monthlySessions: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export default function HostEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingPayout: 0,
    completedSessions: 0,
    monthlySessions: 0,
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role === "learner") {
      router.push("/learner/dashboard");
    } else if (session?.user?.role === "senior") {
      // Seniors don't have earnings page
      router.push("/host/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user && session.user.role === "student") {
      fetchEarnings();
    }
  }, [session]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/host/earnings");
      const data = await res.json();

      if (res.ok) {
        setStats(data.stats);
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error("Failed to fetch earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (stats.pendingPayout < 1000) {
      alert("最低出金額は¥1,000です");
      return;
    }

    if (!confirm(`¥${stats.pendingPayout.toLocaleString()}を出金申請しますか？`)) {
      return;
    }

    try {
      const res = await fetch("/api/host/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: stats.pendingPayout }),
      });

      if (res.ok) {
        fetchEarnings();
        alert("出金申請を受け付けました");
      } else {
        const data = await res.json();
        alert(data.error || "出金申請に失敗しました");
      }
    } catch (error) {
      console.error("Failed to request payout:", error);
      alert("出金申請に失敗しました");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            処理中
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            完了
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            失敗
          </span>
        );
      default:
        return null;
    }
  };

  if (status === "loading" || (session?.user?.role !== "student" && status !== "unauthenticated")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "student") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/host/dashboard"
              className="text-2xl font-bold text-purple-600"
            >
              Do Jo
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/host/schedule"
                className="text-gray-600 hover:text-gray-900"
              >
                スケジュール
              </Link>
              <Link
                href="/host/reservations"
                className="text-gray-600 hover:text-gray-900"
              >
                予約一覧
              </Link>
              <Link
                href="/host/earnings"
                className="text-purple-600 font-medium"
              >
                収益管理
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">収益管理</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-sm text-gray-500 mb-1">今月の収益</p>
                <p className="text-3xl font-bold text-purple-600">
                  ¥{stats.monthlyEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.monthlySessions}回のセッション
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-sm text-gray-500 mb-1">累計収益</p>
                <p className="text-3xl font-bold text-green-600">
                  ¥{stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.completedSessions}回のセッション
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-sm text-gray-500 mb-1">出金可能額</p>
                <p className="text-3xl font-bold text-orange-600">
                  ¥{stats.pendingPayout.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  最低出金額: ¥1,000
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-sm text-gray-500 mb-1">1セッションあたり</p>
                <p className="text-3xl font-bold text-blue-600">
                  ¥500〜1,000
                </p>
                <p className="text-sm text-gray-500 mt-1">25分間</p>
              </div>
            </div>

            {/* Payout Request */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">💰 出金申請</h2>
                  <p className="opacity-90">
                    出金可能額: ¥{stats.pendingPayout.toLocaleString()}
                  </p>
                  <p className="text-sm opacity-75 mt-1">
                    出金は銀行振込で3-5営業日以内に処理されます
                  </p>
                </div>
                <button
                  onClick={requestPayout}
                  disabled={stats.pendingPayout < 1000}
                  className="px-6 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  出金申請
                </button>
              </div>
            </div>

            {/* Payout History */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">出金履歴</h2>

              {payouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-2">📜</p>
                  <p>出金履歴はありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          ¥{payout.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          申請日: {formatDate(payout.createdAt)}
                          {payout.paidAt && (
                            <span> ・ 振込日: {formatDate(payout.paidAt)}</span>
                          )}
                        </p>
                      </div>
                      {getPayoutStatusBadge(payout.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earnings Info */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                収益について
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  <strong>🎯 セッション報酬:</strong>{" "}
                  1回25分のセッションで¥500〜1,000を獲得できます。
                </p>
                <p>
                  <strong>💳 出金方法:</strong>{" "}
                  銀行振込のみ対応しています。最低出金額は¥1,000です。
                </p>
                <p>
                  <strong>⏰ 処理期間:</strong>{" "}
                  出金申請から3-5営業日以内に振り込まれます。
                </p>
                <p>
                  <strong>📝 税金について:</strong>{" "}
                  年間20万円を超える収入は確定申告が必要な場合があります。
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
