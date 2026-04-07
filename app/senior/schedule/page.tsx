"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  reservation?: {
    id: string;
    learner: {
      name: string;
    };
  };
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await fetch("/api/host/slots");
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      }
    } catch (error) {
      console.error("スロットの取得に失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("このスロットを削除しますか？")) return;

    try {
      const response = await fetch(`/api/senior/slots/${slotId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchSlots();
      } else {
        const data = await response.json();
        alert(data.error || "スロットの削除に失敗しました");
      }
    } catch (error) {
      console.error("スロット削除エラー:", error);
      alert("スロットの削除に失敗しました");
    }
  };

  // スロットを日付でグループ化
  const groupSlotsByDate = () => {
    const grouped: { [key: string]: Slot[] } = {};

    slots.forEach((slot) => {
      const date = format(parseISO(slot.startTime), "yyyy-MM-dd");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });

    // 各グループ内で時間順にソート
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  };

  const groupedSlots = groupSlotsByDate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/senior/dashboard")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <span>←</span>
              <span>ダッシュボードに戻る</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">スケジュール管理</h1>
          </div>
          <button
            onClick={() => router.push("/senior/schedule/create")}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-md"
          >
            <span className="text-xl">+</span>
            <span>スロットを追加</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium mb-2">
            💡 スロット管理
          </p>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• 右上の「<strong>+ スロットを追加</strong>」ボタンから、日付と時間範囲を選択して追加できます</li>
            <li>• 予約が入っていないスロットは削除できます</li>
          </ul>
        </div>

        {/* Slots List */}
        {slots.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">スロットがありません</h2>
            <p className="text-gray-600 mb-6">
              右上の「+ スロットを追加」ボタンから、空き時間を登録してください
            </p>
            <button
              onClick={() => router.push("/senior/schedule/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              <span className="text-xl">+</span>
              <span>スロットを追加</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSlots)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([date, dateSlots]) => (
                <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3">
                    <h3 className="text-white font-bold text-lg">
                      {format(parseISO(date), "M月d日 (E)", { locale: ja })}
                    </h3>
                  </div>

                  {/* Slots for this date */}
                  <div className="divide-y divide-gray-200">
                    {dateSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-6">
                          {/* Time */}
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-gray-900">
                              {format(parseISO(slot.startTime), "HH:mm")} - {format(parseISO(slot.endTime), "HH:mm")}
                            </span>
                          </div>

                          {/* Status */}
                          <div>
                            {slot.status === "reserved" && slot.reservation ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                予約済み - {slot.reservation.learner.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                空き
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete Button */}
                        {slot.status !== "reserved" && (
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            削除
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
