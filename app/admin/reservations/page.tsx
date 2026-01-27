"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// Admin emails that can access this page
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

interface Reservation {
  id: string;
  status: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  host: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  learner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    country: string | null;
    jlptLevel: string | null;
  };
}

export default function AdminReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    const fetchReservations = async () => {
      try {
        const res = await fetch("/api/admin/reservations");
        if (!res.ok) {
          if (res.status === 403) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch data");
        }
        const data = await res.json();
        setReservations(data.reservations);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
      fetchReservations();
    }
  }, [session, router]);

  // Check if session is joinable (15 minutes before to session end)
  const isJoinable = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const joinableFrom = new Date(start.getTime() - 15 * 60000);
    return now >= joinableFrom && now <= end;
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

  // Check if session has passed
  const hasPassed = (endTime: string) => {
    return new Date() > new Date(endTime);
  };

  // Format date in Japanese
  const formatDateJa = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
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

  // Generate copy text for a reservation
  const generateCopyText = (reservation: Reservation) => {
    const BASE_URL = "https://do-jo.vercel.app";
    return `【Do Jo セッション情報】
📅 日時: ${formatDateJa(reservation.slot.startTime)} ${formatTime(reservation.slot.startTime)} - ${formatTime(reservation.slot.endTime)}
👤 シニア: ${reservation.host.name}
   メール: ${reservation.host.email}
👤 学習者: ${reservation.learner.name}
   メール: ${reservation.learner.email}
🔗 セッションURL: ${BASE_URL}/session/${reservation.id}

---
このメールをシニア・学習者に転送してください。`;
  };

  // Copy to clipboard
  const copyToClipboard = async (reservation: Reservation) => {
    try {
      await navigator.clipboard.writeText(generateCopyText(reservation));
      setCopiedId(reservation.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Get status color
  const getStatusColor = (reservation: Reservation) => {
    if (hasPassed(reservation.slot.endTime)) {
      return "bg-gray-100 border-gray-300";
    }
    if (isJoinable(reservation.slot.startTime, reservation.slot.endTime)) {
      return "bg-green-50 border-green-500";
    }
    if (isToday(reservation.slot.startTime)) {
      return "bg-yellow-50 border-yellow-500";
    }
    return "bg-white border-gray-200";
  };

  const getStatusBadge = (reservation: Reservation) => {
    if (hasPassed(reservation.slot.endTime)) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
          終了
        </span>
      );
    }
    if (isJoinable(reservation.slot.startTime, reservation.slot.endTime)) {
      return (
        <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-full animate-pulse">
          参加可能
        </span>
      );
    }
    if (isToday(reservation.slot.startTime)) {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-500 text-white rounded-full">
          本日
        </span>
      );
    }
    return null;
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

  // Separate reservations into today and upcoming
  const todayReservations = reservations.filter(
    (r) => isToday(r.slot.startTime) && !hasPassed(r.slot.endTime)
  );
  const upcomingReservations = reservations.filter(
    (r) => !isToday(r.slot.startTime) && !hasPassed(r.slot.endTime)
  );
  const pastReservations = reservations.filter((r) =>
    hasPassed(r.slot.endTime)
  );

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
                className="text-gray-900 font-medium"
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
              <span className="text-gray-600">{session.user.email}</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Today's Sessions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            今日のセッション（
            {new Date().toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            ）
          </h2>

          {todayReservations.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              <p className="text-4xl mb-2">☀️</p>
              <p>今日の予約はありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className={`rounded-xl shadow p-6 border-2 ${getStatusColor(reservation)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatTime(reservation.slot.startTime)} -{" "}
                          {formatTime(reservation.slot.endTime)}
                        </span>
                        {getStatusBadge(reservation)}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {/* Host Info */}
                        <div className="bg-amber-50 rounded-lg p-4">
                          <p className="text-sm text-amber-600 font-medium mb-1">
                            シニア
                          </p>
                          <p className="font-bold text-gray-900">
                            {reservation.host.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {reservation.host.email}
                          </p>
                        </div>

                        {/* Learner Info */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-blue-600 font-medium mb-1">
                            学習者
                          </p>
                          <p className="font-bold text-gray-900">
                            {reservation.learner.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {reservation.learner.email}
                          </p>
                          {reservation.learner.country && (
                            <p className="text-xs text-gray-500 mt-1">
                              {reservation.learner.country}{" "}
                              {reservation.learner.jlptLevel &&
                                `/ ${reservation.learner.jlptLevel}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Video Call Link */}
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium mb-2">
                          🎥 ビデオ通話リンク
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white px-3 py-2 rounded text-sm text-gray-700 border">
                            https://do-jo.vercel.app/session/{reservation.id}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`https://do-jo.vercel.app/session/${reservation.id}`);
                              setCopiedId(`link-${reservation.id}`);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                          >
                            {copiedId === `link-${reservation.id}` ? "✓" : "コピー"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {isJoinable(
                        reservation.slot.startTime,
                        reservation.slot.endTime
                      ) && (
                        <>
                          <Link
                            href={`/admin/watch/${reservation.id}`}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg text-center transition-colors"
                          >
                            👁 監視する
                          </Link>
                          <Link
                            href={`/session/${reservation.id}`}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-center transition-colors"
                          >
                            参加する
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => copyToClipboard(reservation)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg flex items-center gap-2 transition-colors"
                      >
                        {copiedId === reservation.id ? (
                          <>
                            <span>✓</span>
                            コピー済み
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            情報をコピー
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📆</span>
            今後の予約
          </h2>

          {upcomingReservations.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              <p className="text-4xl mb-2">📭</p>
              <p>今後の予約はありません</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      シニア
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      学習者
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      ビデオリンク
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {upcomingReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {formatDateJa(reservation.slot.startTime)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(reservation.slot.startTime)} -{" "}
                          {formatTime(reservation.slot.endTime)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {reservation.host.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reservation.host.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {reservation.learner.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reservation.learner.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 max-w-[200px] truncate">
                            /session/{reservation.id.slice(0, 8)}...
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`https://do-jo.vercel.app/session/${reservation.id}`);
                              setCopiedId(`table-link-${reservation.id}`);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded transition-colors"
                          >
                            {copiedId === `table-link-${reservation.id}` ? "✓" : "🔗"}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => copyToClipboard(reservation)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          {copiedId === reservation.id ? (
                            "✓ コピー済み"
                          ) : (
                            <>📋 全情報</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Past Sessions (collapsed) */}
        {pastReservations.length > 0 && (
          <details className="mb-8">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
              過去のセッション（{pastReservations.length}件）
            </summary>
            <div className="mt-4 bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      シニア
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      学習者
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      フィードバックURL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastReservations.slice(0, 10).map((reservation) => (
                    <tr key={reservation.id} className="text-gray-500">
                      <td className="px-6 py-4">
                        <p>{formatDateJa(reservation.slot.startTime)}</p>
                        <p className="text-sm">
                          {formatTime(reservation.slot.startTime)}
                        </p>
                      </td>
                      <td className="px-6 py-4">{reservation.host.name}</td>
                      <td className="px-6 py-4">{reservation.learner.name}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://do-jo.vercel.app/learner/feedback/${reservation.id}`);
                            setCopiedId(`feedback-${reservation.id}`);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          {copiedId === `feedback-${reservation.id}` ? (
                            "✓ コピー済み"
                          ) : (
                            <>📝 URLコピー</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
