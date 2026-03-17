"use client";

import { useState, useEffect } from "react";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  sessionType: string;
}

interface CalendarAvailabilityProps {
  onSlotsChange?: () => void;
}

export default function CalendarAvailability({ onSlotsChange }: CalendarAvailabilityProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("16:00");
  const [sessionType, setSessionType] = useState("both");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Time slots from 10:00 to 21:00 in 30-minute increments
  const timeSlots = [];
  for (let hour = 10; hour <= 21; hour++) {
    if (hour < 21) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
      timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    } else {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
  }

  useEffect(() => {
    fetchSlots();
  }, [currentDate]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

      const res = await fetch(
        `/api/host/slots?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getSlotsForDate = (date: Date): Slot[] => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.startTime);
      return (
        slotDate.getDate() === date.getDate() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return; // Can't select past dates

    setSelectedDate(date);
    setStartTime("10:00");
    setEndTime("16:00");
  };

  const handleSave = async () => {
    if (!selectedDate) return;

    // Validate that end time is after start time
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      alert("終了時刻は開始時刻より後にしてください");
      return;
    }

    setSaving(true);
    try {
      // Generate all 30-minute slots between start and end time
      const slotsToCreate: string[] = [];
      let currentMinutes = startMinutes;

      while (currentMinutes < endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const minute = currentMinutes % 60;
        slotsToCreate.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
        currentMinutes += 30;
      }

      // Create slots
      let createdCount = 0;
      for (const time of slotsToCreate) {
        const [hours, minutes] = time.split(":").map(Number);
        const slotStartTime = new Date(selectedDate);
        slotStartTime.setHours(hours, minutes, 0, 0);

        // Use /api/slots for creating slots (POST endpoint)
        const response = await fetch("/api/slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: slotStartTime.toISOString(),
            sessionType: sessionType === "both" ? "casual" : sessionType,
          }),
        });

        if (response.ok) {
          createdCount++;
        }
      }

      await fetchSlots();
      onSlotsChange?.();
      setSelectedDate(null);

      // Show success message
      if (createdCount > 0) {
        setSuccessMessage(`${createdCount}件の予約枠を作成しました！（${startTime}〜${endTime}）`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error("Failed to save slots:", error);
      alert("予約枠の作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });
  };

  const days = getDaysInMonth();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📅</span> {formatMonth(currentDate)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              今日
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {dayNames.map((day, i) => (
          <div
            key={day}
            className={`py-2 text-center text-sm font-medium ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-2 sm:p-3 border-b border-r bg-gray-50"></div>;
            }

            const isPast = date < today;
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const dayOfWeek = date.getDay();

            return (
              <div
                key={index}
                onClick={() => !isPast && handleDateClick(date)}
                className={`p-2 sm:p-3 border-b border-r min-h-[60px] sm:min-h-[80px] transition-colors cursor-pointer ${
                  isPast
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isSelected
                    ? "bg-sky-100 ring-2 ring-sky-500"
                    : "hover:bg-sky-50"
                }`}
              >
                <span
                  className={`text-sm sm:text-base font-medium ${
                    isToday
                      ? "bg-sky-600 text-white rounded-full w-7 h-7 flex items-center justify-center"
                      : dayOfWeek === 0
                      ? "text-red-500"
                      : dayOfWeek === 6
                      ? "text-blue-500"
                      : ""
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border-t border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-xl">✓</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Time Slot Editor Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-t-2xl">
              <h3 className="text-lg font-bold">
                {selectedDate.toLocaleDateString("ja-JP", {
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}
              </h3>
              <p className="text-sm text-sky-100">時間帯を設定してください</p>
            </div>

            <div className="p-4">
              {/* Session Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  セッションタイプ
                </label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="both">どちらでも</option>
                  <option value="business">ビジネス日本語</option>
                  <option value="casual">日常会話</option>
                </select>
              </div>

              {/* Time Range Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始時刻
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了時刻
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="mb-4 p-3 bg-sky-50 rounded-lg border border-sky-200">
                <p className="text-sm text-sky-700 font-medium mb-1">作成される予約枠</p>
                <p className="text-xs text-sky-600">
                  {startTime}〜{endTime}の間、30分刻みでスロットを作成します
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
