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

interface GroupedHost {
  host: Host;
  slots: Slot[];
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

  // ホスト詳細モーダル用
  const [selectedHost, setSelectedHost] = useState<GroupedHost | null>(null);
  const [showHostModal, setShowHostModal] = useState(false);

  // スライドトピック選択モーダル用
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<string | null>(null);
  const [selectedSlideTopic, setSelectedSlideTopic] = useState<string | null>(null);

  // トピックと単語入力用
  const [conversationTopic, setConversationTopic] = useState("");
  const [practiceWords, setPracticeWords] = useState<string[]>([""]);
  const [wordInput, setWordInput] = useState("");

  useEffect(() => {
    if (status === "loading") return;
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

  // ホストごとにスロットをグループ化
  const groupedHosts: GroupedHost[] = (() => {
    const hostMap = new Map<string, GroupedHost>();
    slots.forEach(slot => {
      const hostId = slot.host.id;
      if (!hostMap.has(hostId)) {
        hostMap.set(hostId, {
          host: slot.host,
          slots: []
        });
      }
      hostMap.get(hostId)!.slots.push(slot);
    });
    return Array.from(hostMap.values());
  })();

  // ホスト詳細モーダルを開く
  const handleOpenHostModal = (groupedHost: GroupedHost) => {
    setSelectedHost(groupedHost);
    setShowHostModal(true);
  };

  // スライド選択モーダルを開く
  const handleOpenSlideModal = (slotId: string) => {
    setSelectedSlotForBooking(slotId);
    setSelectedSlideTopic(null);
    setConversationTopic("");
    setPracticeWords([]);
    setWordInput("");
    setShowSlideModal(true);
    setShowHostModal(false);
  };

  // 単語を追加
  const handleAddWord = () => {
    const trimmed = wordInput.trim();
    if (trimmed && practiceWords.length < 5 && !practiceWords.includes(trimmed)) {
      setPracticeWords([...practiceWords, trimmed]);
      setWordInput("");
    }
  };

  // 単語を削除
  const handleRemoveWord = (index: number) => {
    setPracticeWords(practiceWords.filter((_, i) => i !== index));
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
          selectedTopic: conversationTopic || null,
          targetWords: practiceWords.filter(w => w.trim()),
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

  // スロットを日付でグループ化（モーダル内用）
  const groupSlotsByDate = (slots: Slot[]) => {
    const grouped: Record<string, Slot[]> = {};
    slots.forEach(slot => {
      const date = new Date(slot.startTime).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };

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

        {/* Results - Host Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : groupedHosts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-xl text-gray-600">
              No available hosts found
            </p>
            <p className="text-gray-500 mt-2">
              Try changing filters or check back later
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {groupedHosts.map(({ host, slots }) => (
              <div
                key={host.id}
                onClick={() => handleOpenHostModal({ host, slots })}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {host.avatar ? (
                        <img
                          src={host.avatar}
                          alt={host.name}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                        />
                      ) : (
                        <div
                          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl ${
                            host.role === "senior"
                              ? "bg-amber-100"
                              : "bg-purple-100"
                          }`}
                        >
                          {host.role === "senior" ? "🏯" : "🎓"}
                        </div>
                      )}
                    </div>

                    {/* Host Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {host.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {host.role === "senior"
                              ? "Japanese Professional"
                              : "University Student"}
                            {host.university && ` • ${host.university}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {host.averageRating > 0 && (
                            <p className="text-sm font-medium text-yellow-600">
                              ⭐ {host.averageRating.toFixed(1)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {host.totalSessions} sessions
                          </p>
                        </div>
                      </div>

                      {host.bio && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {host.bio}
                        </p>
                      )}

                      {host.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {host.interests.slice(0, 5).map((interest) => (
                            <span
                              key={interest}
                              className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                          {host.interests.length > 5 && (
                            <span className="px-2 py-0.5 text-gray-500 text-xs">
                              +{host.interests.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Available slots summary */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">●</span>
                      {slots.length} slot{slots.length !== 1 && "s"} available
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Host Detail Modal */}
        {showHostModal && selectedHost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Host Profile</h2>
                <button
                  onClick={() => {
                    setShowHostModal(false);
                    setSelectedHost(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <div className="p-6">
                {/* Host Profile Section */}
                <div className="flex gap-6 mb-6">
                  {/* Large Avatar */}
                  <div className="flex-shrink-0">
                    {selectedHost.host.avatar ? (
                      <img
                        src={selectedHost.host.avatar}
                        alt={selectedHost.host.name}
                        className="w-28 h-28 rounded-full object-cover border-4 border-gray-100"
                      />
                    ) : (
                      <div
                        className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl ${
                          selectedHost.host.role === "senior"
                            ? "bg-amber-100"
                            : "bg-purple-100"
                        }`}
                      >
                        {selectedHost.host.role === "senior" ? "🏯" : "🎓"}
                      </div>
                    )}
                  </div>

                  {/* Host Details */}
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl text-gray-900">
                      {selectedHost.host.name}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {selectedHost.host.role === "senior"
                        ? "Japanese Professional"
                        : "University Student"}
                      {selectedHost.host.university &&
                        ` • ${selectedHost.host.university}`}
                      {selectedHost.host.major &&
                        ` (${selectedHost.host.major})`}
                    </p>

                    <div className="flex items-center gap-4 mt-3">
                      {selectedHost.host.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-lg">⭐</span>
                          <span className="font-bold text-gray-900">
                            {selectedHost.host.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      <div className="text-gray-500">
                        {selectedHost.host.totalSessions} sessions completed
                      </div>
                    </div>

                    {selectedHost.host.languages.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <span>🗣️</span>
                        {selectedHost.host.languages.join(", ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {selectedHost.host.bio && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {selectedHost.host.bio}
                    </p>
                  </div>
                )}

                {/* Career History (Japanese professionals only) */}
                {selectedHost.host.careerHistory && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Career History</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {selectedHost.host.careerHistory}
                    </p>
                  </div>
                )}

                {/* Expertise */}
                {selectedHost.host.expertise.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedHost.host.expertise.map((exp) => (
                        <span
                          key={exp}
                          className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {selectedHost.host.interests.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedHost.host.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Slots */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Available Time Slots
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(groupSlotsByDate(selectedHost.slots)).map(
                      ([date, dateSlots]) => (
                        <div key={date}>
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            {formatDate(dateSlots[0].startTime)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dateSlots.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => handleOpenSlideModal(slot.id)}
                                disabled={bookingSlotId === slot.id}
                                className="px-4 py-2 bg-white border-2 border-green-500 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {formatTime(slot.startTime)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide Topic Selection Modal */}
        {showSlideModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Session Preparation
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  Let your host know what you want to practice today!
                </p>

                {/* トピック入力 */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 What topic do you want to talk about?
                  </label>
                  <input
                    type="text"
                    value={conversationTopic}
                    onChange={(e) => setConversationTopic(e.target.value)}
                    placeholder="e.g., Travel, My job, Japanese food..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    maxLength={100}
                  />
                </div>

                {/* 単語入力 */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💬 Words you want to practice (max 5)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={wordInput}
                      onChange={(e) => setWordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddWord();
                        }
                      }}
                      placeholder="Type a word and press Enter"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={50}
                      disabled={practiceWords.length >= 5}
                    />
                    <button
                      type="button"
                      onClick={handleAddWord}
                      disabled={!wordInput.trim() || practiceWords.length >= 5}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                  {practiceWords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {practiceWords.map((word, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {word}
                          <button
                            onClick={() => handleRemoveWord(index)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {practiceWords.length}/5 words added
                  </p>
                </div>

                {/* スライド選択（オプション） */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🖼️ Conversation Slides (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Visual slides to guide your conversation
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {SLIDE_TOPICS.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedSlideTopic(
                          selectedSlideTopic === topic.id ? null : topic.id
                        )}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          selectedSlideTopic === topic.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="text-xl mb-1">{topic.emoji}</div>
                        <div className="text-xs font-medium text-gray-700">
                          {topic.nameEn}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSlideModal(false);
                      setSelectedSlotForBooking(null);
                      setSelectedSlideTopic(null);
                      setConversationTopic("");
                      setPracticeWords([]);
                      setWordInput("");
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
                    Book Session
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
