"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  sessionType: string;
}

interface Learner {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  country: string | null;
  nativeLanguage: string | null;
  jlptLevel: string | null;
  learningGoal: string | null;
  interests: string[];
}

interface HostReactions {
  liked: boolean;
  likeCount: number;
  stamps: string[];
  hostComment?: string;
}

interface StudyLog {
  id: string;
  imageUrl: string;
  imageOrder: number;
  hostLiked: boolean;
  hostReactions?: HostReactions;
  analysisResult: {
    extracted_data?: {
      grammar_points?: string[];
      vocabulary?: string[];
      topic_category?: string;
      difficulty_level?: string;
    };
    ai_generated_output?: {
      learning_focus?: string;
      suggested_questions?: string[];
      praise_comment?: string;
    };
  } | null;
}

interface Reservation {
  id: string;
  slotId: string;
  status: string;
  sessionType: string;
  channelName: string | null;
  token: string | null;
  readyToTalk: boolean;
  studyLogCount: number;
  slot: Slot;
  learner: Learner;
  studyLogs?: StudyLog[];
  createdAt: string;
}

export default function HostReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState<string | null>(null);

  const isSenior = session?.user?.role === "senior";
  const isStudent = session?.user?.role === "student";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role === "learner") {
      router.push("/learner/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user) {
      fetchReservations();
    }
  }, [session]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();

      if (res.ok) {
        setReservations(data.reservations);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    if (!confirm("この予約をキャンセルしますか？学習者に通知されます。")) return;

    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchReservations();
      } else {
        const data = await res.json();
        alert(data.error || "キャンセルに失敗しました");
      }
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
      alert("キャンセルに失敗しました");
    }
  };

  const fetchStudyLogs = async (reservationId: string) => {
    if (expandedReservation === reservationId) {
      setExpandedReservation(null);
      return;
    }

    setLoadingLogs(reservationId);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/study-logs`);
      if (res.ok) {
        const logs = await res.json();
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId ? { ...r, studyLogs: logs } : r
          )
        );
        setExpandedReservation(reservationId);
      }
    } catch (error) {
      console.error("Failed to fetch study logs:", error);
    } finally {
      setLoadingLogs(null);
    }
  };

  const likeStudyLog = async (reservationId: string, logId: string) => {
    try {
      const res = await fetch(
        `/api/reservations/${reservationId}/study-logs/${logId}/like`,
        { method: "POST" }
      );
      if (res.ok) {
        const updatedLog = await res.json();
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? {
                  ...r,
                  studyLogs: r.studyLogs?.map((log) =>
                    log.id === logId ? { ...log, hostLiked: updatedLog.hostLiked } : log
                  ),
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Failed to like study log:", error);
    }
  };

  const sendReaction = async (
    logId: string,
    action: "like" | "stamp" | "comment",
    value?: string
  ) => {
    try {
      const res = await fetch(`/api/study-logs/${logId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          stamp: action === "stamp" ? value : undefined,
          comment: action === "comment" ? value : undefined,
        }),
      });
      if (res.ok) {
        const updatedLog = await res.json();
        // Update the local state
        setReservations((prev) =>
          prev.map((r) => ({
            ...r,
            studyLogs: r.studyLogs?.map((log) =>
              log.id === logId
                ? { ...log, hostReactions: updatedLog.hostReactions, hostLiked: updatedLog.hostLiked }
                : log
            ),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to send reaction:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const now = new Date();
  const upcomingReservations = reservations.filter(
    (r) =>
      new Date(r.slot.startTime) > now &&
      ["pending", "confirmed"].includes(r.status)
  );
  const pastReservations = reservations.filter(
    (r) =>
      new Date(r.slot.startTime) <= now ||
      r.status === "completed" ||
      r.status === "cancelled"
  );

  const displayedReservations =
    activeTab === "upcoming" ? upcomingReservations : pastReservations;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            確定
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            承認待ち
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            完了
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            キャンセル済み
          </span>
        );
      default:
        return null;
    }
  };

  const getJlptBadge = (level: string | null) => {
    if (!level) return null;
    const colors: Record<string, string> = {
      N1: "bg-red-100 text-red-800",
      N2: "bg-orange-100 text-orange-800",
      N3: "bg-yellow-100 text-yellow-800",
      N4: "bg-green-100 text-green-800",
      N5: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${colors[level] || "bg-gray-100 text-gray-800"}`}
      >
        {level}
      </span>
    );
  };

  const themeColor = isSenior ? "amber" : "purple";

  if (status === "loading") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${isSenior ? "from-amber-50 via-white to-orange-50" : "from-purple-50 via-white to-pink-50"}`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${themeColor}-600`}
        ></div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div
      className={`min-h-screen ${isSenior ? "bg-gradient-to-br from-amber-50 via-white to-orange-50" : "bg-gradient-to-br from-purple-50 via-white to-pink-50"}`}
    >
      {/* Header */}
      <header className="bg-white shadow-sm">
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
                className={`${isSenior ? "text-amber-600" : "text-purple-600"} font-medium`}
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
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isSenior ? "🏯" : "🎓"}</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">予約一覧</h1>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "upcoming"
                  ? `${isSenior ? "text-amber-600 border-amber-600" : "text-purple-600 border-purple-600"} border-b-2`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              今後の予約 ({upcomingReservations.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "past"
                  ? `${isSenior ? "text-amber-600 border-amber-600" : "text-purple-600 border-purple-600"} border-b-2`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              過去の予約 ({pastReservations.length})
            </button>
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isSenior ? "border-amber-600" : "border-purple-600"}`}
            ></div>
          </div>
        ) : displayedReservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-5xl mb-4">
              {activeTab === "upcoming" ? "📅" : "📚"}
            </p>
            <p className="text-xl text-gray-600">
              {activeTab === "upcoming"
                ? "今後の予約はありません"
                : "過去の予約はありません"}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/host/schedule"
                className={`inline-block mt-4 px-6 py-2 rounded-lg text-white ${
                  isSenior ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                予約枠を作成
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 ${
                  reservation.sessionType === "business"
                    ? "border-amber-500"
                    : "border-purple-500"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Learner Avatar */}
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                        🌍
                      </div>

                      {/* Reservation Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {reservation.learner.name}
                          </h3>
                          {getStatusBadge(reservation.status)}
                          {getJlptBadge(reservation.learner.jlptLevel)}
                          {/* Ready Badge */}
                          {reservation.readyToTalk ? (
                            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-bold animate-pulse">
                              ✓ Ready
                            </span>
                          ) : reservation.studyLogCount > 0 ? (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              準備中 ({reservation.studyLogCount}/4)
                            </span>
                          ) : null}
                        </div>
                        <p className="text-gray-500 text-sm mb-2">
                          {reservation.learner.country && (
                            <span>{reservation.learner.country}</span>
                          )}
                          {reservation.learner.nativeLanguage && (
                            <span> ・ 母語: {reservation.learner.nativeLanguage}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-4 text-gray-700">
                          <span className="flex items-center gap-1">
                            📅 {formatDate(reservation.slot.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            🕐 {formatTime(reservation.slot.startTime)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              reservation.sessionType === "business"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {reservation.sessionType === "business"
                              ? "ビジネス"
                              : "カジュアル"}
                          </span>
                        </div>

                        {reservation.learner.learningGoal && (
                          <p className="text-sm text-gray-600 mt-2">
                            学習目的:{" "}
                            {reservation.learner.learningGoal === "business"
                              ? "ビジネス日本語"
                              : reservation.learner.learningGoal === "casual"
                                ? "カジュアル会話"
                                : "両方"}
                          </p>
                        )}

                        {reservation.learner.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reservation.learner.interests
                              .slice(0, 4)
                              .map((interest) => (
                                <span
                                  key={interest}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                                >
                                  {interest}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 items-end">
                      {activeTab === "upcoming" &&
                        reservation.status === "confirmed" && (
                          <div className="flex gap-2">
                            <Link
                              href={`/session/${reservation.id}`}
                              className={`px-4 py-2 rounded-lg font-medium text-white ${
                                isSenior
                                  ? "bg-amber-600 hover:bg-amber-700"
                                  : "bg-purple-600 hover:bg-purple-700"
                              }`}
                            >
                              セッションに参加
                            </Link>
                            <button
                              onClick={() => cancelReservation(reservation.id)}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              キャンセル
                            </button>
                          </div>
                        )}
                      {/* View Study Logs Button */}
                      {reservation.studyLogCount > 0 && (
                        <button
                          onClick={() => fetchStudyLogs(reservation.id)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium flex items-center gap-1"
                        >
                          {loadingLogs === reservation.id ? (
                            <>
                              <span className="animate-spin">⏳</span> 読み込み中...
                            </>
                          ) : expandedReservation === reservation.id ? (
                            <>📚 学習記録を閉じる</>
                          ) : (
                            <>📚 学習記録を見る ({reservation.studyLogCount})</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Study Logs Section */}
                {expandedReservation === reservation.id && reservation.studyLogs && (
                  <div className="border-t bg-gradient-to-r from-blue-50 to-purple-50 p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📚</span> {reservation.learner.name}さんの学習記録
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {reservation.studyLogs.map((log) => {
                        const reactions = log.hostReactions || {
                          liked: false,
                          likeCount: 0,
                          stamps: [],
                        };
                        return (
                          <div
                            key={log.id}
                            className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                          >
                            <div className="relative">
                              <img
                                src={log.imageUrl}
                                alt={`Study ${log.imageOrder}`}
                                className="w-full h-32 object-cover"
                              />
                              {reactions.likeCount > 0 && (
                                <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                  ❤️ {reactions.likeCount}
                                </div>
                              )}
                              {/* Stamps on image */}
                              {reactions.stamps.length > 0 && (
                                <div className="absolute bottom-2 left-2 flex gap-1">
                                  {reactions.stamps.slice(0, 3).map((stamp, i) => (
                                    <span
                                      key={i}
                                      className="text-xl bg-white/90 rounded-full p-0.5"
                                    >
                                      {stamp}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  写真 {log.imageOrder}
                                </span>
                                {log.analysisResult?.extracted_data?.difficulty_level && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {log.analysisResult.extracted_data.difficulty_level}
                                  </span>
                                )}
                              </div>

                              {/* Reaction Buttons */}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <button
                                  onClick={() => sendReaction(log.id, "like")}
                                  className={`px-2.5 py-1 rounded-full text-sm font-medium transition-all ${
                                    reactions.liked
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                                  }`}
                                >
                                  ❤️ {reactions.likeCount > 0 ? reactions.likeCount : ""}
                                </button>
                                <button
                                  onClick={() => sendReaction(log.id, "stamp", "👍")}
                                  className={`px-2.5 py-1 rounded-full text-sm transition-all ${
                                    reactions.stamps.includes("👍")
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-100 hover:bg-blue-100"
                                  }`}
                                >
                                  👍
                                </button>
                                <button
                                  onClick={() => sendReaction(log.id, "stamp", "🎉")}
                                  className={`px-2.5 py-1 rounded-full text-sm transition-all ${
                                    reactions.stamps.includes("🎉")
                                      ? "bg-yellow-500 text-white"
                                      : "bg-gray-100 hover:bg-yellow-100"
                                  }`}
                                >
                                  🎉
                                </button>
                                <button
                                  onClick={() => sendReaction(log.id, "stamp", "💯")}
                                  className={`px-2.5 py-1 rounded-full text-sm transition-all ${
                                    reactions.stamps.includes("💯")
                                      ? "bg-orange-500 text-white"
                                      : "bg-gray-100 hover:bg-orange-100"
                                  }`}
                                >
                                  💯
                                </button>
                                <button
                                  onClick={() => sendReaction(log.id, "stamp", "✨")}
                                  className={`px-2.5 py-1 rounded-full text-sm transition-all ${
                                    reactions.stamps.includes("✨")
                                      ? "bg-purple-500 text-white"
                                      : "bg-gray-100 hover:bg-purple-100"
                                  }`}
                                >
                                  ✨
                                </button>
                              </div>

                              {/* AI Praise Comment */}
                              {log.analysisResult?.ai_generated_output?.praise_comment && (
                                <p className="text-xs text-purple-600 mt-2 line-clamp-2">
                                  {log.analysisResult.ai_generated_output.praise_comment}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Generated Questions */}
                    {reservation.studyLogs[0]?.analysisResult?.ai_generated_output?.suggested_questions && (
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <h5 className="font-bold text-purple-700 mb-2 flex items-center gap-1">
                          <span>💡</span> 会話のヒント
                        </h5>
                        <ul className="space-y-2">
                          {reservation.studyLogs
                            .flatMap(
                              (log) =>
                                log.analysisResult?.ai_generated_output?.suggested_questions || []
                            )
                            .slice(0, 3)
                            .map((question, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-700 flex items-start gap-2"
                              >
                                <span className="text-purple-500">•</span>
                                {question}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
