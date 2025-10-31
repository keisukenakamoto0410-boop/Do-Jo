"use client";

import { useState } from "react";
import Link from "next/link";

interface RequestCardProps {
  request: {
    id: string;
    status: string;
    createdAt: string;
    scheduledAt: string;
    candidate: {
      id: string;
      name: string;
      email: string;
      japaneseLevel: string;
    };
    slot: {
      jobCategory: string;
      startTime: string;
      endTime: string;
    };
  };
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export default function RequestCard({
  request,
  onApprove,
  onReject,
}: RequestCardProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full border border-yellow-300">
            承認待ち
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full border border-green-300">
            承認済み
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-300">
            却下済み
          </span>
        );
      default:
        return null;
    }
  };

  const handleApproveClick = () => {
    setShowApproveDialog(true);
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const handleConfirmApprove = async () => {
    setIsSubmitting(true);
    await onApprove(request.id);
    setIsSubmitting(false);
    setShowApproveDialog(false);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert("却下理由を入力してください");
      return;
    }

    setIsSubmitting(true);
    await onReject(request.id, rejectReason);
    setIsSubmitting(false);
    setShowRejectDialog(false);
    setRejectReason("");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "IT":
        return "💻";
      case "営業":
        return "💼";
      case "事務":
        return "📋";
      default:
        return "🔖";
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-teal-300 transition-all shadow-sm hover:shadow-md">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {request.candidate.name}
            </h3>
            <p className="text-sm text-gray-500">
              {request.candidate.japaneseLevel} レベル
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {request.candidate.email}
            </p>
          </div>
          {getStatusBadge(request.status)}
        </div>

        {/* Interview Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">
              {getCategoryIcon(request.slot.jobCategory)}
            </span>
            <span className="font-medium">{request.slot.jobCategory}</span>
          </div>

          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">📅</span>
            <span>{formatDate(request.slot.startTime)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-700">
            <span className="mr-2">🕐</span>
            <span>
              {formatTime(request.slot.startTime)} -{" "}
              {formatTime(request.slot.endTime)}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">📝</span>
            <span>申請日: {formatDate(request.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Link
            href={`/interviewer/candidate/${request.candidate.id}`}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            候補者情報を見る →
          </Link>

          {request.status === "PENDING" && (
            <div className="flex space-x-2">
              <button
                onClick={handleRejectClick}
                className="px-4 py-2 bg-white border-2 border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors text-sm font-medium"
              >
                却下
              </button>
              <button
                onClick={handleApproveClick}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors text-sm font-medium"
              >
                承認
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              面接リクエストを承認
            </h3>
            <p className="text-gray-600 mb-6">
              {request.candidate.name}
              さんの面接リクエストを承認してもよろしいですか？
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 mb-1">
                <strong>日時:</strong> {formatDate(request.slot.startTime)}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <strong>時間:</strong> {formatTime(request.slot.startTime)} -{" "}
                {formatTime(request.slot.endTime)}
              </p>
              <p className="text-sm text-gray-700">
                <strong>カテゴリー:</strong> {request.slot.jobCategory}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowApproveDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmApprove}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "承認中..." : "承認する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              面接リクエストを却下
            </h3>
            <p className="text-gray-600 mb-4">
              {request.candidate.name}
              さんの面接リクエストを却下します。却下理由を入力してください。
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              rows={4}
              placeholder="例: 申し訳ございませんが、その日時は別の予定が入っております。"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mb-6">
              候補者には却下理由が通知されます。ご利用回数は返還されます。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "却下中..." : "却下する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
