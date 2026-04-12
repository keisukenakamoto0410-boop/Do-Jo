"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function TermsPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  useEffect(() => {
    // Check if user needs to accept terms (termsAccepted: false)
    if (session?.user) {
      const userTermsAccepted = (session.user as any).termsAccepted;
      if (userTermsAccepted === false || userTermsAccepted === undefined) {
        setNeedsAcceptance(true);
      } else {
        // User has already accepted, this is view-only mode
        setIsViewOnly(true);
      }
    } else if (status === "unauthenticated") {
      // Not logged in, this is view-only mode
      setIsViewOnly(true);
    }
  }, [session, status]);

  const handleAgree = async () => {
    if (!agreed) return;

    if (needsAcceptance && session?.user) {
      // User needs to accept terms in DB
      setLoading(true);
      try {
        const response = await fetch("/api/auth/accept-terms", {
          method: "POST",
        });

        if (response.ok) {
          // Update session
          await update();

          // Redirect to appropriate dashboard based on role
          const userRole = (session.user as any).role;
          if (userRole === "senior" || userRole === "admin") {
            router.push("/senior/dashboard");
          } else {
            router.push("/learner/dashboard");
          }
        } else {
          alert("利用規約の同意処理に失敗しました。もう一度お試しください。");
        }
      } catch (error) {
        console.error("Error accepting terms:", error);
        alert("エラーが発生しました。もう一度お試しください。");
      } finally {
        setLoading(false);
      }
    } else {
      // Store agreement in localStorage for non-logged-in users
      localStorage.setItem("termsAgreed", "true");
      // Redirect to login or home
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Do Jo（道場）
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🤝</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Do Jo（道場）<br />利用のルール
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            楽しく、安全に使っていただくための<br className="sm:hidden" />
            大切なお約束です
          </p>
        </div>

        {/* Rules Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">🎯</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  1. 目的（何をする場所か）
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  シニアと外国人が楽しく話し、助け合うための場所です。<br />
                  <strong className="text-orange-600">お互いをリスペクト（尊敬）しましょう。</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">⚠️</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  2. 自己責任（自分の責任で会う）
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  メンバー同士で直接会う場合は、<strong className="text-blue-600">自分の責任</strong>でお願いします。<br />
                  会った後に起きたトラブルについて、Do Jo（運営者）は責任を取れません。
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">🚫</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  3. やってはいけないこと（禁止事項）
                </h3>
                <ul className="space-y-3 text-base sm:text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                    <span><strong>お金や物の貸し借り</strong>はしないでください。</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                    <span><strong>宗教、政治、怪しいビジネスの勧誘</strong>は禁止です。</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                    <span>相手が嫌がる言葉（<strong>差別や悪口</strong>）を使わないでください。</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold flex-shrink-0">✗</span>
                    <span><strong>許可なく他人の写真や連絡先</strong>を外部に教えないでください。</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">📸</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  4. 写真について
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  活動中の写真は、<strong className="text-purple-600">Do Joの活動を広めるため</strong>に使わせてもらうことがあります。
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">🏪</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  5. クーポンやお店について（免責事項）
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  Do Joで紹介するお店のクーポンや情報は、お店の都合で<strong className="text-green-600">急に使えなくなることがあります</strong>。<br />
                  その場合、Do Joは責任を負えません。お店に行く前に、自分で確認をお願いします。
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">💬</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  6. メッセージや感想の利用（口コミの活用）
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  皆さんがDo Joに書いてくれた「お店の感想」や「お礼のメッセージ」は、<br />
                  <strong className="text-cyan-600">Do Joの活動を他の人に紹介するため</strong>（ホームページや資料など）に使わせてもらうことがあります。
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">🔄</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  7. ルールの変更とサービスの終了
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  Do Joは現在「<strong className="text-yellow-600">テスト中（実験中）</strong>」です。<br />
                  そのため、ルールが急に変わったり、サービスを一時的にお休み（または終了）したりすることがあります。<br />
                  あらかじめご了承ください。
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border-l-4 border-pink-500 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">🛑</div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                  8. ルールを守れない場合
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  <strong className="text-pink-600">ルールを守れない人は、すぐにグループから抜けてもらいます。</strong>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Agreement Checkbox */}
        {!isViewOnly && (
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <label className="flex items-start gap-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
              />
              <span className="text-base sm:text-lg text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                上記のルールを読んで、内容を理解しました。<br />
                <strong>ルールを守って、楽しく安全に使います。</strong>
              </span>
            </label>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 text-center">
          {isViewOnly ? (
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto px-12 py-5 text-xl sm:text-2xl font-bold rounded-2xl shadow-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 hover:shadow-2xl transition-all duration-300"
            >
              <span className="inline-block mr-3">←</span>
              戻る
            </button>
          ) : (
            <button
              onClick={handleAgree}
              disabled={!agreed || loading}
              className={`
                w-full sm:w-auto
                px-12 py-5
                text-xl sm:text-2xl font-bold
                rounded-2xl
                shadow-xl
                transition-all duration-300
                transform
                ${
                  agreed && !loading
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {loading ? (
                <>
                  <span className="inline-block mr-3">⏳</span>
                  処理中...
                </>
              ) : agreed ? (
                <>
                  <span className="inline-block mr-3">✓</span>
                  ルールに同意してはじめる
                </>
              ) : (
                <>
                  <span className="inline-block mr-3">□</span>
                  まずチェックボックスにチェックを入れてください
                </>
              )}
            </button>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm sm:text-base text-gray-500">
            質問がある場合は、運営チームにお問い合わせください。<br />
            <a href="mailto:keisuke.nakamoto0410@gmail.com" className="text-orange-600 hover:underline font-medium">
              keisuke.nakamoto0410@gmail.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
