"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface StudyLog {
  id: string;
  imageUrl: string;
  hostLiked: boolean;
  uploadedAt: string;
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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  isOwn: boolean;
}

interface StudyPost {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    country: string | null;
    jlptLevel: string | null;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  comments: Comment[];
}

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface WeeklySchedule {
  [key: string]: DaySchedule;
}

const DAYS = [
  { key: "monday", label: "月曜日" },
  { key: "tuesday", label: "火曜日" },
  { key: "wednesday", label: "水曜日" },
  { key: "thursday", label: "木曜日" },
  { key: "friday", label: "金曜日" },
  { key: "saturday", label: "土曜日" },
  { key: "sunday", label: "日曜日" },
];

export default function SeniorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  // Study posts feed
  const [posts, setPosts] = useState<StudyPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "feed">("feed");

  // Slot management state
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [slotMessage, setSlotMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  // Available now button
  const [creatingNow, setCreatingNow] = useState(false);

  // Weekly schedule
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() => {
    const initial: WeeklySchedule = {};
    DAYS.forEach(day => {
      initial[day.key] = { enabled: false, startTime: "10:00", endTime: "12:00" };
    });
    return initial;
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Single slot (collapsed by default)
  const [showSingleSlot, setShowSingleSlot] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [creatingSlot, setCreatingSlot] = useState(false);

  // Comment input
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchNextReservation();
      fetchMySlots();
      fetchPosts();
    }
  }, [session]);

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

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch("/api/study-posts/feed");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Handle like
  const handleLikePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/study-posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    setSubmittingComment(postId);
    try {
      const response = await fetch(`/api/study-posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [data.comment, ...post.comments],
              commentCount: post.commentCount + 1,
            };
          }
          return post;
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      }
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setSubmittingComment(null);
    }
  };

  // Handle comment delete
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("このコメントを削除しますか？")) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.filter(c => c.id !== commentId),
              commentCount: post.commentCount - 1,
            };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error("Delete comment error:", error);
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

  // Weekly schedule handler
  const handleWeeklySchedule = async () => {
    setSavingSchedule(true);
    setSlotMessage(null);

    try {
      const response = await fetch("/api/senior/weekly-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: weeklySchedule }),
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
      setSavingSchedule(false);
    }
  };

  const updateDaySchedule = (day: string, field: keyof DaySchedule, value: boolean | string) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  // Single slot handler
  const handleCreateSlot = async () => {
    if (!selectedDate || !selectedTime) {
      setSlotMessage({ type: "error", text: "日付と時間を選択してください" });
      return;
    }

    setCreatingSlot(true);
    setSlotMessage(null);

    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);

      const response = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          sessionType: "casual",
        }),
      });

      if (response.ok) {
        setSlotMessage({ type: "success", text: "対応可能時間を登録しました！" });
        setSelectedDate("");
        setSelectedTime("");
        fetchMySlots();
      } else {
        const data = await response.json();
        if (data.error === "Slot overlaps with existing slot") {
          setSlotMessage({ type: "error", text: "この時間はすでに登録されています" });
        } else {
          setSlotMessage({ type: "error", text: "登録に失敗しました" });
        }
      }
    } catch (error) {
      setSlotMessage({ type: "error", text: "エラーが発生しました" });
    } finally {
      setCreatingSlot(false);
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

  // Generate time options
  const timeOptions = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 21) {
      timeOptions.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 28);
  const maxDateStr = maxDate.toISOString().split("T")[0];

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
      {/* Welcome Message */}
      <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          こんにちは、{session?.user?.name}さん
        </h1>
        <p className="text-xl text-gray-600">
          今日も外国人の方との会話を楽しみましょう
        </p>
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
              <div className="w-full py-6 bg-gray-200 text-gray-500 text-2xl font-bold rounded-xl text-center">
                時間になったらボタンが押せます
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex-1 py-4 text-xl font-bold rounded-xl transition-colors ${
            activeTab === "feed"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          📚 学習者の投稿
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

      {/* Feed Tab */}
      {activeTab === "feed" && (
        <div className="space-y-6">
          {loadingPosts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">投稿を読み込み中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                まだ投稿がありません
              </h2>
              <p className="text-xl text-gray-600">
                学習者が投稿するとここに表示されます
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                {/* Post Header */}
                <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                    {post.user.avatar ? (
                      <img
                        src={post.user.avatar}
                        alt={post.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      "🌏"
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{post.user.name}</h3>
                    <div className="flex items-center gap-2 text-gray-500">
                      {post.user.country && <span>{post.user.country}</span>}
                      {post.user.jlptLevel && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-sm">
                          {post.user.jlptLevel}
                        </span>
                      )}
                      <span>・{formatRelativeTime(post.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Post Image */}
                <img
                  src={post.imageUrl}
                  alt="学習記録"
                  className="w-full max-h-[500px] object-contain bg-gray-50"
                />

                {/* Post Actions */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-bold transition-colors ${
                        post.isLiked
                          ? "bg-pink-100 text-pink-600"
                          : "bg-gray-100 text-gray-600 hover:bg-pink-50"
                      }`}
                    >
                      {post.isLiked ? "❤️" : "🤍"} {post.likeCount}
                    </button>
                    <span className="text-gray-500 text-lg">
                      💬 {post.commentCount} コメント
                    </span>
                  </div>

                  {post.caption && (
                    <p className="text-gray-700 text-lg mb-4">{post.caption}</p>
                  )}

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                            {comment.user.avatar ? (
                              <img
                                src={comment.user.avatar}
                                alt={comment.user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              "👤"
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{comment.user.name}</span>
                              <span className="text-gray-400 text-sm">{formatRelativeTime(comment.createdAt)}</span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                          {comment.isOwn && (
                            <button
                              onClick={() => handleDeleteComment(post.id, comment.id)}
                              className="text-gray-400 hover:text-red-500 text-sm"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="コメントを入力..."
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none text-lg"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      disabled={!commentInputs[post.id]?.trim() || submittingComment === post.id}
                      className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
                    >
                      {submittingComment === post.id ? "..." : "送信"}
                    </button>
                  </div>
                </div>
              </div>
            ))
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

          {/* Weekly Schedule Section */}
          <div className="bg-white border-2 border-sky-200 rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="bg-sky-600 text-white px-8 py-6">
              <h2 className="text-2xl font-bold mb-1">毎週の予定を登録</h2>
              <p className="text-sky-100 text-lg">
                曜日ごとに対応可能な時間を設定（4週間分まとめて登録）
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div key={day.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklySchedule[day.key].enabled}
                        onChange={(e) => updateDaySchedule(day.key, "enabled", e.target.checked)}
                        className="w-6 h-6 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xl font-bold text-gray-900 w-20">{day.label}</span>
                    </label>

                    {weeklySchedule[day.key].enabled && (
                      <div className="flex items-center gap-2 ml-auto">
                        <select
                          value={weeklySchedule[day.key].startTime}
                          onChange={(e) => updateDaySchedule(day.key, "startTime", e.target.value)}
                          className="px-4 py-2 text-lg border-2 border-gray-300 rounded-lg focus:border-sky-500 focus:outline-none"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-xl text-gray-600">〜</span>
                        <select
                          value={weeklySchedule[day.key].endTime}
                          onChange={(e) => updateDaySchedule(day.key, "endTime", e.target.value)}
                          className="px-4 py-2 text-lg border-2 border-gray-300 rounded-lg focus:border-sky-500 focus:outline-none"
                        >
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleWeeklySchedule}
                disabled={savingSchedule || !DAYS.some(d => weeklySchedule[d.key].enabled)}
                className="w-full mt-6 py-5 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white text-2xl font-bold rounded-xl transition-colors"
              >
                {savingSchedule ? "登録中..." : "この予定で登録する"}
              </button>
            </div>
          </div>

          {/* Single Slot (Collapsible) */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-8">
            <button
              onClick={() => setShowSingleSlot(!showSingleSlot)}
              className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900">単発で時間を登録</h2>
                <p className="text-gray-600">特定の日時を1つずつ登録する場合</p>
              </div>
              <span className="text-2xl text-gray-400">
                {showSingleSlot ? "▲" : "▼"}
              </span>
            </button>

            {showSingleSlot && (
              <div className="p-8 border-t-2 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xl font-bold text-gray-900 mb-3">
                      日付を選ぶ
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={today}
                      max={maxDateStr}
                      className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xl font-bold text-gray-900 mb-3">
                      時間を選ぶ
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-sky-500 focus:outline-none"
                    >
                      <option value="">時間を選んでください</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCreateSlot}
                  disabled={creatingSlot || !selectedDate || !selectedTime}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white text-xl font-bold rounded-xl transition-colors"
                >
                  {creatingSlot ? "登録中..." : "この時間を登録する"}
                </button>
              </div>
            )}
          </div>

          {/* My Slots List */}
          {mySlots.length > 0 && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-8">
              <div className="px-8 py-6 border-b-2 border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  登録済みの時間（{mySlots.length}件）
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200"
                    >
                      <div className="text-lg">
                        <span className="font-bold text-gray-900">
                          {formatDate(slot.startTime)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          {formatTime(slot.startTime)}〜
                        </span>
                        <span className={`ml-3 px-3 py-1 rounded-lg text-sm font-medium ${
                          slot.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {slot.status === "available" ? "予約可能" : "予約済み"}
                        </span>
                      </div>
                      {slot.status === "available" && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-colors"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
