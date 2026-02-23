"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hostCount, setHostCount] = useState<number | null>(null);
  const [seniorCount, setSeniorCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/learner/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in");
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all text-sm"
              placeholder="Email address"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all text-sm"
              placeholder="Password"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#00A8CC] to-[#006B7D] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <p
            className="text-center text-gray-500 text-sm mt-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#00A8CC] hover:underline font-medium">
              Create one
            </Link>
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
