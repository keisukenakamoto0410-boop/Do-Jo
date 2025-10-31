"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BookingCalendar from "@/components/candidate/BookingCalendar";
import SlotCard from "@/components/candidate/SlotCard";

interface Slot {
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
}

interface Interviewer {
  id: string;
  name: string;
}

export default function BookInterviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<Slot[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>("all");

  const categories = ["all", "IT", "営業", "事務", "その他"];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSlots();
    }
  }, [status, router]);

  useEffect(() => {
    applyFilters();
  }, [slots, selectedDate, selectedCategory, selectedInterviewer]);

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Fetch slots for next 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/interview-slots/available?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "スロットの取得に失敗しました");
      }

      setSlots(data.slots);

      // Extract unique interviewers
      const uniqueInterviewers: { [key: string]: Interviewer } = {};
      data.slots.forEach((slot: Slot) => {
        if (!uniqueInterviewers[slot.interviewer.id]) {
          uniqueInterviewers[slot.interviewer.id] = {
            id: slot.interviewer.id,
            name: slot.interviewer.name,
          };
        }
      });
      setInterviewers(Object.values(uniqueInterviewers));
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...slots];

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return (
          slotDate.getDate() === selectedDate.getDate() &&
          slotDate.getMonth() === selectedDate.getMonth() &&
          slotDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((slot) => slot.jobCategory === selectedCategory);
    }

    // Filter by interviewer
    if (selectedInterviewer !== "all") {
      filtered = filtered.filter(
        (slot) => slot.interviewer.id === selectedInterviewer
      );
    }

    setFilteredSlots(filtered);
  };

  const getAvailableDates = (): string[] => {
    const dates = new Set<string>();
    slots.forEach((slot) => {
      const date = new Date(slot.startTime);
      dates.add(date.toISOString().split("T")[0]);
    });
    return Array.from(dates);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleBookSuccess = () => {
    setShowSuccess(true);
    // Refresh slots
    fetchSlots();
    // Reset filters
    setSelectedDate(null);
    setSelectedCategory("all");
    setSelectedInterviewer("all");

    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            面接を予約する
          </h1>
          <p className="text-gray-600">
            希望の日時と面接官を選んで面接を予約できます（月2回まで）
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              面接の予約が完了しました！確認メールを送信しました。
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                フィルター
              </h2>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  職種カテゴリー
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">すべて</option>
                  {categories.filter((c) => c !== "all").map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interviewer Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  面接官
                </label>
                <select
                  value={selectedInterviewer}
                  onChange={(e) => setSelectedInterviewer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">すべて</option>
                  {interviewers.map((interviewer) => (
                    <option key={interviewer.id} value={interviewer.id}>
                      {interviewer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日付を選択
                </label>
                <BookingCalendar
                  availableDates={getAvailableDates()}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                />
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedCategory("all");
                  setSelectedInterviewer("all");
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                フィルターをリセット
              </button>
            </div>
          </div>

          {/* Right Content - Slots */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                利用可能な予約枠
              </h2>
              <span className="text-sm text-gray-600">
                {filteredSlots.length}件の枠が見つかりました
              </span>
            </div>

            {filteredSlots.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  予約可能な枠がありません
                </h3>
                <p className="text-gray-600">
                  {selectedDate || selectedCategory !== "all" || selectedInterviewer !== "all"
                    ? "別の条件で検索してみてください"
                    : "現在予約可能な枠がありません"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSlots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    onBookSuccess={handleBookSuccess}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                予約についての注意事項
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>月2回まで面接を予約できます</li>
                  <li>予約後はキャンセルできません（要実装）</li>
                  <li>面接時間は15-20分程度です</li>
                  <li>面接開始10分前までにログインしてください</li>
                  <li>履歴書を事前にアップロードしておくことをお勧めします</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
