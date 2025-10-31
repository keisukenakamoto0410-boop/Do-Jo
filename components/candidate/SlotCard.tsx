"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

interface SlotCardProps {
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    jobCategory: string;
    interviewer: {
      id: string;
      name: string;
      expertise: string[];
      bio: string;
    };
  };
  onBookSuccess: () => void;
}

export default function SlotCard({ slot, onBookSuccess }: SlotCardProps) {
  const [isBooking, setIsBooking] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
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

  const getDuration = () => {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return `${diffMinutes}分`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      IT: "💻",
      営業: "💼",
      事務: "📋",
      その他: "🔖",
    };
    return icons[category] || "📌";
  };

  const handleBookClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmBook = async () => {
    setIsBooking(true);

    try {
      const response = await fetch("/api/interview/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: slot.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "予約に失敗しました");
      }

      // Close dialog and show success
      setShowConfirmDialog(false);
      toast.success("面接の予約が完了しました！確認メールを送信しました。");
      onBookSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "予約に失敗しました");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getCategoryIcon(slot.jobCategory)}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(slot.startTime)}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  {slot.jobCategory}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)} (
                {getDuration()})
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">👔</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{slot.interviewer.name}</p>
              {slot.interviewer.expertise &&
                slot.interviewer.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {slot.interviewer.expertise.map((exp, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              {slot.interviewer.bio && (
                <p className="text-sm text-gray-600 mt-2">
                  {slot.interviewer.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleBookClick}
          className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          予約する
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              面接を予約しますか？
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">日時</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(slot.startTime)}{" "}
                    {formatTime(slot.startTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">時間</span>
                  <span className="font-medium text-gray-900">
                    {getDuration()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">面接官</span>
                  <span className="font-medium text-gray-900">
                    {slot.interviewer.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">カテゴリー</span>
                  <span className="font-medium text-gray-900">
                    {slot.jobCategory}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              予約を確定すると、確認メールが送信されます。月の利用回数が1回消費されます。
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isBooking}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmBook}
                disabled={isBooking}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isBooking ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    予約中...
                  </>
                ) : (
                  "予約を確定"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
