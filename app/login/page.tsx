"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 日本語フレーズデータ
const phrases = [
  // 日常フレーズ
  { ja: "やばい", en: "amazing / crazy" },
  { ja: "かわいい", en: "cute" },
  { ja: "なるほど", en: "I see" },
  { ja: "すごい", en: "awesome" },
  { ja: "マジで", en: "seriously" },
  { ja: "ちょっと", en: "a little / excuse me" },
  // オノマトペ
  { ja: "ドキドキ", en: "heart beating" },
  { ja: "わくわく", en: "excited" },
  { ja: "もふもふ", en: "fluffy" },
  { ja: "キラキラ", en: "sparkling" },
  { ja: "ふわふわ", en: "soft / fluffy" },
  { ja: "ぴかぴか", en: "shiny" },
  // 若者言葉・スラング
  { ja: "エモい", en: "emotional / aesthetic" },
  { ja: "草", en: "lol" },
  { ja: "推し", en: "favorite / bias" },
  { ja: "神", en: "god-tier / amazing" },
  { ja: "尊い", en: "precious" },
  { ja: "沼", en: "obsessed with" },
  // 文化的表現
  { ja: "空気を読む", en: "read the room" },
  { ja: "侘び寂び", en: "wabi-sabi beauty" },
  { ja: "一期一会", en: "once in a lifetime" },
  { ja: "木漏れ日", en: "sunlight through leaves" },
  { ja: "懐かしい", en: "nostalgic" },
  { ja: "切ない", en: "bittersweet" },
  // 挨拶・礼儀
  { ja: "頑張って", en: "good luck / do your best" },
  { ja: "お邪魔します", en: "excuse me for intruding" },
  { ja: "いただきます", en: "thank you for the food" },
  { ja: "お疲れ様", en: "good work" },
  { ja: "よろしく", en: "nice to meet you" },
  { ja: "ただいま", en: "I'm home" },
];

// フレーズを3つのグループに分割
const row1Phrases = phrases.slice(0, 10);
const row2Phrases = phrases.slice(10, 20);
const row3Phrases = phrases.slice(20, 30);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isGoogleHovered, setIsGoogleHovered] = useState(false);
  const [isGuestHovered, setIsGuestHovered] = useState(false);

  useEffect(() => {
    // ページロード時のフェードイン
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user?.role === "learner") {
        router.push("/learner/dashboard");
      } else if (session?.user?.role === "senior") {
        router.push("/senior/dashboard");
      } else if (session?.user?.role === "student") {
        router.push("/host/dashboard");
      } else if (session?.user?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/learner/dashboard" });
  };

  // フレーズ行をレンダリング
  const renderPhraseRow = (phraseList: typeof phrases, direction: "left" | "right", opacity: number) => {
    const tripled = [...phraseList, ...phraseList, ...phraseList];
    return (
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `scroll-${direction} ${direction === "left" ? "40s" : "45s"} linear infinite`,
          opacity,
        }}
      >
        {tripled.map((phrase, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mx-4 text-sm md:text-base"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            <span className="font-bold text-[#1A2332]">{phrase.ja}</span>
            <span
              className="text-[#566573] text-xs"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {phrase.en}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;600;800&display=swap');

        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }

        @keyframes scroll-right {
          0% { transform: translateX(-33.33%); }
          100% { transform: translateX(0); }
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* グラデーション背景 */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #F8FAFB 0%, #E6F7FB 50%, #FFF3EE 100%)",
          }}
        />

        {/* グラデーションオーブ */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, #00A8CC 0%, transparent 70%)",
            top: "-200px",
            right: "-200px",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #FF6B35 0%, transparent 70%)",
            bottom: "-150px",
            left: "-150px",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-25 blur-3xl"
          style={{
            background: "radial-gradient(circle, #FFA726 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* スクロールフレーズ - 上部 */}
        <div className="absolute top-[8%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row1Phrases, "left", 0.7)}
        </div>

        {/* スクロールフレーズ - 中部 */}
        <div className="absolute top-[20%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row2Phrases, "right", 0.5)}
        </div>

        {/* スクロールフレーズ - 下部 */}
        <div className="absolute bottom-[8%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row3Phrases, "left", 0.6)}
        </div>

        {/* メインコンテンツ */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm transition-all duration-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Glassmorphism カード */}
            <div
              className="rounded-3xl p-8 shadow-2xl border border-white/50"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* ロゴセクション */}
              <div className="text-center mb-6">
                <Link href="/" className="inline-block">
                  <h1
                    className="text-5xl font-extrabold mb-1"
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      background: "linear-gradient(135deg, #00A8CC 0%, #006B7D 50%, #FF6B35 100%)",
                      backgroundSize: "200% 200%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "float 3s ease-in-out infinite, gradient-shift 4s ease infinite",
                    }}
                  >
                    Do-Jo
                  </h1>
                  <p
                    className="text-xs tracking-[0.25em] text-[#566573]"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    日本語を楽しもう
                  </p>
                </Link>
              </div>

              {/* タグライン */}
              <div className="text-center mb-8">
                <p
                  className="text-sm text-[#566573] leading-relaxed"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                >
                  Connect with Japanese.<br />
                  A community for real conversations.
                </p>
              </div>

              {/* Googleログインボタン */}
              <button
                onClick={handleGoogleSignIn}
                onMouseEnter={() => setIsGoogleHovered(true)}
                onMouseLeave={() => setIsGoogleHovered(false)}
                className="w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: isGoogleHovered
                    ? "linear-gradient(135deg, #FF6B35 0%, #FFA726 100%)"
                    : "#FF6B35",
                  transform: isGoogleHovered ? "scale(1.03)" : "scale(1)",
                  boxShadow: isGoogleHovered
                    ? "0 10px 40px rgba(255, 107, 53, 0.4)"
                    : "0 4px 15px rgba(255, 107, 53, 0.3)",
                }}
              >
                {/* Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* 区切り線 */}
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-[#E4E7EB]" />
                <span className="px-4 text-xs text-[#566573]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  or
                </span>
                <div className="flex-1 h-px bg-[#E4E7EB]" />
              </div>

              {/* メールログインフォーム */}
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
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-[#1A2332] placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all text-sm"
                  placeholder="Email address"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/50 border-2 border-[#E4E7EB] rounded-xl text-[#1A2332] placeholder-[#9AA5B1] focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent transition-all text-sm"
                  placeholder="Password"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                />

                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setIsGuestHovered(true)}
                  onMouseLeave={() => setIsGuestHovered(false)}
                  className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 border-2"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    borderColor: "#00A8CC",
                    background: isGuestHovered ? "#00A8CC" : "transparent",
                    color: isGuestHovered ? "white" : "#00A8CC",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign in with Email"
                  )}
                </button>
              </form>

              {/* リンク */}
              <div className="mt-6 space-y-2 text-center">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#566573] hover:text-[#00A8CC] transition-colors"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Forgot your password?
                </Link>
                <p className="text-xs text-[#566573]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-[#00A8CC] font-semibold hover:text-[#006B7D]">
                    Create one
                  </Link>
                </p>
              </div>

              {/* フッター */}
              <p
                className="mt-6 text-center text-[0.65rem] text-[#566573]"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-[#00A8CC]">
                  Terms of Service
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
