"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import StudyPostTimeline from "@/components/learner/StudyPostTimeline";
import ArticleFeed from "@/components/learner/ArticleFeed";

interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  averageRating: number | null;
  thisMonthSessions: number;
}

interface RankingUser {
  id: string;
  name: string;
  avatar: string | null;
  country: string | null;
  postCount: number;
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
  const [rankingPeriod, setRankingPeriod] = useState<"week" | "month" | "all">("week");
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPostCount, setMyPostCount] = useState(0);
  const [rankingLoading, setRankingLoading] = useState(true);

  useEffect(() => {
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

  // Fetch rankings
  useEffect(() => {
    if (session?.user) {
      fetchRankings();
    }
  }, [rankingPeriod, session?.user]);

  const fetchRankings = async () => {
    try {
      setRankingLoading(true);
      const response = await fetch(`/api/rankings?period=${rankingPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings);
        setMyRank(data.myRank);
        setMyPostCount(data.myPostCount);
      }
    } catch (error) {
      console.error("Failed to fetch rankings:", error);
    } finally {
      setRankingLoading(false);
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

  const user = session.user;

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
                <p className="text-xs text-neutral-500">Bridge to Japanese Careers</p>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-neutral-600">
                Practice Japanese with native speakers through 25-minute video sessions
              </p>
            </div>
            <div className="hidden md:block">
              <Link href="/learner/post" className="btn-accent">
                Post Study Log
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-primary">{stats.totalSessions}</p>
            <p className="text-sm text-neutral-600 mt-1">Total Sessions</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-accent">{stats.totalMinutes} min</p>
            <p className="text-sm text-neutral-600 mt-1">Talk Time</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-success">
              {stats.averageRating ? stats.averageRating.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-neutral-600 mt-1">Avg. Rating</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-warning">{stats.thisMonthSessions}</p>
            <p className="text-sm text-neutral-600 mt-1">This Month</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Business Japanese */}
          <Link
            href="/learner/browse?type=business"
            className="group bg-gradient-to-br from-accent to-accent-warm rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            <div className="text-5xl mb-4">🏯</div>
            <h2 className="text-2xl font-bold mb-2">Business Japanese</h2>
            <p className="opacity-90 mb-4">
              Learn keigo & business manners with experienced professionals
            </p>
            <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-lg text-sm font-medium group-hover:bg-white/30 transition-colors">
              Find Available Slots
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          {/* Casual Conversation */}
          <Link
            href="/learner/browse?type=casual"
            className="group bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold mb-2">Casual Conversation</h2>
            <p className="opacity-90 mb-4">
              Enjoy casual Japanese chat with university students
            </p>
            <span className="inline-flex items-center px-4 py-2 bg-white/20 rounded-lg text-sm font-medium group-hover:bg-white/30 transition-colors">
              Find Available Slots
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Ranking Section */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Study Log Ranking
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setRankingPeriod("week")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  rankingPeriod === "week"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setRankingPeriod("month")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  rankingPeriod === "month"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setRankingPeriod("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  rankingPeriod === "all"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {rankingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg animate-pulse">
                  <div className="w-8 h-8 bg-neutral-200 rounded-full"></div>
                  <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-6 bg-neutral-200 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : rankings.length > 0 ? (
            <div className="space-y-3">
              {rankings.map((rankUser, index) => (
                <div
                  key={rankUser.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    rankUser.id === session?.user?.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-neutral-50 hover:bg-neutral-100"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center font-bold text-lg">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && <span className="text-neutral-500">{index + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center overflow-hidden">
                    {rankUser.avatar ? (
                      <img src={rankUser.avatar} alt={rankUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">
                        {rankUser.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name & Country */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">
                      {rankUser.name}
                      {rankUser.id === session?.user?.id && (
                        <span className="ml-2 text-xs text-primary font-normal">(You)</span>
                      )}
                    </p>
                    {rankUser.country && (
                      <p className="text-xs text-neutral-500">{rankUser.country}</p>
                    )}
                  </div>

                  {/* Post Count */}
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">{rankUser.postCount}</p>
                    <p className="text-xs text-neutral-500">posts</p>
                  </div>
                </div>
              ))}

              {/* My Rank (if not in top 10) */}
              {myRank && myRank > 10 && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500 mb-2">Your Ranking</p>
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/10 border-2 border-primary">
                    <div className="w-8 text-center font-bold text-neutral-500">{myRank}</div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                      <span className="text-white font-bold">
                        {session?.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {session?.user?.name} <span className="text-xs text-primary">(You)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">{myPostCount}</p>
                      <p className="text-xs text-neutral-500">posts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-neutral-600 mb-2">No rankings yet</p>
              <p className="text-sm text-neutral-500">Be the first to post a study log!</p>
              <Link href="/learner/post" className="btn-primary mt-4 inline-block">
                Post Study Log
              </Link>
            </div>
          )}
        </div>

        {/* Study Post Timeline */}
        <div className="mb-8">
          <StudyPostTimeline userId={user.id} />
        </div>

        {/* Article Feed */}
        <div className="mb-8">
          <ArticleFeed />
        </div>

        {/* Upcoming Sessions */}
        <div className="card">
          <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Upcoming Sessions
          </h2>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📅</span>
            </div>
            <p className="text-neutral-600 mb-4">No upcoming sessions</p>
            <Link
              href="/learner/browse"
              className="btn-primary"
            >
              Find a Host
            </Link>
          </div>
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
