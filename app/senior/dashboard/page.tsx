"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import CalendarAvailability from "@/components/CalendarAvailability";
import CancelReservationModal from "@/components/CancelReservationModal";

interface StudyLog {
  id: string;
  imageUrl: string;
  hostLiked: boolean;
  uploadedAt: string;
}

interface LearnerProfile {
  id: string;
  name: string;
  avatar: string | null;
  country: string | null;
  hometownFood: string | null;
  hometownFoodDesc: string | null;
  hometownPlace: string | null;
  hometownPlaceDesc: string | null;
}

interface ThankYouMessage {
  id: string;
  learnerId: string;
  learnerName: string;
  message: string;
  emoji: string | null;
  isRead: boolean;
  createdAt: string;
  learner?: LearnerProfile;
}

interface Reservation {
  id: string;
  status: string;
  sessionType: string;
  readyToTalk: boolean;
  slot: {
    startTime: string;
    endTime: string;
  };
  learner: {
    id: string;
    name: string;
    country: string | null;
    avatar: string | null;
    jlptLevel: string | null;
  };
  studyLogs: StudyLog[];
}

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status: string;
}

interface HostStats {
  totalSessions: number;
  thisMonthSessions: number;
  totalThankYou: number;
  unreadThankYou: number;
}

interface RankingData {
  myRank: number | null;
  totalHosts: number;
  mySessions: number;
  message: string;
}

export default function SeniorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  // Stats
  const [stats, setStats] = useState<HostStats>({
    totalSessions: 0,
    thisMonthSessions: 0,
    totalThankYou: 0,
    unreadThankYou: 0,
  });

  // Thank you messages feed
  const [thankYouMessages, setThankYouMessages] = useState<ThankYouMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "thanks">("thanks");
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  // Slot management state
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [slotMessage, setSlotMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  // Available now button
  const [creatingNow, setCreatingNow] = useState(false);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Ranking data
  const [rankingData, setRankingData] = useState<RankingData | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchNextReservation();
      fetchMySlots();
      fetchThankYouMessages();
      fetchStats();
      fetchRanking();
    }
  }, [session]);

  const fetchRanking = async () => {
    try {
      const response = await fetch("/api/host/ranking");
      if (response.ok) {
        const data = await response.json();
        setRankingData(data);
      }
    } catch (error) {
      console.error("Failed to fetch ranking:", error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch user stats
      const statsResponse = await fetch("/api/user/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prev => ({
          ...prev,
          totalSessions: statsData.totalSessions || 0,
          thisMonthSessions: statsData.thisMonthSessions || 0,
        }));
      }

      // Fetch thank you messages count
      const messagesResponse = await fetch("/api/thank-you-messages");
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const messages = messagesData.messages || [];
        setStats(prev => ({
          ...prev,
          totalThankYou: messages.length,
          unreadThankYou: messages.filter((m: ThankYouMessage) => !m.isRead).length,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchThankYouMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await fetch("/api/thank-you-messages");
      if (response.ok) {
        const data = await response.json();
        setThankYouMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch thank you messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchNextReservation = async () => {
    try {
      const response = await fetch("/api/host/reservations?status=confirmed&limit=1");
      if (response.ok) {
        const data = await response.json();
        if (data.reservations && data.reservations.length > 0) {
          setNextReservation(data.reservations[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reservation:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySlots = async () => {
    try {
      const response = await fetch("/api/host/slots");
      if (response.ok) {
        const data = await response.json();
        const now = new Date();
        const futureSlots = (data.slots || []).filter(
          (slot: Slot) => new Date(slot.startTime) > now
        );
        setMySlots(futureSlots);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    }
  };

  // Mark message as read
  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/thank-you-messages/${messageId}/read`, {
        method: "POST",
      });
      if (response.ok) {
        setThankYouMessages(prev =>
          prev.map(m => m.id === messageId ? { ...m, isRead: true } : m)
        );
        setStats(prev => ({
          ...prev,
          unreadThankYou: Math.max(0, prev.unreadThankYou - 1),
        }));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Available Now handler
  const handleAvailableNow = async () => {
    setCreatingNow(true);
    setSlotMessage(null);

    try {
      const response = await fetch("/api/senior/available-now", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setSlotMessage({ type: "success", text: data.message });
        fetchMySlots();
      } else {
        setSlotMessage({ type: "error", text: data.error || "登録に失敗しました" });
      }
    } catch (error) {
      setSlotMessage({ type: "error", text: "エラーが発生しました" });
    } finally {
      setCreatingNow(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("この時間を削除しますか？")) return;

    try {
      const response = await fetch(`/api/host/slots/${slotId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSlotMessage({ type: "success", text: "時間を削除しました" });
        fetchMySlots();
      }
    } catch (error) {
      setSlotMessage({ type: "error", text: "削除に失敗しました" });
    }
  };

  const handleLike = async (studyLogId: string) => {
    if (liking) return;
    setLiking(true);

    try {
      const response = await fetch(`/api/study-logs/${studyLogId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        setNextReservation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            studyLogs: prev.studyLogs.map((log) =>
              log.id === studyLogId ? { ...log, hostLiked: true } : log
            ),
          };
        });
      }
    } catch (error) {
      console.error("Failed to like:", error);
    } finally {
      setLiking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日（${weekday}）`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return formatDate(dateStr);
  };

  const isSessionTime = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMinutes = (start.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes <= 5 && diffMinutes >= -25;
  };

  const canJoinSession = nextReservation && isSessionTime(nextReservation.slot.startTime);

  // Handle cancel reservation
  const handleCancelReservation = async (reason: string) => {
    if (!nextReservation) return;

    const response = await fetch(`/api/reservations/${nextReservation.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error("キャンセルに失敗しました");
    }

    // Clear the reservation and refresh
    setNextReservation(null);
    fetchNextReservation();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Cancel Reservation Modal */}
      {nextReservation && (
        <CancelReservationModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelReservation}
          partnerName={nextReservation.learner.name}
          sessionDate={`${formatDate(nextReservation.slot.startTime)} ${formatTime(nextReservation.slot.startTime)}`}
          isJapanese={true}
        />
      )}

      {/* Welcome Message */}
      <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              こんにちは、{session?.user?.name}さん
            </h1>
            <p className="text-xl text-gray-600">
              今日も外国人の方との会話を楽しみましょう
            </p>
          </div>
          <Link
            href="/senior/profile"
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white text-lg font-bold rounded-xl transition-colors"
          >
            プロフィール編集
          </Link>
        </div>
      </div>

      {/* Ranking Card */}
      {rankingData && rankingData.myRank && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">
                {rankingData.myRank <= 3 ? ["🥇", "🥈", "🥉"][rankingData.myRank - 1] : `${rankingData.myRank}位`}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-amber-700">
                  全体{rankingData.totalHosts}人中 {rankingData.myRank}位
                </span>
              </div>
              <p className="text-lg text-amber-800 font-medium">
                {rankingData.message}
              </p>
              <p className="text-sm text-amber-600 mt-1">
                累計{rankingData.mySessions}回のセッションを行いました
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-sky-600 mb-2">{stats.totalSessions}</div>
          <div className="text-gray-600 font-medium">累計セッション</div>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{stats.thisMonthSessions}</div>
          <div className="text-gray-600 font-medium">今月のセッション</div>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-orange-500 mb-2">{stats.totalThankYou}</div>
          <div className="text-gray-600 font-medium">もらった感謝</div>
        </div>
      </div>

      {/* Next Session Card */}
      {nextReservation && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-sky-600 text-white px-8 py-6">
            <h2 className="text-2xl font-bold mb-1">次の会話予定</h2>
            <p className="text-sky-100 text-lg">
              {formatDate(nextReservation.slot.startTime)}
              {formatTime(nextReservation.slot.startTime)}〜
            </p>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center text-5xl">
                {nextReservation.learner.avatar ? (
                  <img
                    src={nextReservation.learner.avatar}
                    alt={nextReservation.learner.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  "🌏"
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {nextReservation.learner.name} さん
                </h3>
                <div className="flex flex-wrap gap-3">
                  {nextReservation.learner.country && (
                    <span className="px-4 py-2 bg-gray-100 rounded-lg text-lg text-gray-700">
                      {nextReservation.learner.country}
                    </span>
                  )}
                  {nextReservation.learner.jlptLevel && (
                    <span className="px-4 py-2 bg-sky-100 rounded-lg text-lg text-sky-700">
                      日本語レベル: {nextReservation.learner.jlptLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {canJoinSession ? (
              <Link
                href={`/senior/session/${nextReservation.id}`}
                className="block w-full py-6 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-xl text-center transition-colors shadow-lg"
              >
                会話を始める
              </Link>
            ) : (
              <div className="space-y-3">
                <div className="w-full py-6 bg-gray-200 text-gray-500 text-2xl font-bold rounded-xl text-center">
                  時間になったらボタンが押せます
                </div>
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 text-lg font-bold rounded-xl text-center transition-colors"
                >
                  この予約をキャンセル
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("thanks")}
          className={`flex-1 py-4 text-xl font-bold rounded-xl transition-colors ${
            activeTab === "thanks"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🙏 お礼メッセージ
          {stats.unreadThankYou > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white text-orange-500 rounded-full text-sm">
              {stats.unreadThankYou}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex-1 py-4 text-xl font-bold rounded-xl transition-colors ${
            activeTab === "schedule"
              ? "bg-sky-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          📅 スケジュール管理
        </button>
      </div>

      {/* Thank You Messages Tab */}
      {activeTab === "thanks" && (
        <div className="space-y-4">
          {loadingMessages ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">メッセージを読み込み中...</p>
            </div>
          ) : thankYouMessages.length === 0 ? (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🙏</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                まだお礼メッセージがありません
              </h2>
              <p className="text-xl text-gray-600">
                セッション後に学習者からメッセージが届きます
              </p>
            </div>
          ) : (
            <>
            {thankYouMessages.map((message) => {
              const isExpanded = expandedMessageId === message.id;
              return (
                <div
                  key={message.id}
                  className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
                    message.isRead
                      ? "border-gray-200"
                      : "border-orange-300 bg-orange-50"
                  }`}
                >
                  {/* Collapsed Header - Always Visible */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      if (!message.isRead) handleMarkAsRead(message.id);
                      setExpandedMessageId(isExpanded ? null : message.id);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                        {message.learner?.avatar ? (
                          <img
                            src={message.learner.avatar}
                            alt={message.learnerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          message.emoji || "🙏"
                        )}
                      </div>

                      {/* Name and Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {message.learnerName} さん
                          </h3>
                          {!message.isRead && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-medium rounded-full flex-shrink-0">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatRelativeTime(message.createdAt)}
                        </p>
                      </div>

                      {/* Toggle Button */}
                      <button className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                        <span className={`text-xl transform transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                          ▼
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-white">
                      {/* Message Content */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">💬 メッセージ</h4>
                        <p className="text-lg text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">
                          {message.message}
                        </p>
                      </div>

                      {/* Hometown Pride Section */}
                      {(message.learner?.hometownFood || message.learner?.hometownPlace) && (
                        <div className="border-t border-gray-200 pt-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-4">
                            🌍 {message.learnerName}さんの地元の自慢
                          </h4>

                          {message.learner?.hometownFood && (
                            <div className="mb-4 bg-orange-50 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🍛</span>
                                <span className="font-bold text-gray-900">{message.learner.hometownFood}</span>
                              </div>
                              {message.learner.hometownFoodDesc && (
                                <p className="text-gray-600 ml-7">{message.learner.hometownFoodDesc}</p>
                              )}
                            </div>
                          )}

                          {message.learner?.hometownPlace && (
                            <div className="bg-sky-50 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">🏛️</span>
                                <span className="font-bold text-gray-900">{message.learner.hometownPlace}</span>
                              </div>
                              {message.learner.hometownPlaceDesc && (
                                <p className="text-gray-600 ml-7">{message.learner.hometownPlaceDesc}</p>
                              )}
                            </div>
                          )}

                          {/* Hint */}
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              💝 {message.learnerName}さんの故郷について、次の会話で聞いてみましょう！
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Country info if no hometown but has country */}
                      {message.learner?.country && !message.learner?.hometownFood && !message.learner?.hometownPlace && (
                        <div className="border-t border-gray-200 pt-6">
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-gray-600">
                              🌍 出身: <span className="font-medium">{message.learner.country}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Amazon アフィリエイトセクション */}
            <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">
                🇮🇳 インドのチャイはいかがですか？
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                生徒さんの故郷の味を体験してみませんか？
              </p>
              <a
                href="https://www.amazon.co.jp/dp/B0FBM1LN31?tag=dojojp-22"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition"
              >
                Amazonで見る →
              </a>
              <p className="text-xs text-gray-500 mt-3">
                ※ このリンクからのご購入がDo Joの運営支援になります。ありがとうございます。
              </p>
            </div>
            </>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <>
          {/* Message */}
          {slotMessage && (
            <div className={`mb-6 p-4 rounded-xl text-lg font-medium ${
              slotMessage.type === "success"
                ? "bg-green-100 text-green-700 border-2 border-green-200"
                : "bg-red-100 text-red-700 border-2 border-red-200"
            }`}>
              {slotMessage.text}
            </div>
          )}

          {/* Available Now Button */}
          <div className="mb-8">
            <button
              onClick={handleAvailableNow}
              disabled={creatingNow}
              className="w-full py-8 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-2xl transition-colors shadow-lg border-4 border-green-600"
            >
              <div className="text-4xl font-bold mb-2">
                {creatingNow ? "登録中..." : "🟢 今から話せます！"}
              </div>
              <div className="text-xl opacity-90">
                （10分後から30分間、予約を受け付けます）
              </div>
            </button>
          </div>

          {/* My Slots List */}
          {mySlots.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 登録済みの時間</h2>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                <p className="text-green-700 font-medium">✅ 予約枠を作成しました！外国人の方からの予約を待っています。</p>
              </div>
              <div className="space-y-3">
                {mySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        slot.sessionType === "casual" ? "bg-purple-100" : "bg-amber-100"
                      }`}>
                        {slot.sessionType === "casual" ? "🎓" : "💼"}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          {formatDate(slot.startTime)} {formatTime(slot.startTime)}
                        </p>
                        <p className="text-gray-500">
                          {slot.sessionType === "casual" ? "カジュアル" : "ビジネス"} •
                          {slot.status === "available" ? " 予約可能" :
                           slot.status === "reserved" ? " 予約済み" :
                           slot.status === "completed" ? " 完了" : " キャンセル済み"}
                        </p>
                      </div>
                    </div>
                    {slot.status === "available" && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors"
                      >
                        削除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Schedule */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">カレンダーから日付を選択</h2>
              <p className="text-lg text-gray-600">
                日付をタップして、対応可能な時間を登録してください
              </p>
            </div>
            <CalendarAvailability onSlotsChange={fetchMySlots} />
          </div>

          {/* Help Section */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              会話のヒント
            </h3>
            <ul className="space-y-3 text-lg text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>ゆっくり、はっきり話しましょう</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>相手の学習記録について質問してみましょう</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>間違いがあっても優しく教えてあげましょう</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
