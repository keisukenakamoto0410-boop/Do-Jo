"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import CalendarAvailability from "@/components/CalendarAvailability";

export default function HostSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isSenior = session?.user?.role === "senior";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role === "learner") {
      router.push("/learner/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${isSenior ? "from-amber-50 via-white to-orange-50" : "from-purple-50 via-white to-pink-50"}`}
      >
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isSenior ? "border-amber-600" : "border-purple-600"}`}
        ></div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div
      className={`min-h-screen ${isSenior ? "bg-gradient-to-br from-amber-50 via-white to-orange-50" : "bg-gradient-to-br from-purple-50 via-white to-pink-50"}`}
    >
      {/* Mobile Navigation */}
      <MobileNav isLearner={false} />

      {/* Desktop Header - hidden on mobile */}
      <header className="hidden lg:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/host/dashboard"
              className={`text-2xl font-bold ${isSenior ? "text-amber-600" : "text-purple-600"}`}
            >
              Do Jo
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/host/schedule"
                className={`${isSenior ? "text-amber-600" : "text-purple-600"} font-medium`}
              >
                スケジュール
              </Link>
              <Link
                href="/host/reservations"
                className="text-gray-600 hover:text-gray-900"
              >
                予約一覧
              </Link>
              {isStudent && (
                <Link
                  href="/host/earnings"
                  className="text-gray-600 hover:text-gray-900"
                >
                  収益管理
                </Link>
              )}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isSenior ? "🏯" : "🎓"}</span>
                <span className="font-medium">{session.user.name}</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-20 lg:pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">スケジュール管理</h1>
        <p className="text-gray-600 mb-6">カレンダーの日付をクリックして予約枠を設定してください</p>

        {/* Calendar View */}
        <CalendarAvailability />
      </main>
    </div>
  );
}
