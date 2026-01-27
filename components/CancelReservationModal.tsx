"use client";

import { useState } from "react";

interface CancelReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  partnerName: string;
  sessionDate: string;
  isJapanese?: boolean; // true for senior/host UI
}

export default function CancelReservationModal({
  isOpen,
  onClose,
  onConfirm,
  partnerName,
  sessionDate,
  isJapanese = false,
}: CancelReservationModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } catch (err) {
      setError(
        isJapanese
          ? "キャンセルに失敗しました。もう一度お試しください。"
          : "Failed to cancel. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason("");
      setError("");
      onClose();
    }
  };

  // Quick reason options
  const quickReasons = isJapanese
    ? [
        "急用ができました",
        "体調が悪くなりました",
        "予定が変わりました",
        "インターネットの問題",
      ]
    : [
        "Something came up",
        "Not feeling well",
        "Schedule changed",
        "Internet issues",
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isJapanese ? "予約をキャンセルしますか？" : "Cancel Reservation?"}
            </h2>
            <p className="text-sm text-gray-500">
              {isJapanese
                ? `${partnerName}さんとの${sessionDate}の予約`
                : `Session with ${partnerName} on ${sessionDate}`}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-amber-800">
            {isJapanese
              ? "キャンセルすると相手にメールで通知されます。"
              : "The other person will be notified by email."}
          </p>
        </div>

        {/* Quick reasons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isJapanese
              ? "キャンセル理由（任意）"
              : "Reason for cancellation (optional)"}
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  reason === r
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isJapanese
                ? "理由を入力してください（任意）..."
                : "Enter your reason (optional)..."
            }
            className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            rows={3}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isJapanese ? "戻る" : "Go Back"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isJapanese ? "キャンセル中..." : "Cancelling..."}
              </>
            ) : isJapanese ? (
              "キャンセルする"
            ) : (
              "Cancel Reservation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
