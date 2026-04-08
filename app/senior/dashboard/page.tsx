"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  reservation?: {
    id: string;
    learner: {
      id: string;
      name: string;
      avatar?: string;
      country?: string;
      nativeLanguage?: string;
      jlptLevel?: string;
    };
    selectedTopic?: string;
    targetWords?: string[];
  };
}

export default function SeniorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [seniorCount, setSeniorCount] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchSlots();
    fetchSeniorCount();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await fetch("/api/host/slots");
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error("予定の取得に失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeniorCount = async () => {
    try {
      const response = await fetch("/api/users/senior-count");
      if (response.ok) {
        const data = await response.json();
        setSeniorCount(data.count);
      }
    } catch (error) {
      console.error("日本人数の取得に失敗:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}(${weekday})`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleCancelSlot = async (slotId: string) => {
    if (!confirm("この予定をキャンセルしますか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/senior/slots/${slotId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "キャンセルに失敗しました");
      }

      // Refresh slots
      fetchSlots();
    } catch (error) {
      console.error("キャンセルエラー:", error);
      alert(error instanceof Error ? error.message : "エラーが発生しました");
    }
  };

  // 今週と来週の予定に絞る
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingSlots = slots
    .filter(slot => {
      const slotDate = new Date(slot.startTime);
      return slotDate >= now && slotDate <= twoWeeksLater;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const bookedSlots = upcomingSlots.filter(slot => slot.reservation);
  const availableSlots = upcomingSlots.filter(slot => !slot.reservation);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1
            className="text-2xl font-extrabold"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: "linear-gradient(135deg, #00A8CC 0%, #006B7D 50%, #FF6B35 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Do-Jo
          </h1>

          <div className="flex items-center gap-4">
            <Link
              href="/senior/profile"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 挨拶 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            👋 こんにちは、{session?.user?.name}さん
          </h2>
          <p className="text-gray-600" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            {seniorCount !== null && (
              <span>現在、{seniorCount}人の日本人が登録しています。</span>
            )}
          </p>
        </div>

        {/* LINE bot未追加の場合のバナー */}
        {!session?.user?.lineId && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-md">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💬</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    LINE通知を受け取りましょう！
                  </h3>
                  <p className="text-white/90 text-sm mb-4">
                    予約が入ったらLINEでお知らせします。Do Jo公式アカウントを友だち追加してください。
                  </p>
                  <a
                    href="https://lin.ee/QitILwY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm"
                  >
                    友だち追加する →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 予定登録ボタン（大きく目立つ） */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  📅 来週の予定を登録しましょう
                </h3>
                <p className="text-white/90 text-sm mb-4">
                  あなたの空いている時間を教えてください
                </p>
                <Link
                  href="/senior/schedule/create"
                  className="inline-block bg-white text-sky-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  予定を登録する →
                </Link>
              </div>
              <div className="hidden sm:block text-6xl">
                📝
              </div>
            </div>
          </div>
        </div>

        {/* 予約済みの予定 */}
        {bookedSlots.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              <span className="text-2xl">🔴</span>
              予約済みの予定
            </h3>
            <div className="space-y-3">
              {bookedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl p-4 border-2 border-red-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {slot.reservation?.learner.avatar ? (
                        <img
                          src={slot.reservation.learner.avatar}
                          alt={slot.reservation.learner.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">
                          {slot.reservation?.learner.name || "予約者"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(slot.startTime)} {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                      予約済み
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空き枠 */}
        {availableSlots.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              <span className="text-2xl">🟢</span>
              空き枠
            </h3>
            <div className="space-y-3">
              {availableSlots.slice(0, 10).map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {formatDate(slot.startTime)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                        空き
                      </span>
                      <button
                        onClick={() => handleCancelSlot(slot.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full hover:bg-red-200 transition-all"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {availableSlots.length > 10 && (
                <p className="text-center text-gray-500 text-sm pt-2">
                  他 {availableSlots.length - 10} 件の空き枠
                </p>
              )}
            </div>
          </div>
        )}

        {/* 予定がない場合 */}
        {upcomingSlots.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              予定がまだありません
            </h3>
            <p className="text-gray-600 mb-6">
              上の「予定を登録する」ボタンから<br />
              空いている時間を教えてください
            </p>
          </div>
        )}

        {/* クイックリンク */}
        <div className="mt-12 grid grid-cols-2 gap-6">
          <Link
            href="/senior/schedule/create"
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 hover:shadow-lg transition-all text-center text-white"
          >
            <div className="text-5xl mb-3">📅</div>
            <p className="text-xl font-bold mb-1">予約枠を作成</p>
            <p className="text-sm text-white/80">空いている時間を登録</p>
          </Link>
          <Link
            href="/senior/profile"
            className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all text-center"
          >
            <div className="text-5xl mb-3">⚙️</div>
            <p className="text-xl font-bold text-gray-900 mb-1">設定</p>
            <p className="text-sm text-gray-600">プロフィール編集</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
