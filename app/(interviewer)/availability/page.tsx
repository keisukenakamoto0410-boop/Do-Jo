"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { CenteredSpinner } from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  jobCategory: string;
  notes?: string;
  status: string;
  isBooked: boolean;
  interview?: {
    candidate: {
      name: string;
    };
  };
}

interface Stats {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  pastSlots: number;
}

export default function AvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Modal form state
  const [jobCategory, setJobCategory] = useState("IT");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSlots();
    }
  }, [status, currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      const weekEnd = getWeekEnd(currentWeekStart);

      const response = await fetch(
        `/api/interview-slots/my-slots?startDate=${currentWeekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
      );

      if (!response.ok) {
        throw new Error("スロットの取得に失敗しました");
      }

      const data = await response.json();
      setSlots(data.slots);
      setStats(data.stats);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotClick = (date: Date, time: string) => {
    const slotTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    slotTime.setHours(hours, minutes, 0, 0);

    // Check if slot already exists
    const existingSlot = slots.find((slot) => {
      const start = new Date(slot.startTime);
      return start.getTime() === slotTime.getTime();
    });

    if (existingSlot) {
      // Delete slot
      handleDeleteSlot(existingSlot);
    } else {
      // Create slot
      setSelectedSlot({ date, time });
      setShowModal(true);
    }
  };

  const handleCreateSlot = async () => {
    if (!selectedSlot) return;

    try {
      setIsCreating(true);
      const startTime = new Date(selectedSlot.date);
      const [hours, minutes] = selectedSlot.time.split(":").map(Number);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const slotsToCreate = [];

      if (isRecurring) {
        // Create slots for the next 8 weeks
        for (let week = 0; week < 8; week++) {
          const weeklyStart = new Date(startTime);
          weeklyStart.setDate(weeklyStart.getDate() + week * 7);
          const weeklyEnd = new Date(endTime);
          weeklyEnd.setDate(weeklyEnd.getDate() + week * 7);

          slotsToCreate.push({
            startTime: weeklyStart.toISOString(),
            endTime: weeklyEnd.toISOString(),
            jobCategory,
            notes,
          });
        }

        const response = await fetch("/api/interview-slots/bulk-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots: slotsToCreate }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "スロットの作成に失敗しました");
        }

        toast.success(`${slotsToCreate.length}件のスロットを作成しました`);
      } else {
        const response = await fetch("/api/interview-slots/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            jobCategory,
            notes,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "スロットの作成に失敗しました");
        }

        toast.success("スロットを作成しました");
      }

      setShowModal(false);
      setNotes("");
      setIsRecurring(false);
      fetchSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSlot = async (slot: Slot) => {
    if (slot.isBooked) {
      toast.warning("予約済みのスロットは削除できません");
      return;
    }

    if (!confirm("このスロットを削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/interview-slots/${slot.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "スロットの削除に失敗しました");
      }

      toast.success("スロットを削除しました");
      fetchSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    }
  };

  const handleCopyWeek = async () => {
    if (!confirm("今週のスロットを来週にコピーしますか？")) {
      return;
    }

    try {
      const nextWeekStart = new Date(currentWeekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);

      const slotsToCreate = slots
        .filter((slot) => !slot.isBooked && new Date(slot.startTime) > new Date())
        .map((slot) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);
          start.setDate(start.getDate() + 7);
          end.setDate(end.getDate() + 7);

          return {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            jobCategory: slot.jobCategory,
            notes: slot.notes,
          };
        });

      if (slotsToCreate.length === 0) {
        toast.warning("コピーできるスロットがありません");
        return;
      }

      const response = await fetch("/api/interview-slots/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slotsToCreate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "スロットのコピーに失敗しました");
      }

      toast.success(`${slotsToCreate.length}件のスロットを来週にコピーしました`);

      // Move to next week to show copied slots
      setCurrentWeekStart(nextWeekStart);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "エラーが発生しました");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("すべての利用可能なスロットを削除しますか？この操作は取り消せません。")) {
      return;
    }

    try {
      const availableSlots = slots.filter((slot) => !slot.isBooked);

      for (const slot of availableSlots) {
        await fetch(`/api/interview-slots/${slot.id}`, {
          method: "DELETE",
        });
      }

      toast.success(`${availableSlots.length}件のスロットを削除しました`);
      fetchSlots();
    } catch (error) {
      toast.error("スロットの削除に失敗しました");
    }
  };

  const getSlotForTime = (date: Date, time: string): Slot | undefined => {
    const slotTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    slotTime.setHours(hours, minutes, 0, 0);

    return slots.find((slot) => {
      const start = new Date(slot.startTime);
      return start.getTime() === slotTime.getTime();
    });
  };

  const getSlotColor = (slot: Slot | undefined, date: Date, time: string): string => {
    const slotTime = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    slotTime.setHours(hours, minutes, 0, 0);

    if (slotTime < new Date()) {
      return "bg-gray-100 text-gray-400 cursor-not-allowed";
    }

    if (!slot) {
      return "bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all";
    }

    if (slot.isBooked) {
      return "bg-blue-500 text-white cursor-not-allowed";
    }

    return "bg-green-500 text-white hover:bg-green-600 cursor-pointer transition-all";
  };

  const formatWeekRange = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);

    return `${currentWeekStart.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    })}`;
  };

  const generateTimeSlots = () => {
    const times = [];
    for (let hour = 9; hour <= 20; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour < 20) {
        times.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return times;
  };

  const generateWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  if (status === "loading" || isLoading) {
    return <CenteredSpinner size="lg" text="読み込み中..." fullScreen />;
  }

  const weekDays = generateWeekDays();
  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            予約枠管理
          </h1>
          <p className="text-gray-600">
            面接可能な時間帯を設定・管理します
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">今週の総スロット</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSlots}</p>
                </div>
                <div className="bg-gray-100 rounded-full p-3">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">予約可能</p>
                  <p className="text-2xl font-bold text-green-600">{stats.availableSlots}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">予約済み</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.bookedSlots}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">過去</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.pastSlots}</p>
                </div>
                <div className="bg-gray-100 rounded-full p-3">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Toolbar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleCopyWeek}
              leftIcon={<span>📋</span>}
            >
              今週を来週にコピー
            </Button>
            <Button
              variant="outline"
              onClick={handleClearAll}
              leftIcon={<span>🗑️</span>}
            >
              全スロット削除
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-600">凡例:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                <span className="text-xs text-gray-600">未設定</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">予約可能</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">予約済み</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span className="text-xs text-gray-600">過去</span>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                const newDate = new Date(currentWeekStart);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentWeekStart(newDate);
              }}
              leftIcon={<span>←</span>}
            >
              前週
            </Button>

            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{formatWeekRange()}</p>
              <p className="text-sm text-gray-600">
                {currentWeekStart.getFullYear()}年
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setCurrentWeekStart(getWeekStart(new Date()))}
              >
                今週
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newDate = new Date(currentWeekStart);
                  newDate.setDate(newDate.getDate() + 7);
                  setCurrentWeekStart(newDate);
                }}
                rightIcon={<span>→</span>}
              >
                次週
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b-2 border-gray-300">
                <div className="p-3 bg-gray-50 font-semibold text-sm text-gray-700">
                  時間
                </div>
                {weekDays.map((day, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 text-center border-l border-gray-200"
                  >
                    <div className="font-semibold text-gray-900">
                      {day.toLocaleDateString("ja-JP", { weekday: "short" })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {day.toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-8 border-b border-gray-200">
                  <div className="p-3 bg-gray-50 text-sm font-medium text-gray-700 flex items-center">
                    {time}
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const slot = getSlotForTime(day, time);
                    const colorClass = getSlotColor(slot, day, time);

                    return (
                      <div
                        key={dayIndex}
                        className={`p-2 border-l border-gray-200 min-h-[60px] ${colorClass}`}
                        onClick={() => {
                          const slotTime = new Date(day);
                          const [hours, minutes] = time.split(":").map(Number);
                          slotTime.setHours(hours, minutes, 0, 0);

                          if (slotTime >= new Date()) {
                            handleSlotClick(day, time);
                          }
                        }}
                        title={
                          slot
                            ? slot.isBooked
                              ? `予約済み: ${slot.interview?.candidate.name}`
                              : `${slot.jobCategory} - クリックで削除`
                            : "クリックで追加"
                        }
                      >
                        {slot && (
                          <div className="text-xs">
                            <div className="font-semibold">{slot.jobCategory}</div>
                            {slot.isBooked && slot.interview && (
                              <div className="truncate">{slot.interview.candidate.name}</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slot Creation Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              スロットを作成
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                日時:{" "}
                {selectedSlot.date.toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}{" "}
                {selectedSlot.time} - {selectedSlot.time.split(":")[0]}:30
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                職種カテゴリー <span className="text-red-500">*</span>
              </label>
              <select
                value={jobCategory}
                onChange={(e) => setJobCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="IT">IT</option>
                <option value="営業">営業</option>
                <option value="事務">事務</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ（任意）
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="このスロットに関するメモ"
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  毎週繰り返し（8週間分作成）
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNotes("");
                  setIsRecurring(false);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={isCreating}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? "作成中..." : "作成"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
