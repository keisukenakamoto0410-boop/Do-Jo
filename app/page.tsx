import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

// Test auto-deploy v2 - checking master branch trigger
export default async function HomePage() {
  const session = await getServerSession(authOptions);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-sky-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                <span className="text-white font-bold text-2xl">道</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Do Jo</h1>
                <p className="text-xs text-gray-500">言葉を磨く場所</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-5 py-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                ログイン / Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-sky-500/30 transition-all"
              >
                はじめる / Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36">
          <div className="text-center max-w-4xl mx-auto">
            {/* Japanese Tagline */}
            <div className="mb-8">
              <p className="text-sky-600 text-lg font-medium mb-4 tracking-widest">
                ここでは、日本語しか使えない
              </p>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
                Sharpen <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Your</span> Japanese
              </h2>
              <p className="text-2xl sm:text-3xl text-gray-600 font-light">
                言葉を磨く道場
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              日本人と話して、本物の日本語を身につけよう。<br className="hidden sm:block" />
              Practice real Japanese with native speakers.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:shadow-2xl hover:shadow-sky-500/30 transition-all transform hover:scale-[1.02]"
              >
                今すぐ始める / Start Now
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-gray-600 border-2 border-gray-300 rounded-xl hover:border-sky-500 hover:text-sky-600 transition-all"
              >
                アカウントをお持ちの方 / Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        {/* Japanese characters decoration */}
        <div className="absolute top-20 left-10 text-8xl text-sky-100 font-bold select-none hidden lg:block">武</div>
        <div className="absolute bottom-20 right-10 text-8xl text-sky-100 font-bold select-none hidden lg:block">士</div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-sky-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Do Joの特徴 / Why Do Jo?
            </h3>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              教科書じゃ学べない、生きた日本語を。<br />
              Learn living Japanese that textbooks can't teach.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-sky-100 hover:border-sky-300 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-4xl mb-6">
                🎌
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                日本語オンリー / Japanese Only
              </h4>
              <p className="text-gray-500">
                セッション中は日本語だけ。だから上達する。<br />
                <span className="text-sm">Japanese-only sessions accelerate your learning.</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-sky-100 hover:border-sky-300 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-4xl mb-6">
                👴
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                本物の日本人 / Real Japanese People
              </h4>
              <p className="text-gray-500">
                日本に住む日本人と直接会話。<br />
                <span className="text-sm">Connect with native Japanese speakers in Japan.</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-sky-100 hover:border-sky-300 hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-4xl mb-6">
                ⏱️
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                25分集中 / 25-Min Focus
              </h4>
              <p className="text-gray-500">
                短い時間で濃密な会話練習。<br />
                <span className="text-sm">Intensive conversation practice in focused sessions.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              あなたはどっち？ / Which are you?
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Learner */}
            <div className="bg-white rounded-2xl p-8 border-2 border-sky-100 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="text-6xl mb-6">🌏</div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                学習者 / Learner
              </h4>
              <p className="text-gray-500 mb-6">
                日本語を学んでいる方<br />
                <span className="text-sm">Learning Japanese</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">✓</span>
                  日本人と会話練習 / Practice with natives
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">✓</span>
                  AIがアジェンダを作成 / AI-generated agenda
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">✓</span>
                  好きな時間に予約 / Book anytime
                </li>
              </ul>
              <Link
                href="/register?type=learner"
                className="inline-flex items-center text-sky-600 font-semibold group-hover:text-sky-700"
              >
                学習を始める / Start Learning
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Senior */}
            <div className="bg-white rounded-2xl p-8 border-2 border-sky-100 hover:border-sky-400 hover:shadow-xl transition-all group">
              <div className="text-6xl mb-6">🇯🇵</div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                日本人 / Japanese
              </h4>
              <p className="text-gray-500 mb-6">
                日本語を教えたい方<br />
                <span className="text-sm">Want to help learners</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">✓</span>
                  外国人と交流 / Connect globally
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">✓</span>
                  自宅から参加 / Work from home
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs">✓</span>
                  スキマ時間を活用 / Use spare time
                </li>
              </ul>
              <Link
                href="/register?type=senior"
                className="inline-flex items-center text-sky-600 font-semibold group-hover:text-sky-700"
              >
                ホストになる / Become a Host
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-sky-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              使い方 / How It Works
            </h3>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "登録", titleEn: "Sign Up", desc: "アカウント作成", descEn: "Create your account", icon: "📝" },
              { step: 2, title: "準備", titleEn: "Prepare", desc: "トピックを選択", descEn: "Choose your topic", icon: "📋" },
              { step: 3, title: "予約", titleEn: "Book", desc: "日本人を選ぶ", descEn: "Pick a host", icon: "📅" },
              { step: 4, title: "会話", titleEn: "Talk", desc: "日本語で話す！", descEn: "Speak Japanese!", icon: "🎯" },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-sky-500/20">
                  {item.icon}
                </div>
                <span className="inline-block px-3 py-1 bg-sky-100 text-sky-600 text-sm font-bold rounded-full mb-3">
                  Step {item.step}
                </span>
                <h4 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h4>
                <p className="text-gray-400 text-sm mb-1">{item.titleEn}</p>
                <p className="text-gray-600 text-sm">{item.desc}</p>
                <p className="text-gray-400 text-xs">{item.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                道場に入門しよう
              </h3>
              <p className="text-xl mb-2 opacity-90">
                Enter the Dojo
              </p>
              <p className="text-lg mb-8 opacity-80">
                日本語の上達は、ここから始まる。
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold bg-white text-sky-600 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                無料で始める / Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">道</span>
              </div>
              <div>
                <p className="text-xl font-bold">Do Jo</p>
                <p className="text-sm text-gray-400">言葉を磨く場所</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">プライバシー / Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">利用規約 / Terms</Link>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Do Jo by M-JUGAAD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
