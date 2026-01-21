import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">道</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Do Jo</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sky-600 hover:text-sky-700 font-medium"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Do Jo</h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              What is Do Jo?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Do Jo (道場) is an online platform that connects Japanese language learners
              with native Japanese speakers for authentic conversation practice.
              Our mission is to help you sharpen your Japanese skills through real,
              meaningful conversations.
            </p>
            <p className="text-gray-600 leading-relaxed">
              日本語学習者と日本人をつなぎ、本物の会話練習を提供するオンラインプラットフォームです。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="text-3xl mb-3">📅</div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Book a Session</h3>
                <p className="text-gray-600 text-sm">
                  Choose a time slot and conversation topic that works for you.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Have a Conversation</h3>
                <p className="text-gray-600 text-sm">
                  Practice speaking Japanese with a native speaker via video call.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Improve</h3>
                <p className="text-gray-600 text-sm">
                  Receive feedback and track your progress over time.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Our Values
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-sky-500 mt-1">✓</span>
                <span>Authentic conversations with real native speakers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-sky-500 mt-1">✓</span>
                <span>Personalized learning experience based on your level</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-sky-500 mt-1">✓</span>
                <span>Safe and supportive community environment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-sky-500 mt-1">✓</span>
                <span>Flexible scheduling to fit your lifestyle</span>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Get Started Today
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>&copy; 2024 Do Jo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
