"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface Host {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  languages: string[];
  interests: string[];
  averageRating: number;
  totalSessions: number;
  careerHistory: string | null;
  expertise: string[];
  university: string | null;
  major: string | null;
}

interface Slot {
  id: string;
  hostId: string;
  sessionType: string;
  startTime: string;
  endTime: string;
  status: string;
  host: Host;
}

function BrowseContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "both";

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "learner") {
      router.push("/host/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user) {
      fetchSlots();
    }
  }, [session, selectedType, selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "both") {
        params.set("type", selectedType);
      }
      if (selectedDate) {
        params.set("date", selectedDate);
      }

      const res = await fetch(`/api/slots?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setSlots(data.slots);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId: string) => {
    setBookingSlotId(slotId);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });

      if (res.ok) {
        router.push("/learner/reservations");
      } else {
        const data = await res.json();
        alert(data.error || "予約に失敗しました");
      }
    } catch (error) {
      console.error("Failed to book slot:", error);
      alert("予約に失敗しました");
    } finally {
      setBookingSlotId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group slots by date
  const groupedSlots = slots.reduce(
    (acc, slot) => {
      const date = new Date(slot.startTime).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    },
    {} as Record<string, Slot[]>
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/learner/dashboard"
              className="text-2xl font-bold text-green-600"
            >
              Do Jo
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/learner/browse"
                className="text-green-600 font-medium"
              >
                ホストを探す
              </Link>
              <Link
                href="/learner/reservations"
                className="text-gray-600 hover:text-green-600"
              >
                予約一覧
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ホストを探す
        </h1>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Session Type Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedType("both")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === "both"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setSelectedType("business")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === "business"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🏯 ビジネス
              </button>
              <button
                onClick={() => setSelectedType("casual")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === "casual"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🎓 カジュアル
              </button>
            </div>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="text-gray-500 hover:text-gray-700"
              >
                日付をクリア
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-xl text-gray-600">
              利用可能な予約枠が見つかりませんでした
            </p>
            <p className="text-gray-500 mt-2">
              フィルターを変更するか、後でもう一度お試しください
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  {formatDate(dateSlots[0].startTime)}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`bg-white rounded-xl shadow-lg overflow-hidden border-l-4 ${
                        slot.sessionType === "business"
                          ? "border-amber-500"
                          : "border-purple-500"
                      }`}
                    >
                      {/* Host Info */}
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                              slot.host.role === "senior"
                                ? "bg-amber-100"
                                : "bg-purple-100"
                            }`}
                          >
                            {slot.host.role === "senior" ? "🏯" : "🎓"}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">
                              {slot.host.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {slot.host.role === "senior"
                                ? "シニア"
                                : "大学生"}
                              {slot.host.university &&
                                ` ・ ${slot.host.university}`}
                            </p>
                            {slot.host.averageRating > 0 && (
                              <p className="text-sm text-yellow-600">
                                ⭐ {slot.host.averageRating.toFixed(1)} (
                                {slot.host.totalSessions}回)
                              </p>
                            )}
                          </div>
                        </div>

                        {slot.host.bio && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {slot.host.bio}
                          </p>
                        )}

                        {slot.host.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {slot.host.interests.slice(0, 3).map((interest) => (
                              <span
                                key={interest}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Time and Book Button */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="font-bold text-lg text-gray-900">
                              {formatTime(slot.startTime)}
                            </p>
                            <p className="text-xs text-gray-500">25分間</p>
                          </div>
                          <button
                            onClick={() => handleBookSlot(slot.id)}
                            disabled={bookingSlotId === slot.id}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              slot.sessionType === "business"
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : "bg-purple-600 text-white hover:bg-purple-700"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {bookingSlotId === slot.id ? "予約中..." : "予約する"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function LearnerBrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
