"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hostCount, setHostCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in as learner
  useEffect(() => {
    if (session?.user?.role === "learner") {
      router.push("/learner/dashboard");
    }
  }, [session, router]);

  // Fetch host count
  useEffect(() => {
    const fetchHostCount = async () => {
      try {
        const res = await fetch("/api/public/host-count");
        const data = await res.json();
        setHostCount(data.count);
      } catch (error) {
        console.error("Failed to fetch host count:", error);
        setHostCount(0);
      }
    };
    fetchHostCount();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/learner/dashboard" });
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
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

        {/* Host Count Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-md border border-gray-100">
            <span className="text-2xl">👥</span>
            <span
              className="text-gray-700 font-medium"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Currently{" "}
              <span className="text-[#00A8CC] font-bold text-lg">
                {hostCount !== null ? hostCount : "..."}
              </span>{" "}
              hosts available
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

          {/* CTA Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#00A8CC] to-[#006B7D] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                </svg>
                <span>Get Started Free</span>
              </>
            )}
          </button>
          <p
            className="text-center text-gray-500 text-sm mt-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Sign in with Google to continue
          </p>
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
