import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = session.user?.role;
    if (role === "learner") {
      redirect("/learner/dashboard");
    } else {
      redirect("/host/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">道</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Do Jo</h1>
                <p className="text-xs text-neutral-500">Bridge to Japanese Careers</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-5 py-2 text-primary-dark font-medium hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-dark rounded-full text-sm font-medium mb-6">
              <span className="mr-2">🎯</span>
              Practice Japanese with Native Speakers
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 leading-tight">
              Master Japanese for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Your Career
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-neutral-600 mb-10 max-w-2xl mx-auto">
              Real business conversations with native Japanese speakers.
              25-minute video sessions tailored to your career goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-accent to-accent-warm rounded-xl hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                Start Learning Today
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="btn-secondary"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Why Choose Do Jo?
            </h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Bridge the gap between learning and real-world communication
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
                🎯
              </div>
              <h4 className="text-xl font-bold text-neutral-900 mb-3">
                Real Scenarios
              </h4>
              <p className="text-neutral-600">
                Practice actual workplace situations with experienced Japanese professionals
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
                💬
              </div>
              <h4 className="text-xl font-bold text-neutral-900 mb-3">
                1-on-1 Sessions
              </h4>
              <p className="text-neutral-600">
                25-minute focused conversations tailored to your career goals
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
                📈
              </div>
              <h4 className="text-xl font-bold text-neutral-900 mb-3">
                Track Progress
              </h4>
              <p className="text-neutral-600">
                Share your study logs and get feedback from native speakers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Who is Do Jo for?
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Learner */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-primary transition-all hover:shadow-xl group">
              <div className="text-5xl mb-4">🌏</div>
              <h4 className="text-2xl font-bold text-neutral-900 mb-2">
                Foreign Learners
              </h4>
              <p className="text-neutral-600 mb-6">
                Want to work in Japan? Practice real business Japanese with natives.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Business Japanese & keigo
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Cultural insights
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Flexible scheduling
                </li>
              </ul>
              <Link
                href="/register?type=learner"
                className="mt-6 inline-flex items-center text-primary font-semibold group-hover:text-primary-dark"
              >
                Start learning
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Senior */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-accent transition-all hover:shadow-xl group">
              <div className="text-5xl mb-4">👴</div>
              <h4 className="text-2xl font-bold text-neutral-900 mb-2">
                Japanese Seniors
              </h4>
              <p className="text-neutral-600 mb-6">
                Share your business experience with eager learners worldwide.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Share your expertise
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Work from home
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Make an impact
                </li>
              </ul>
              <Link
                href="/register?type=senior"
                className="mt-6 inline-flex items-center text-accent font-semibold group-hover:text-accent-warm"
              >
                Become a host
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Student */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-purple-500 transition-all hover:shadow-xl group">
              <div className="text-5xl mb-4">🎓</div>
              <h4 className="text-2xl font-bold text-neutral-900 mb-2">
                University Students
              </h4>
              <p className="text-neutral-600 mb-6">
                Help foreigners practice casual Japanese conversation.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Share your language
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  Flexible schedule
                </li>
                <li className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-xs">✓</span>
                  International experience
                </li>
              </ul>
              <Link
                href="/register?type=student"
                className="mt-6 inline-flex items-center text-purple-600 font-semibold group-hover:text-purple-700"
              >
                Become a host
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              How It Works
            </h3>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Sign Up", desc: "Create your free account and set up your profile", icon: "📝" },
              { step: 2, title: "Post Daily", desc: "Share your study progress to unlock booking", icon: "📸" },
              { step: 3, title: "Book Session", desc: "Choose a host and schedule your session", icon: "📅" },
              { step: 4, title: "Practice!", desc: "Join the video call and start speaking", icon: "🎯" },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                  {item.icon}
                </div>
                <div className="absolute top-10 left-[60%] w-[80%] h-0.5 bg-neutral-200 hidden md:block last:hidden"></div>
                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-dark text-sm font-bold rounded-full mb-3">
                  Step {item.step}
                </span>
                <h4 className="font-bold text-lg text-neutral-900 mb-2">{item.title}</h4>
                <p className="text-neutral-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
            <div className="relative">
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Start Your Journey?
              </h3>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of learners mastering Japanese for their career
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-primary rounded-xl hover:bg-neutral-50 transition-colors shadow-lg"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-primary font-bold text-lg">道</span>
              </div>
              <div>
                <p className="text-xl font-bold">Do Jo</p>
                <p className="text-sm text-neutral-400">Bridge to Japanese Careers</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-neutral-400">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm text-neutral-500">
            <p>© {new Date().getFullYear()} Do Jo by M-JUGAAD. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
