"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import CalendarAvailability from "@/components/CalendarAvailability";

interface Slot {
  id: string;
  hostId: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  status: string;
  reservation?: {
    id: string;
    status: string;
    learner: {
      id: string;
      name: string;
      avatar: string | null;
      country: string | null;
    };
  } | null;
}

export default function HostSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState("business");
  const [viewMode, setViewMode] = useState<"daily" | "all">("all"); // Default to all slots
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

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
      if (viewMode === "all") {
        fetchAllSlots();
      } else {
        fetchSlots();
      }
    }
  }, [session, viewDate, viewMode]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/host/slots?date=${viewDate}`);
      const data = await res.json();

      if (res.ok) {
        setSlots(data.slots);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/host/slots?all=true`);
      const data = await res.json();

      if (res.ok) {
        setAllSlots(data.slots);
      }
    } catch (error) {
      console.error("Failed to fetch all slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSlot = async () => {
    if (!selectedDate || !selectedTime) {
      alert("日付と時間を選択してください");
      return;
    }

    setCreating(true);
    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}`);

      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          sessionType: selectedType,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setSelectedDate("");
        setSelectedTime("");
        if (viewMode === "all") {
          fetchAllSlots();
        } else {
          fetchSlots();
        }
      } else {
        const data = await res.json();
        alert(data.error || "予約枠の作成に失敗しました");
      }
    } catch (error) {
      console.error("Failed to create slot:", error);
      alert("予約枠の作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    if (!confirm("この予約枠を削除しますか？")) return;

    try {
      const res = await fetch(`/api/host/slots/${slotId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (viewMode === "all") {
          fetchAllSlots();
        } else {
          fetchSlots();
        }
      } else {
        const data = await res.json();
        alert(data.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete slot:", error);
      alert("削除に失敗しました");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Generate time slots (9:00 - 22:00, every 30 minutes)
  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }

  // Generate next 7 days for date navigation
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }

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
                className={`${isSenior ? "text-amber-600" : "text-purple-600"} font-medium`}
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
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isSenior ? "🏯" : "🎓"}</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-20 lg:pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">スケジュール管理</h1>
          <button
            onClick={() => setShowModal(true)}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-white ${
              isSenior
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            + 予約枠を作成
          </button>
        </div>

        {/* Calendar View */}
        <div className="mb-8">
          <CalendarAvailability onSlotsChange={viewMode === "all" ? fetchAllSlots : fetchSlots} />
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "all"
                  ? isSenior
                    ? "bg-amber-600 text-white"
                    : "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全ての予約枠
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "daily"
                  ? isSenior
                    ? "bg-amber-600 text-white"
                    : "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              日別表示
            </button>
          </div>

          {/* Date Navigation - only show in daily mode */}
          {viewMode === "daily" && (
            <div className="flex gap-2 overflow-x-auto">
              {dates.map((date) => {
                const dateObj = new Date(date);
                const isToday = date === today.toISOString().split("T")[0];
                const isSelected = date === viewDate;

                return (
                  <button
                    key={date}
                    onClick={() => setViewDate(date)}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl text-center transition-colors ${
                      isSelected
                        ? isSenior
                          ? "bg-amber-600 text-white"
                          : "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <p className="text-xs">
                      {dateObj.toLocaleDateString("ja-JP", { weekday: "short" })}
                    </p>
                    <p className="text-lg font-bold">{dateObj.getDate()}</p>
                    {isToday && (
                      <p className="text-xs">今日</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {viewMode === "all" ? "全ての予約枠" : formatDate(viewDate)}
        </h2>

        {/* Slots */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isSenior ? "border-amber-600" : "border-purple-600"}`}
            ></div>
          </div>
        ) : (viewMode === "all" ? allSlots : slots).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-xl text-gray-600">
              {viewMode === "all" ? "予約枠がありません" : "この日の予約枠はありません"}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className={`mt-4 px-6 py-2 rounded-lg text-white ${
                isSenior ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              予約枠を作成
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(viewMode === "all" ? allSlots : slots).map((slot) => (
              <div
                key={slot.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 ${
                  slot.status === "booked"
                    ? "border-green-500"
                    : slot.sessionType === "business"
                      ? "border-amber-500"
                      : "border-purple-500"
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {viewMode === "all" && (
                        <p className="text-sm text-gray-500 mb-1">
                          {formatDate(slot.startTime)}
                        </p>
                      )}
                      <p className="font-bold text-2xl text-gray-900">
                        {formatTime(slot.startTime)}
                      </p>
                      <p className="text-sm text-gray-500">25分間</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        slot.status === "booked"
                          ? "bg-green-100 text-green-800"
                          : slot.sessionType === "business"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {slot.status === "booked"
                        ? "予約済み"
                        : slot.sessionType === "business"
                          ? "ビジネス"
                          : "カジュアル"}
                    </span>
                  </div>

                  {slot.reservation ? (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-500">予約者</p>
                      <p className="font-medium text-gray-900">
                        {slot.reservation.learner.name}
                        {slot.reservation.learner.country && (
                          <span className="text-gray-500 ml-1">
                            ({slot.reservation.learner.country})
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-3">
                      まだ予約されていません
                    </p>
                  )}

                  <div className="flex gap-2">
                    {slot.status === "booked" && slot.reservation ? (
                      <Link
                        href={`/session/${slot.reservation.id}`}
                        className={`flex-1 px-4 py-2 text-center rounded-lg font-medium text-white ${
                          isSenior
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        セッションに参加
                      </Link>
                    ) : (
                      <button
                        onClick={() => deleteSlot(slot.id)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              予約枠を作成
            </h2>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today.toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始時間
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">時間を選択</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  セッションタイプ
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedType("business")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedType === "business"
                        ? "bg-amber-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🏯 ビジネス
                  </button>
                  <button
                    onClick={() => setSelectedType("casual")}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedType === "casual"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🎓 カジュアル
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={createSlot}
                disabled={creating}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${
                  isSenior
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {creating ? "作成中..." : "作成"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
