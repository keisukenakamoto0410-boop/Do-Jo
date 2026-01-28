"use client";

import { useEffect, useState } from "react";

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirement: number;
  earned: boolean;
  earnedAt: string | null;
  progress: {
    current: number;
    target: number;
  };
}

interface ProgressData {
  totalSessions: number;
  weeklyStreak: number;
  badges: Badge[];
  earnedBadgeCount: number;
}

export default function GamificationProgress() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/user/progress");
        if (res.ok) {
          const data = await res.json();
          setProgress(data);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-24 bg-neutral-100 rounded-xl"></div>
            <div className="h-24 bg-neutral-100 rounded-xl"></div>
          </div>
          <div className="h-32 bg-neutral-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">🎮</span>
        Your Progress
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Sessions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-900">
                {progress.totalSessions}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">Week Streak</p>
              <p className="text-2xl font-bold text-orange-900">
                {progress.weeklyStreak}{" "}
                <span className="text-sm font-normal text-orange-600">
                  week{progress.weeklyStreak !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-neutral-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
            <span>🏅</span>
            Badges ({progress.earnedBadgeCount}/{progress.badges.length})
          </h3>
        </div>

        <div className="space-y-3">
          {progress.badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                badge.earned
                  ? "bg-white border-2 border-green-200 shadow-sm"
                  : "bg-neutral-100 opacity-60"
              }`}
            >
              {/* Badge Emoji */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  badge.earned
                    ? "bg-gradient-to-br from-yellow-100 to-amber-100"
                    : "bg-neutral-200 grayscale"
                }`}
              >
                {badge.emoji}
              </div>

              {/* Badge Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`font-semibold ${
                      badge.earned ? "text-neutral-900" : "text-neutral-500"
                    }`}
                  >
                    {badge.name}
                  </p>
                  {badge.earned && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Earned!
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">{badge.description}</p>

                {/* Progress bar for unearned badges */}
                {!badge.earned && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {badge.progress.current}/{badge.progress.target}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all"
                        style={{
                          width: `${(badge.progress.current / badge.progress.target) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Earned indicator */}
              {badge.earned && (
                <div className="text-green-500">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Motivational message */}
      {progress.totalSessions === 0 && (
        <div className="mt-4 text-center p-4 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-primary-700">
            <span className="font-medium">Start your journey!</span> Book your
            first session to earn your first badge 🌱
          </p>
        </div>
      )}

      {progress.totalSessions > 0 && progress.earnedBadgeCount < progress.badges.length && (
        <div className="mt-4 text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <p className="text-purple-700">
            <span className="font-medium">Keep going!</span> You&apos;re making great
            progress. Next badge is within reach! 💪
          </p>
        </div>
      )}

      {progress.earnedBadgeCount === progress.badges.length && (
        <div className="mt-4 text-center p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
          <p className="text-amber-800">
            <span className="font-medium">Amazing!</span> You&apos;ve earned all
            badges! You&apos;re a true Japanese conversation master! 🏆
          </p>
        </div>
      )}
    </div>
  );
}
