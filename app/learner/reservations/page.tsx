"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  sessionType: string;
}

interface Host {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  role: string;
  languages: string[];
  interests: string[];
  averageRating: number;
  university: string | null;
  major: string | null;
}

interface Reservation {
  id: string;
  slotId: string;
  status: string;
  sessionType: string;
  channelName: string | null;
  token: string | null;
  readyToTalk: boolean;
  studyLogCount: number;
  hasAgenda: boolean;
  hasFeedback: boolean;
  slot: Slot;
  host: Host;
  createdAt: string;
}

export default function LearnerReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

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
      fetchReservations();
    }
  }, [session]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reservations");
      const data = await res.json();

      if (res.ok) {
        setReservations(data.reservations);
      }
    } catch (error) {
      console.error("Failed to fetch reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchReservations();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel reservation");
      }
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
      alert("Failed to cancel reservation");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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

  const now = new Date();
  const upcomingReservations = reservations.filter(
    (r) =>
      new Date(r.slot.startTime) > now &&
      ["pending", "confirmed"].includes(r.status)
  );
  const pastReservations = reservations.filter(
    (r) =>
      new Date(r.slot.startTime) <= now || r.status === "completed" || r.status === "cancelled"
  );

  const displayedReservations =
    activeTab === "upcoming" ? upcomingReservations : pastReservations;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="badge-success">
            Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="badge-warning">
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="badge-primary">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="badge bg-neutral-100 text-neutral-600">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/learner/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">道</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Do Jo</h1>
                <p className="text-xs text-neutral-500">Just Talk Japanese</p>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/learner/browse"
                className="text-neutral-600 hover:text-primary font-medium transition-colors"
              >
                Find Hosts
              </Link>
              <Link
                href="/learner/reservations"
                className="text-primary font-semibold"
              >
                My Sessions
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg">
                <span className="text-xl">🌏</span>
                <span className="font-medium text-neutral-700">{session.user.name}</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-8">My Sessions</h1>

        {/* Tabs */}
        <div className="card mb-8 p-0 overflow-hidden">
          <div className="flex border-b border-neutral-100">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "text-primary border-b-2 border-primary bg-primary-50/50"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Upcoming ({upcomingReservations.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === "past"
                  ? "text-primary border-b-2 border-primary bg-primary-50/50"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Past ({pastReservations.length})
            </button>
          </div>
        </div>

        {/* Reservations List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : displayedReservations.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">
                {activeTab === "upcoming" ? "📅" : "📚"}
              </span>
            </div>
            <p className="text-xl text-neutral-600 mb-4">
              {activeTab === "upcoming"
                ? "No upcoming sessions"
                : "No past sessions"}
            </p>
            {activeTab === "upcoming" && (
              <Link href="/learner/browse" className="btn-primary">
                Find a Host
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className={`card overflow-hidden border-l-4 ${
                  reservation.sessionType === "business"
                    ? "border-l-accent"
                    : "border-l-purple-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Host Avatar */}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                        reservation.host.role === "senior"
                          ? "bg-accent-50"
                          : "bg-purple-100"
                      }`}
                    >
                      {reservation.host.role === "senior" ? "🏯" : "🎓"}
                    </div>

                    {/* Reservation Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-neutral-900">
                          {reservation.host.name}
                        </h3>
                        {getStatusBadge(reservation.status)}
                      </div>
                      <p className="text-neutral-500 text-sm mb-2">
                        {reservation.host.role === "senior"
                          ? "Japanese Professional"
                          : "University Student"}
                        {reservation.host.university &&
                          ` • ${reservation.host.university}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-neutral-700 text-sm">
                        <span className="flex items-center gap-1">
                          📅 {formatDate(reservation.slot.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          🕐 {formatTime(reservation.slot.startTime)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            reservation.sessionType === "business"
                              ? "bg-accent-50 text-accent-700"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {reservation.sessionType === "business"
                            ? "Business"
                            : "Casual"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 items-end">
                    {activeTab === "upcoming" &&
                      reservation.status === "confirmed" && (
                        <div className="flex gap-2">
                          <Link
                            href={`/learner/session/${reservation.id}`}
                            className={`px-4 py-2 rounded-lg font-medium text-white ${
                              reservation.sessionType === "business"
                                ? "bg-accent hover:bg-accent-warm"
                                : "bg-purple-600 hover:bg-purple-700"
                            } transition-colors`}
                          >
                            Join Session
                          </Link>
                          <button
                            onClick={() => cancelReservation(reservation.id)}
                            className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    {activeTab === "past" &&
                      reservation.status === "completed" && (
                        reservation.hasFeedback ? (
                          <Link
                            href={`/learner/feedback/${reservation.id}`}
                            className="btn-primary"
                          >
                            View Feedback
                          </Link>
                        ) : (
                          <span className="px-4 py-2 bg-neutral-100 text-neutral-500 rounded-lg text-sm">
                            Awaiting Feedback
                          </span>
                        )
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500">
            <p>© {new Date().getFullYear()} Do Jo by M-JUGAAD. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/about" className="hover:text-primary transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
