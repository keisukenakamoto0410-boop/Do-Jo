"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { TOPICS as SLIDE_TOPICS } from "@/components/video/TopicSelector";

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
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<string | null>(null);
  const [selectedSlideTopic, setSelectedSlideTopic] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
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

  // スライド選択モーダルを開く
  const handleOpenSlideModal = (slotId: string) => {
    setSelectedSlotForBooking(slotId);
    setSelectedSlideTopic(null);
    setShowSlideModal(true);
  };

  // 予約を確定
  const handleConfirmBooking = async () => {
    if (!selectedSlotForBooking) return;

    setBookingSlotId(selectedSlotForBooking);
    setShowSlideModal(false);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlotForBooking,
          slideTopic: selectedSlideTopic,
        }),
      });

      if (res.ok) {
        router.push("/learner/reservations");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to book slot");
      }
    } catch (error) {
      console.error("Failed to book slot:", error);
      alert("Failed to book slot");
    } finally {
      setBookingSlotId(null);
      setSelectedSlotForBooking(null);
      setSelectedSlideTopic(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
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
                Find Hosts
              </Link>
              <Link
                href="/learner/reservations"
                className="text-gray-600 hover:text-green-600"
              >
                My Sessions
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
          Find Hosts
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
                All
              </button>
              <button
                onClick={() => setSelectedType("casual")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === "casual"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🎓 Casual
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
                Clear Date
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
              No available slots found
            </p>
            <p className="text-gray-500 mt-2">
              Try changing filters or check back later
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
                                ? "Senior Professional"
                                : "University Student"}
                              {slot.host.university &&
                                ` • ${slot.host.university}`}
                            </p>
                            {slot.host.averageRating > 0 && (
                              <p className="text-sm text-yellow-600">
                                ⭐ {slot.host.averageRating.toFixed(1)} (
                                {slot.host.totalSessions} sessions)
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
                            <p className="text-xs text-gray-500">25 min</p>
                          </div>
                          <button
                            onClick={() => handleOpenSlideModal(slot.id)}
                            disabled={bookingSlotId === slot.id}
                            className="px-4 py-2 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {bookingSlotId === slot.id ? "Booking..." : "Book Now"}
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

        {/* Slide Topic Selection Modal */}
        {showSlideModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Choose a Conversation Slide (Optional)
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  Slides help guide your conversation. Both you and your host will see the same slides during the session.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {SLIDE_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedSlideTopic(
                        selectedSlideTopic === topic.id ? null : topic.id
                      )}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedSlideTopic === topic.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{topic.emoji}</div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {topic.nameEn}
                      </div>
                      <div className="text-xs text-gray-500">
                        {topic.nameJa}
                      </div>
                      {selectedSlideTopic === topic.id && (
                        <div className="mt-1 text-blue-600 text-xs font-medium">
                          ✓ Selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSlideModal(false);
                      setSelectedSlotForBooking(null);
                      setSelectedSlideTopic(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingSlotId !== null}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {selectedSlideTopic ? "Book with Slides" : "Book without Slides"}
                  </button>
                </div>
              </div>
            </div>
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
