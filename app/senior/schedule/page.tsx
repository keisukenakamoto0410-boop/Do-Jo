"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SlotCalendar from "@/components/calendar/SlotCalendar";

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

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

  const handleSelectSlot = (start: Date, end: Date) => {
    setSelectedSlot({ start, end });
    setShowAddModal(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleAddSlot = async () => {
    if (!selectedSlot) return;

    try {
      const response = await fetch("/api/senior/slots/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedSlot.start.toISOString(),
          endTime: selectedSlot.end.toISOString(),
        }),
      });

      if (response.ok) {
        await fetchSlots();
        setShowAddModal(false);
        setSelectedSlot(null);
      } else {
        const data = await response.json();
        alert(data.error || "スロットの作成に失敗しました");
      }
    } catch (error) {
      console.error("スロット作成エラー:", error);
      alert("スロットの作成に失敗しました");
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
        setShowEventModal(false);
        setSelectedEvent(null);
      } else {
        const data = await response.json();
        alert(data.error || "スロットの削除に失敗しました");
      }
    } catch (error) {
      console.error("スロット削除エラー:", error);
      alert("スロットの削除に失敗しました");
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            💡 カレンダーをクリックして新しいスロットを追加できます。既存のスロットをクリックすると詳細が表示されます。
          </p>
        </div>

        <SlotCalendar
          slots={slots}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      </div>

      {/* Add Slot Modal */}
      {showAddModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">スロットを追加</h2>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm text-gray-600">開始時刻</label>
                <p className="font-medium">{selectedSlot.start.toLocaleString("ja-JP")}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">終了時刻</label>
                <p className="font-medium">{selectedSlot.end.toLocaleString("ja-JP")}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedSlot(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddSlot}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">スロット詳細</h2>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm text-gray-600">開始時刻</label>
                <p className="font-medium">{selectedEvent.start.toLocaleString("ja-JP")}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">終了時刻</label>
                <p className="font-medium">{selectedEvent.end.toLocaleString("ja-JP")}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">ステータス</label>
                <p className="font-medium">
                  {selectedEvent.resource?.status === "reserved" ? (
                    <span className="text-red-600">
                      予約済み - {selectedEvent.resource.learnerName}
                    </span>
                  ) : (
                    <span className="text-green-600">空き</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                閉じる
              </button>
              {selectedEvent.resource?.status !== "reserved" && (
                <button
                  onClick={() => handleDeleteSlot(selectedEvent.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
