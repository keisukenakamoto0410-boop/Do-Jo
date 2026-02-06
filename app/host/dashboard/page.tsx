"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import LearnerPostFeed from "@/components/host/LearnerPostFeed";
import MobileNav from "@/components/MobileNav";
import ConversationStats from "@/components/ConversationStats";

// Admin emails that can access admin pages
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

interface Reservation {
  id: string;
  status: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  learner: {
    id: string;
    name: string;
    avatar: string | null;
    country: string | null;
    jlptLevel: string | null;
  };
}

export default function HostDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role === "learner") {
      router.push("/learner/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        // Use /api/host/reservations which includes 30min buffer after start time
        const res = await fetch("/api/host/reservations?status=confirmed");
        if (res.ok) {
          const data = await res.json();
          // Sort by start time (API already filters with 30min buffer)
          const sortedReservations = (data.reservations || [])
            .sort(
              (a: Reservation, b: Reservation) =>
                new Date(a.slot.startTime).getTime() -
                new Date(b.slot.startTime).getTime()
            );
          setReservations(sortedReservations);
        } else {
          console.error("Failed to fetch reservations: HTTP", res.status);
          // Keep existing reservations on error
        }
      } catch (error) {
        console.error("Failed to fetch reservations:", error);
        // Keep existing reservations on network error
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchReservations();
    }
  }, [session?.user?.id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user;
  const isSenior = user.role === "senior";
  const isStudent = user.role === "student";

  // Check if session is joinable (15 minutes before to 30 minutes after start)
  const isJoinable = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const joinableFrom = new Date(start.getTime() - 15 * 60000); // 15 minutes before
    const joinableUntil = new Date(start.getTime() + 30 * 60000); // 30 minutes after start
    return now >= joinableFrom && now <= joinableUntil;
  };

  // Check if session is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get relative time string
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 0) return "開始中";
    if (diffMins < 60) return `${diffMins}分後`;
    if (diffHours < 24) return `${diffHours}時間後`;
    return `${diffDays}日後`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get today's reservations
  const todayReservations = reservations.filter((r) => isToday(r.slot.startTime));

  // Get upcoming reservations (excluding today)
  const upcomingReservations = reservations.filter(
    (r) => !isToday(r.slot.startTime)
  );

  return (
    <div
      className={`min-h-screen ${isSenior ? "bg-gradient-to-br from-amber-50 via-white to-orange-50" : "bg-gradient-to-br from-purple-50 via-white to-pink-50"}`}
    >
      {/* Mobile Navigation */}
      <MobileNav isLearner={false} />

      {/* Desktop Header - hidden on mobile */}
      <header className="hidden lg:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/host/dashboard"
              className={`text-2xl font-bold ${isSenior ? "text-amber-600" : "text-purple-600"}`}
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
              {isStudent && (
                <Link
                  href="/host/earnings"
                  className="text-gray-600 hover:text-gray-900"
                >
                  収益管理
                </Link>
              )}
              {user.email && ADMIN_EMAILS.includes(user.email) && (
                <Link
                  href="/admin/reservations"
                  className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
                >
                  管理者
                </Link>
              )}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isSenior ? "🏯" : "🎓"}</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                ログアウト
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-20 lg:pb-8">
        {/* Welcome */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            こんにちは、{user.name}さん！
          </h1>
          <p className="text-gray-600">
            {isSenior
              ? "外国人学習者にビジネスマナーや敬語を教えましょう"
              : "外国人学習者と楽しく会話してお小遣いを稼ぎましょう"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Create Slot */}
          <Link
            href="/host/schedule"
            className={`${isSenior ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-purple-500 to-pink-600"} rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all`}
          >
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-2xl font-bold mb-2">予約枠を作成</h2>
            <p className="opacity-90 mb-4">
              空いている時間に予約枠を設定しましょう
            </p>
            <span className="inline-block px-4 py-2 bg-white/20 rounded-lg text-sm">
              スケジュールを管理 →
            </span>
          </Link>

          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">今日の予定</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
              </div>
            ) : todayReservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">☀️</p>
                <p>今日の予約はありません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className={`p-4 rounded-xl border-2 ${isJoinable(reservation.slot.startTime) ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${isSenior ? "bg-amber-500" : "bg-purple-500"}`}
                        >
                          {reservation.learner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {reservation.learner.name}さん
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(reservation.slot.startTime)} -{" "}
                            {formatTime(reservation.slot.endTime)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isJoinable(reservation.slot.startTime) ? (
                          <Link
                            href={`/host/session/${reservation.id}`}
                            className={`px-6 py-3 ${isSenior ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"} text-white font-bold rounded-xl transition-colors animate-pulse`}
                          >
                            参加する
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {getRelativeTime(reservation.slot.startTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversation Stats */}
        <div className="mb-8">
          <ConversationStats userId={user.id} isLearner={false} />
        </div>

        {/* Learner Post Feed */}
        <div className="mb-8">
          <LearnerPostFeed />
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">今後の予約</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            </div>
          ) : upcomingReservations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-5xl mb-4">📭</p>
              <p>予約はまだありません</p>
              <p className="text-sm mt-2">
                予約枠を作成すると、学習者からの予約が入ります
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingReservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isSenior ? "bg-amber-500" : "bg-purple-500"}`}
                    >
                      {reservation.learner.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.learner.name}さん
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(reservation.slot.startTime)}{" "}
                        {formatTime(reservation.slot.startTime)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {getRelativeTime(reservation.slot.startTime)}
                  </span>
                </div>
              ))}
              {upcomingReservations.length > 5 && (
                <Link
                  href="/host/reservations"
                  className={`block text-center py-3 ${isSenior ? "text-amber-600 hover:text-amber-700" : "text-purple-600 hover:text-purple-700"} font-medium`}
                >
                  すべての予約を見る ({upcomingReservations.length}件) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Student Earnings Card */}
        {isStudent && (
          <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">💰 収益を確認</h2>
                <p className="opacity-90">
                  25分のセッションで ¥500〜1,000 稼げます
                </p>
              </div>
              <Link
                href="/host/earnings"
                className="px-6 py-3 bg-white text-green-600 font-bold rounded-xl hover:bg-gray-100"
              >
                収益管理へ
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
