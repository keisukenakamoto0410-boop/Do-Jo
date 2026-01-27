"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ArticleFeed from "@/components/learner/ArticleFeed";
import MobileNav from "@/components/MobileNav";
import ConversationStats from "@/components/ConversationStats";
import MedalDisplay from "@/components/MedalDisplay";
import CancelReservationModal from "@/components/CancelReservationModal";

interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  averageRating: number | null;
  thisMonthSessions: number;
}

interface UserProfile {
  name: string | null;
  bio: string | null;
  avatar: string | null;
  hometownFood: string | null;
  country: string | null;
}

interface Reservation {
  id: string;
  status: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  host: {
    id: string;
    name: string;
    avatar: string | null;
  };
  sessionFeedback?: {
    id: string;
  } | null;
}

export default function LearnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalMinutes: 0,
    averageRating: null,
    thisMonthSessions: 0,
  });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [medals, setMedals] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "learner") {
      router.push("/host/dashboard");
    }
  }, [status, session, router]);

  // Fetch user stats (placeholder for now)
  useEffect(() => {
    // TODO: Fetch actual stats from API
  }, [session?.user?.id]);

  // Fetch medals
  useEffect(() => {
    const fetchMedals = async () => {
      try {
        const res = await fetch("/api/user/medals");
        if (res.ok) {
          const data = await res.json();
          setMedals(data.medals?.map((m: { type: string }) => m.type) || []);
        }
      } catch (error) {
        console.error("Failed to fetch medals:", error);
      }
    };

    if (session?.user?.id) {
      fetchMedals();
    }
  }, [session?.user?.id]);

  // Fetch user profile to check completeness
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`/api/users/${session?.user?.id}`);
        if (res.ok) {
          const data = await res.json();
          const profile: UserProfile = {
            name: data.user?.name || null,
            bio: data.user?.bio || null,
            avatar: data.user?.avatar || null,
            hometownFood: data.user?.hometownFood || null,
            country: data.user?.country || null,
          };
          setUserProfile(profile);
          // Check if profile is incomplete
          const incomplete = !profile.bio || !profile.avatar || !profile.hometownFood;
          setIsProfileIncomplete(incomplete);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    if (session?.user?.id) {
      fetchUserProfile();
    }
  }, [session?.user?.id]);

  // Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch("/api/reservations");
        if (res.ok) {
          const data = await res.json();
          setReservations(data.reservations || []);
        }
      } catch (error) {
        console.error("Failed to fetch reservations:", error);
      } finally {
        setReservationsLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchReservations();
    }
  }, [session?.user?.id]);

  // Check if session is joinable (15 minutes before to session end)
  const isJoinable = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    const joinableFrom = new Date(start.getTime() - 15 * 60000);
    return now >= joinableFrom && now <= end;
  };

  // Check if session is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Get relative time string
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 0) return "In progress";
    if (diffMins < 60) return `in ${diffMins} min`;
    if (diffHours < 24) return `in ${diffHours} hours`;
    return `in ${diffDays} days`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Handle cancel reservation
  const handleCancelReservation = async (reason: string) => {
    if (!cancellingReservation) return;

    const response = await fetch(`/api/reservations/${cancellingReservation.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error("Failed to cancel reservation");
    }

    // Remove from local state
    setReservations((prev) =>
      prev.filter((r) => r.id !== cancellingReservation.id)
    );
    setCancellingReservation(null);
  };

  // Open cancel modal
  const openCancelModal = (reservation: Reservation) => {
    setCancellingReservation(reservation);
    setCancelModalOpen(true);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 via-white to-neutral-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user;

  // Filter reservations
  const now = new Date();
  const futureReservations = reservations
    .filter(
      (r) =>
        r.status === "confirmed" && new Date(r.slot.endTime) > now
    )
    .sort(
      (a, b) =>
        new Date(a.slot.startTime).getTime() -
        new Date(b.slot.startTime).getTime()
    );

  const todayReservations = futureReservations.filter((r) =>
    isToday(r.slot.startTime)
  );
  const upcomingReservations = futureReservations.filter(
    (r) => !isToday(r.slot.startTime)
  );

  // Get completed sessions with feedback
  const completedReservations = reservations
    .filter((r) => r.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.slot.startTime).getTime() -
        new Date(a.slot.startTime).getTime()
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50">
      {/* Cancel Reservation Modal */}
      <CancelReservationModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setCancellingReservation(null);
        }}
        onConfirm={handleCancelReservation}
        partnerName={cancellingReservation?.host.name || ""}
        sessionDate={
          cancellingReservation
            ? formatDate(cancellingReservation.slot.startTime) +
              " " +
              formatTime(cancellingReservation.slot.startTime)
            : ""
        }
        isJapanese={false}
      />

      {/* Mobile Navigation */}
      <MobileNav isLearner={true} />

      {/* Desktop Header - hidden on mobile */}
      <header className="hidden lg:block bg-white/80 backdrop-blur-sm border-b border-neutral-100 sticky top-0 z-50">
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
                className="text-neutral-600 hover:text-primary font-medium transition-colors"
              >
                My Sessions
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg">
                <span className="text-xl">🌏</span>
                <span className="font-medium text-neutral-700">{user.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost text-sm"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-20 lg:pb-8">
        {/* Profile Incomplete Banner */}
        {isProfileIncomplete && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h3 className="font-bold text-amber-800">Complete Your Profile!</h3>
                  <p className="text-sm text-amber-700">
                    Add your bio, photo, and hometown food to connect better with hosts
                  </p>
                </div>
              </div>
              <Link
                href="/learner/profile"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                Complete Profile
              </Link>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Hi {user.name}! 👋
              </h1>
              <p className="text-neutral-600">
                Practice Japanese with native speakers through 25-minute video sessions
              </p>
            </div>
            <Link
              href="/learner/profile"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
            >
              <span>👤</span>
              <span className="font-medium">Edit Profile</span>
            </Link>
          </div>

          {/* Medals Section */}
          {medals.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <span>🏆</span> My Medals ({medals.length})
                </h3>
              </div>
              <MedalDisplay medals={medals} size="sm" />
            </div>
          )}
        </div>

        {/* Article Feed */}
        <div className="mb-8">
          <ArticleFeed />
        </div>

        {/* Conversation Stats */}
        <div className="mb-8">
          <ConversationStats userId={user.id} isLearner={true} />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Casual Conversation */}
          <Link
            href="/learner/browse"
            className="group bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-[1.02] block"
          >
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold mb-2">Casual Conversation</h2>
            <p className="opacity-90 mb-4">
              Practice natural Japanese conversation with friendly native speakers
            </p>
            <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-lg text-sm font-medium group-hover:bg-white/30 transition-colors">
              Find Available Slots
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* Edit Profile Card */}
          <Link
            href="/learner/profile"
            className="group bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-[1.02] block"
          >
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-2xl font-bold mb-2">Edit Profile</h2>
            <p className="opacity-90 mb-4">
              Update your profile, add your hometown food, and share about yourself
            </p>
            <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-lg text-sm font-medium group-hover:bg-white/30 transition-colors">
              Edit My Profile
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Upcoming Sessions */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Upcoming Sessions
          </h2>
          {reservationsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : futureReservations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📅</span>
              </div>
              <p className="text-neutral-600 mb-4">No upcoming sessions</p>
              <Link href="/learner/browse" className="btn-primary">
                Find a Host
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {futureReservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                    isJoinable(reservation.slot.startTime, reservation.slot.endTime)
                      ? "bg-green-50 border-2 border-green-500"
                      : "bg-neutral-50 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold overflow-hidden">
                      {reservation.host.avatar ? (
                        <img
                          src={reservation.host.avatar}
                          alt={reservation.host.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        reservation.host.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        with {reservation.host.name}-san
                      </p>
                      <p className="text-sm text-neutral-600">
                        {formatDate(reservation.slot.startTime)}{" "}
                        {formatTime(reservation.slot.startTime)} (JST)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isJoinable(reservation.slot.startTime, reservation.slot.endTime) ? (
                      <Link
                        href={`/learner/session/${reservation.id}`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm transition-colors inline-flex items-center gap-1"
                      >
                        <span>🎥</span>
                        Join
                      </Link>
                    ) : (
                      <>
                        <span className="text-sm text-neutral-500">
                          {getRelativeTime(reservation.slot.startTime)}
                        </span>
                        <button
                          onClick={() => openCancelModal(reservation)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {futureReservations.length > 5 && (
                <Link
                  href="/learner/reservations"
                  className="block text-center py-3 text-primary hover:text-primary-dark font-medium"
                >
                  View all sessions ({futureReservations.length}) →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Your Progress / Feedback History */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Your Progress
          </h2>
          {completedReservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">
                Complete your first session to see your progress!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-neutral-600 mb-4">
                You&apos;ve completed {completedReservations.length} session
                {completedReservations.length !== 1 ? "s" : ""}!
              </p>
              <div className="space-y-3 mb-4">
                {completedReservations.slice(0, 3).map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm">
                        {reservation.host.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">
                          with {reservation.host.name}-san
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDate(reservation.slot.startTime)}
                        </p>
                      </div>
                    </div>
                    {reservation.sessionFeedback ? (
                      <Link
                        href={`/learner/feedback/${reservation.id}`}
                        className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
                      >
                        View Feedback
                      </Link>
                    ) : (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-sm rounded-lg">
                        Awaiting feedback
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {completedReservations.length > 3 && (
                <Link
                  href="/learner/reservations"
                  className="text-primary hover:text-primary-dark font-medium text-sm"
                >
                  View all completed sessions →
                </Link>
              )}
            </div>
          )}
        </div>

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
