"use client";

import { useState } from "react";

interface BookingCalendarProps {
  availableDates: string[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export default function BookingCalendar({
  availableDates,
  selectedDate,
  onDateSelect,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateAvailable = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return availableDates.includes(dateString);
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleDateClick = (date: Date) => {
    if (isPast(date) || !isDateAvailable(date)) return;
    onDateSelect(date);
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);

  const days = [];
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-12"></div>);
  }

  // Actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const available = isDateAvailable(date);
    const selected = isDateSelected(date);
    const today = isToday(date);
    const past = isPast(date);

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(date)}
        disabled={past || !available}
        className={`
          h-12 rounded-lg text-sm font-medium transition-all
          ${
            selected
              ? "bg-primary-600 text-white ring-2 ring-primary-600 ring-offset-2"
              : available && !past
              ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
              : past
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-400 cursor-not-allowed"
          }
          ${today && !selected ? "ring-2 ring-primary-200" : ""}
        `}
      >
        <div className="flex flex-col items-center justify-center">
          <span>{day}</span>
          {available && !past && (
            <span className="text-xs">●</span>
          )}
        </div>
      </button>
    );
  }

  const monthName = currentMonth.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium ${
              index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">{days}</div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
            <span className="text-gray-600">予約可能</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-600 rounded"></div>
            <span className="text-gray-600">選択中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span className="text-gray-600">予約不可</span>
          </div>
        </div>
      </div>
    </div>
  );
}
