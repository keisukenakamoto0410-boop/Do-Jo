"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminCreateSlotsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("16:00");

  // 時間選択肢（9:00 - 21:00、30分刻み）
  const timeOptions: string[] = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 21) {
      timeOptions.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        // シニアのみをフィルター
        const seniors = data.users.filter((u: User) => u.role === "senior");
        setUsers(seniors);
      }
    } catch (error) {
      console.error("ユーザーの取得に失敗:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedUserId) {
      setError("ユーザーを選択してください");
      return;
    }

    if (!date) {
      setError("日付を選択してください");
      return;
    }

    if (startTime >= endTime) {
      setError("終了時刻は開始時刻より後にしてください");
      return;
    }

    setLoading(true);

    try {
      console.log("Creating slots for user:", { selectedUserId, date, startTime, endTime });

      const response = await fetch("/api/admin/slots/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          date,
          startTime,
          endTime,
        }),
      });

      const data = await response.json();
      console.log("API Response:", { status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.details || data.error || "スロットの作成に失敗しました";
        throw new Error(errorMsg);
      }

      const slotsCreated = data.slots?.length || 0;
      setSuccess(`${slotsCreated}個のスロットを作成しました！`);

      // フォームをリセット
      setDate("");
      setStartTime("11:00");
      setEndTime("16:00");
    } catch (err) {
      console.error("スロット作成エラー:", err);
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/users")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span>
            <span>ユーザー管理に戻る</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">スロット作成（管理者）</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ユーザーのスロットを作成
            </h2>
            <p className="text-gray-600 text-sm">
              シニアを選択して、その人の空き時間を登録できます
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー（シニア）<span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">ユーザーを選択...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Time Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始時刻 <span className="text-red-500">*</span>
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了時刻 <span className="text-red-500">*</span>
                </label>
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            {selectedUserId && date && startTime && endTime && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  📅 作成される予定
                </p>
                <p className="text-blue-900">
                  {users.find(u => u.id === selectedUserId)?.name} さんの予定
                </p>
                <p className="text-blue-900">
                  {date} の {startTime} ～ {endTime}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  ※ 30分刻みのスロットが自動的に作成されます
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/admin/users")}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading || !selectedUserId || !date || !startTime || !endTime}
                className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "作成中..." : "スロットを作成"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
