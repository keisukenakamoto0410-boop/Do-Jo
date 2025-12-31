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

export default function SeniorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchNextReservation();
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

  const handleLike = async (studyLogId: string) => {
    if (liking) return;
    setLiking(true);

    try {
      const response = await fetch(`/api/study-logs/${studyLogId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        // Update local state
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
          こんにちは、{session?.user?.name}さん 👋
        </h1>
        <p className="text-xl text-gray-600">
          今日も外国人の方との会話を楽しみましょう
        </p>
      </div>

      {/* Next Session Card */}
      {nextReservation ? (
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-sky-600 text-white px-8 py-6">
            <h2 className="text-2xl font-bold mb-1">次の会話予定</h2>
            <p className="text-sky-100 text-lg">
              {formatDate(nextReservation.slot.startTime)}
              {formatTime(nextReservation.slot.startTime)}〜
            </p>
          </div>

          {/* Learner Info */}
          <div className="p-8">
            <div className="flex items-center gap-6 mb-8">
              {/* Avatar */}
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

              {/* Info */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {nextReservation.learner.name} さん
                </h3>
                <div className="flex flex-wrap gap-3">
                  {nextReservation.learner.country && (
                    <span className="px-4 py-2 bg-gray-100 rounded-lg text-lg text-gray-700">
                      🌍 {nextReservation.learner.country}
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

            {/* Study Log Preview */}
            {nextReservation.studyLogs.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  📚 最近の学習記録
                </h4>
                <div className="bg-gray-50 rounded-xl p-6">
                  <img
                    src={nextReservation.studyLogs[0].imageUrl}
                    alt="学習記録"
                    className="w-full max-h-80 object-contain rounded-lg mb-4"
                  />

                  {/* Like Button */}
                  {!nextReservation.studyLogs[0].hostLiked ? (
                    <button
                      onClick={() => handleLike(nextReservation.studyLogs[0].id)}
                      disabled={liking}
                      className="w-full py-5 bg-pink-500 hover:bg-pink-600 text-white text-2xl font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      <span className="text-3xl">👍</span>
                      いいね！を送る
                    </button>
                  ) : (
                    <div className="w-full py-5 bg-pink-100 text-pink-700 text-2xl font-bold rounded-xl flex items-center justify-center gap-3">
                      <span className="text-3xl">✓</span>
                      いいね！済み
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Join Session Button */}
            {canJoinSession ? (
              <Link
                href={`/senior/session/${nextReservation.id}`}
                className="block w-full py-6 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-xl text-center transition-colors shadow-lg"
              >
                🎥 会話を始める
              </Link>
            ) : (
              <div className="w-full py-6 bg-gray-200 text-gray-500 text-2xl font-bold rounded-xl text-center">
                時間になったらボタンが押せます
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No Upcoming Session */
        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-12 text-center mb-8">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            予定されている会話はありません
          </h2>
          <p className="text-xl text-gray-600">
            新しい予約が入りましたらお知らせします
          </p>
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
    </div>
  );
}
