"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

// Admin emails that can access admin pages
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

export default function SeniorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "senior") {
      // Redirect to appropriate dashboard
      if (session?.user?.role === "learner") {
        router.push("/learner/dashboard");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header for Seniors */}
      <header className="bg-sky-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <Link href="/senior/dashboard" className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                <span className="text-sky-600 font-bold text-2xl">道</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Do Jo</h1>
                <p className="text-sky-100 text-sm">シニア向け</p>
              </div>
            </Link>

            {/* Simple Navigation */}
            <nav className="flex items-center gap-4">
              <Link
                href="/senior/dashboard"
                className="px-5 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-lg font-medium transition-colors"
              >
                ホーム
              </Link>
              {session?.user?.email && ADMIN_EMAILS.includes(session.user.email) && (
                <Link
                  href="/admin/reservations"
                  className="px-5 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl text-lg font-medium transition-colors"
                >
                  管理者
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-5 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-lg font-medium transition-colors"
              >
                ログアウト
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Simple Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-center text-lg text-gray-600">
            お困りの際は: keisuke.mjugaad91@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
}
