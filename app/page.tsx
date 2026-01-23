import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "@/components/AnimatedBackground";

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
    <AnimatedBackground>
      {/* Header */}
      <header className="border-b border-white/20 bg-white/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
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
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-5 py-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FFA726] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-36">
          <div className="text-center max-w-4xl mx-auto">
            {/* Tagline */}
            <div className="mb-8">
              <p
                className="text-[#00A8CC] text-lg font-medium mb-4 tracking-widest"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                日本語を楽しもう
              </p>
              <h2
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-4 leading-tight tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Connect with{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    background: "linear-gradient(135deg, #00A8CC 0%, #FF6B35 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                >
                  Japanese
                </span>
              </h2>
              <p
                className="text-2xl sm:text-3xl text-gray-600 font-light"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                A community for real conversations
              </p>
            </div>

            {/* Subtitle */}
            <p
              className="text-lg sm:text-xl text-[#566573] mb-12 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Practice real Japanese with native speakers.<br className="hidden sm:block" />
              No English allowed. Just pure immersion.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-50 mt-40">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white rounded-xl transition-all transform hover:scale-[1.02]"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  backgroundColor: "#FF6B35",
                }}
              >
                Start Now
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold border-2 border-[#00A8CC] rounded-xl hover:bg-[#00A8CC] hover:text-white transition-all"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  backgroundColor: "#FFFFFF",
                  color: "#00A8CC",
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div
          className="absolute inset-0"
          style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(10px)" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h3
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Why Do-Jo?
            </h3>
            <p
              className="text-lg text-[#566573] max-w-2xl mx-auto"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Learn living Japanese that textbooks can't teach.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "🎌",
                title: "Japanese Only",
                desc: "Sessions are 100% in Japanese. That's how you level up fast.",
              },
              {
                emoji: "👴",
                title: "Real People",
                desc: "Connect with native Japanese speakers living in Japan.",
              },
              {
                emoji: "⏱️",
                title: "25-Min Focus",
                desc: "Intensive conversation practice in focused sessions.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/50 hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#00A8CC]/10 to-[#FF6B35]/10 rounded-2xl flex items-center justify-center text-4xl mb-6">
                  {item.emoji}
                </div>
                <h4
                  className="text-xl font-bold text-gray-900 mb-3"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {item.title}
                </h4>
                <p className="text-[#566573]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Which are you?
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Learner */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/50 hover:border-[#00A8CC] hover:shadow-xl transition-all group">
              <div className="text-6xl mb-6">🌏</div>
              <h4
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Learner
              </h4>
              <p className="text-[#566573] mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Learning Japanese
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Practice with natives",
                  "AI-generated agenda",
                  "Book anytime",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#00A8CC]/10 text-[#00A8CC] flex items-center justify-center text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?type=learner"
                className="inline-flex items-center text-[#00A8CC] font-semibold group-hover:text-[#006B7D]"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start Learning
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Senior */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/50 hover:border-[#FF6B35] hover:shadow-xl transition-all group">
              <div className="text-6xl mb-6">🇯🇵</div>
              <h4
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Japanese Host
              </h4>
              <p className="text-[#566573] mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Want to help learners
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Connect globally",
                  "Work from home",
                  "Use spare time",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?type=senior"
                className="inline-flex items-center text-[#FF6B35] font-semibold group-hover:text-[#E64A19]"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Become a Host
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 relative">
        <div
          className="absolute inset-0"
          style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(10px)" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h3
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              How It Works
            </h3>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Sign Up", desc: "Create your account", icon: "📝" },
              { step: 2, title: "Prepare", desc: "Choose your topic", icon: "📋" },
              { step: 3, title: "Book", desc: "Pick a host", icon: "📅" },
              { step: 4, title: "Talk", desc: "Speak Japanese!", icon: "🎯" },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00A8CC] to-[#006B7D] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-[#00A8CC]/20">
                  {item.icon}
                </div>
                <span
                  className="inline-block px-3 py-1 bg-[#00A8CC]/10 text-[#00A8CC] text-sm font-bold rounded-full mb-3"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Step {item.step}
                </span>
                <h4
                  className="font-bold text-lg text-gray-900 mb-1"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {item.title}
                </h4>
                <p className="text-[#566573] text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-3xl p-12 text-center text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #00A8CC 0%, #006B7D 50%, #FF6B35 100%)",
            }}
          >
            <div className="relative">
              <h3
                className="text-3xl sm:text-4xl font-bold mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Enter the Dojo
              </h3>
              <p
                className="text-xl mb-2 opacity-90"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                日本語を楽しもう
              </p>
              <p
                className="text-lg mb-8 opacity-80"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Your Japanese journey starts here.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold bg-white text-[#00A8CC] rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: "linear-gradient(135deg, #00A8CC 0%, #FF6B35 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Do-Jo
              </p>
              <span className="text-gray-400 text-sm" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                日本語を楽しもう
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Do-Jo by M-JUGAAD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </AnimatedBackground>
  );
}
