import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // ログイン済みの場合は各ダッシュボードにリダイレクト
  if (session) {
    const role = session.user?.role;
    if (role === "learner") {
      redirect("/learner/dashboard");
    } else if (role === "senior") {
      redirect("/senior/dashboard");
    } else {
      redirect("/host/dashboard");
    }
  }

  // 未ログインの場合はユーザータイプ選択画面を表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50">
      {/* Simple Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-center">
            <h1
              className="text-3xl font-extrabold"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: "linear-gradient(135deg, #00A8CC 0%, #006B7D 50%, #FF6B35 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Do-Jo
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Welcome to Do-Jo
          </h2>
          <p
            className="text-gray-600"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Select your user type to get started
          </p>
        </div>

        {/* User Type Cards */}
        <div className="space-y-6">
          {/* Learner Card */}
          <Link href="/for-students" className="block">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-[#00A8CC] hover:shadow-xl transition-all p-6 group">
              <div className="flex items-center gap-5">
                <div className="text-5xl">🌏</div>
                <div className="flex-1">
                  <h3
                    className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#00A8CC] transition-colors"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    I want to learn Japanese
                  </h3>
                  <p
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Practice conversation with native Japanese speakers
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-[#00A8CC] group-hover:translate-x-1 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span
                  className="inline-block px-4 py-2 bg-[#00A8CC]/10 text-[#00A8CC] rounded-lg text-sm font-medium"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  For Students
                </span>
              </div>
            </div>
          </Link>

          {/* Host Card */}
          <Link href="/login" className="block">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-[#FF6B35] hover:shadow-xl transition-all p-6 group">
              <div className="flex items-center gap-5">
                <div className="text-5xl">🇯🇵</div>
                <div className="flex-1">
                  <h3
                    className="text-xl font-bold text-gray-900 mb-1 group-hover:text-[#FF6B35] transition-colors"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    日本語を教えたい（シニアの方）
                  </h3>
                  <p
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    外国人学習者との会話ボランティア
                  </p>
                </div>
                <div className="text-gray-400 group-hover:text-[#FF6B35] group-hover:translate-x-1 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span
                  className="inline-block px-4 py-2 bg-[#FF6B35]/10 text-[#FF6B35] rounded-lg text-sm font-medium"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  ホストとして参加
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Already have an account?{" "}
            <Link href="/login" className="text-[#00A8CC] hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p
              className="text-gray-500 text-sm"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              © {new Date().getFullYear()} Do-Jo by M-JUGAAD
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-700">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
