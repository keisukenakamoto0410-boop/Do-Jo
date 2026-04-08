"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useLiff } from "@/hooks/useLiff";

// 日本語フレーズデータ（全て3文字以内）
const phrases = [
  // 日常フレーズ
  { ja: "やば", en: "amazing" },
  { ja: "かわ", en: "cute" },
  { ja: "すご", en: "awesome" },
  { ja: "マジ", en: "seriously" },
  { ja: "えも", en: "emotional" },
  { ja: "草", en: "lol" },
  // オノマトペ
  { ja: "ドキ", en: "heart beat" },
  { ja: "わく", en: "excited" },
  { ja: "もふ", en: "fluffy" },
  { ja: "キラ", en: "sparkling" },
  { ja: "ふわ", en: "soft" },
  { ja: "ぴか", en: "shiny" },
  // 若者言葉・スラング
  { ja: "推し", en: "favorite" },
  { ja: "神", en: "god-tier" },
  { ja: "尊い", en: "precious" },
  { ja: "沼", en: "obsessed" },
  { ja: "映え", en: "photogenic" },
  { ja: "ガチ", en: "for real" },
  // 文化・感情
  { ja: "粋", en: "stylish" },
  { ja: "縁", en: "fate" },
  { ja: "和", en: "harmony" },
  { ja: "侘び", en: "wabi" },
  { ja: "寂び", en: "sabi" },
  { ja: "癒し", en: "healing" },
  // 挨拶・礼儀
  { ja: "乙", en: "good work" },
  { ja: "よろ", en: "nice 2 meet" },
  { ja: "あざ", en: "thanks" },
  { ja: "了解", en: "roger" },
  { ja: "無理", en: "impossible" },
  { ja: "最高", en: "the best" },
];

// フレーズを3つのグループに分割
const row1Phrases = phrases.slice(0, 10);
const row2Phrases = phrases.slice(10, 20);
const row3Phrases = phrases.slice(20, 30);

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [seniorCount, setSeniorCount] = useState<number | null>(null);

  // LIFFフックを使用
  const { isReady, isLoggedIn, profile, error: liffError, login } = useLiff();

  useEffect(() => {
    // ページロード時のフェードイン
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 日本人シニアの人数を取得
    fetch("/api/users/senior-count")
      .then((res) => res.json())
      .then((data) => setSeniorCount(data.count))
      .catch(() => setSeniorCount(null));
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

    setLoading(true);
    setError("");

    try {
      console.log("[LOGIN] Starting LIFF login process with profile:", profile);

      // Step 1: バックエンドにLIFFプロフィール情報を送信してユーザー作成/更新
      const response = await fetch("/api/auth/liff-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const data = await response.json();
      console.log("[LOGIN] User created/updated:", data);

      if (data.success) {
        // Step 2: NextAuthでセッションを作成
        console.log("[LOGIN] Creating NextAuth session...");
        const result = await signIn("line-credentials", {
          lineUserId: profile.userId,
          redirect: false,
        });

        console.log("[LOGIN] NextAuth signIn result:", result);

        if (result?.error) {
          throw new Error(result.error);
        }

        if (result?.ok) {
          // Step 3: ロール別にリダイレクト（完全なページリロードで確実にセッションを反映）
          console.log("[LOGIN] Session created successfully, redirecting based on role:", data.user.role);
          const role = data.user.role;
          let targetUrl = "/";

          if (role === "learner") {
            targetUrl = "/learner/dashboard";
          } else if (role === "senior" || role === "admin") {
            // senior and admin both use senior dashboard (Japanese speakers)
            targetUrl = "/senior/dashboard";
          } else if (role === "student") {
            targetUrl = "/host/dashboard";
          }

          // 完全なページリロードでセッションを確実に反映
          console.log("[LOGIN] Redirecting to:", targetUrl);
          window.location.href = targetUrl;
        }
      }
    } catch (err) {
      console.error("[LOGIN] LIFF login error:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in with LINE");
    } finally {
      setLoading(false);
    }
  };

  const handleLineLogin = () => {
    if (!isReady) {
      setError("LINE login is not ready yet. Please wait.");
      return;
    }
    login();
  };

  // アイコンカラーのバリエーション
  const iconColors = [
    { bg: "rgba(0, 168, 204, 0.15)", border: "rgba(0, 168, 204, 0.3)", text: "#006B7D" },
    { bg: "rgba(255, 107, 53, 0.15)", border: "rgba(255, 107, 53, 0.3)", text: "#E64A19" },
    { bg: "rgba(255, 167, 38, 0.15)", border: "rgba(255, 167, 38, 0.3)", text: "#F57C00" },
    { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", text: "#059669" },
    { bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)", text: "#7C3AED" },
  ];

  // フレーズ行をレンダリング（円形アイコンスタイル）
  const renderPhraseRow = (phraseList: typeof phrases, direction: "left" | "right", opacity: number) => {
    const tripled = [...phraseList, ...phraseList, ...phraseList];
    return (
      <div
        className="flex whitespace-nowrap items-center"
        style={{
          animation: `scroll-${direction} ${direction === "left" ? "50s" : "55s"} linear infinite`,
          opacity,
        }}
      >
        {tripled.map((phrase, i) => {
          const color = iconColors[i % iconColors.length];
          return (
            <div
              key={i}
              className="flex flex-col items-center mx-4 md:mx-6"
            >
              {/* 円形アイコン */}
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2 border-2 shadow-lg"
                style={{
                  background: color.bg,
                  borderColor: color.border,
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="text-lg md:text-2xl font-bold"
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    color: color.text,
                  }}
                >
                  {phrase.ja.slice(0, 3)}
                </span>
              </div>
              {/* 英語の意味 */}
              <span
                className="text-[10px] md:text-xs text-center max-w-[80px] md:max-w-[100px] truncate"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: "#566573",
                }}
              >
                {phrase.en}
              </span>
            </div>
          );
        })}
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
        <div className="absolute top-[3%] md:top-[5%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row1Phrases, "left", 0.8)}
        </div>

        {/* スクロールフレーズ - 中上部 */}
        <div className="absolute top-[18%] md:top-[22%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row2Phrases, "right", 0.6)}
        </div>

        {/* スクロールフレーズ - 下部 */}
        <div className="absolute bottom-[3%] md:bottom-[5%] left-0 right-0 overflow-hidden pointer-events-none">
          {renderPhraseRow(row3Phrases, "left", 0.7)}
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
                {seniorCount !== null && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00A8CC]/10 to-[#FF6B35]/10 border border-[#00A8CC]/20">
                    <span className="text-2xl font-bold text-[#00A8CC]">{seniorCount}</span>
                    <span className="text-xs text-[#566573]">Japanese speakers ready to talk</span>
                  </div>
                )}
              </div>

              {/* デバッグ情報 (開発中のみ表示) */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
                  <div className="font-bold mb-1">Debug Info:</div>
                  <div>LIFF Ready: {isReady ? "✓" : "✗"}</div>
                  <div>LIFF Logged In: {isLoggedIn ? "✓" : "✗"}</div>
                  <div>Profile: {profile ? "✓" : "✗"}</div>
                  <div className="mt-2 text-[10px]">Check browser console (F12) for detailed logs</div>
                </div>
              )}

              {/* エラーメッセージ */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Error:</div>
                      <div>{error}</div>
                      <div className="mt-2 text-xs opacity-75">
                        Please check browser console (F12) for more details
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LINEログインボタン */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleLineLogin}
                  disabled={loading || !isReady}
                  className="w-full py-4 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    backgroundColor: "#06C755",
                    color: "white",
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      ログイン中...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                      </svg>
                      LINEでログイン
                    </>
                  )}
                </button>
              </div>

              {/* 説明テキスト */}
              <div className="mt-6 text-center">
                <p className="text-xs text-[#566573] leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  LINEアカウントで簡単にログインできます。<br />
                  初めての方は自動的にアカウントが作成されます。
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
