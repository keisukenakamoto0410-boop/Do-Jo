"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLiff } from "@/hooks/useLiff";

export default function ForStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hostCount, setHostCount] = useState<number | null>(null);
  const [seniorCount, setSeniorCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // LIFFフックを使用
  const { isReady, isLoggedIn, profile, error: liffError, login } = useLiff();

  // Redirect if already logged in as learner
  useEffect(() => {
    if (session?.user?.role === "learner") {
      router.push("/learner/dashboard");
    }
  }, [session, router]);

  // Fetch host count and senior count
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [hostRes, seniorRes] = await Promise.all([
          fetch("/api/public/host-count"),
          fetch("/api/users/senior-count"),
        ]);
        const hostData = await hostRes.json();
        const seniorData = await seniorRes.json();
        setHostCount(hostData.count);
        setSeniorCount(seniorData.count);
      } catch (error) {
        console.error("Failed to fetch counts:", error);
        setHostCount(0);
        setSeniorCount(0);
      }
    };
    fetchCounts();
  }, []);

  // LIFFログイン後の処理
  useEffect(() => {
    if (isLoggedIn && profile) {
      handleLiffLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, profile]);

  // LIFFエラーの処理
  useEffect(() => {
    if (liffError) {
      setError(liffError);
    }
  }, [liffError]);

  const handleLiffLogin = async () => {
    if (!profile) return;

    setIsLoading(true);
    setError("");

    try {
      console.log("[FOR-STUDENTS] Starting LIFF login as learner:", profile);

      // バックエンドにLIFFプロフィール情報を送信（learner希望を明示）
      const response = await fetch("/api/auth/liff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          preferredRole: "learner", // learner として登録
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      console.log("[FOR-STUDENTS] User created/updated:", data);

      if (data.success) {
        // NextAuthでセッションを作成
        console.log("[FOR-STUDENTS] Creating NextAuth session...");
        const result = await signIn("line-credentials", {
          lineUserId: profile.userId,
          redirect: false,
        });

        console.log("[FOR-STUDENTS] NextAuth signIn result:", result);

        if (result?.error) {
          throw new Error(result.error);
        }

        if (result?.ok) {
          // learner dashboardへリダイレクト
          console.log("[FOR-STUDENTS] Redirecting to learner dashboard");
          window.location.href = "/learner/dashboard";
        }
      }
    } catch (err) {
      console.error("[FOR-STUDENTS] LIFF login error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in with LINE");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLineLogin = () => {
    if (!isReady) {
      setError("LINE login is not ready yet. Please wait.");
      return;
    }
    login();
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A8CC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <h1
                className="text-2xl font-extrabold"
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
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🇯🇵</div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Practice Japanese with
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                background: "linear-gradient(135deg, #00A8CC 0%, #FF6B35 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              Native Japanese Seniors!
            </span>
          </h2>
        </div>

        {/* Senior Count Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-md border border-gray-100">
            <span className="text-2xl">👥</span>
            <span
              className="text-gray-700 font-medium"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Currently{" "}
              <span className="text-[#00A8CC] font-bold text-lg">
                {seniorCount !== null ? seniorCount : "..."}
              </span>{" "}
              Japanese seniors available
            </span>
          </div>
        </div>

        {/* Features Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          {/* Benefits List */}
          <div className="space-y-4 mb-8">
            {[
              { icon: "✅", text: "Free conversation practice" },
              { icon: "✅", text: "Kind and patient seniors (60-70s)" },
              { icon: "✅", text: "25-minute sessions" },
              { icon: "✅", text: "Flexible scheduling" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <span className="text-xl">{item.icon}</span>
                <span
                  className="text-gray-700 text-lg"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* Topics Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3
              className="text-lg font-semibold text-gray-800 mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              What you can practice
            </h3>
            <div className="space-y-3">
              {[
                "Self-introduction",
                "Talking about hobbies",
                "Japanese culture & daily life",
              ].map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00A8CC]"></span>
                  <span
                    className="text-gray-600"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {topic}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LINE Login Section */}
          <div className="space-y-4">
            {/* デバッグ情報 (開発中のみ表示) */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
                <div className="font-bold mb-1">Debug Info:</div>
                <div>LIFF Ready: {isReady ? "✓" : "✗"}</div>
                <div>LIFF Logged In: {isLoggedIn ? "✓" : "✗"}</div>
                <div>Profile: {profile ? "✓" : "✗"}</div>
              </div>
            )}

            {/* エラーメッセージ */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* LINEログインボタン */}
            <button
              type="button"
              onClick={handleLineLogin}
              disabled={isLoading || !isReady}
              className="w-full py-4 px-6 bg-[#06C755] text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>ログイン中...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                  LINEでログイン・始める
                </>
              )}
            </button>

            <p
              className="text-center text-gray-500 text-sm mt-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              LINEアカウントで簡単にログインできます
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p
          className="text-center text-gray-500 text-sm"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Already have an account?{" "}
          <Link href="/login" className="text-[#00A8CC] hover:underline">
            Sign In
          </Link>
        </p>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 mt-12">
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
