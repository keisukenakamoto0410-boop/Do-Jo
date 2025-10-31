import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary-500">Do Jo</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 font-jp">
            日本語面接練習プラットフォーム
          </p>
          <p className="text-lg text-gray-700 mb-12">
            Practice Japanese interviews with experienced interviewers.
            <br />
            Improve your language skills and interview performance.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Link
              href="/login"
              className="bg-primary-500 text-white px-8 py-4 rounded-lg hover:bg-primary-600 transition-colors shadow-lg"
            >
              <h2 className="text-2xl font-semibold mb-2">For Candidates</h2>
              <p className="text-primary-100">
                Practice interviews and get feedback
              </p>
            </Link>

            <Link
              href="/login"
              className="bg-secondary-500 text-white px-8 py-4 rounded-lg hover:bg-secondary-600 transition-colors shadow-lg"
            >
              <h2 className="text-2xl font-semibold mb-2">For Interviewers</h2>
              <p className="text-secondary-100">
                Conduct interviews and provide feedback
              </p>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-accent-500 text-3xl mb-3">📹</div>
              <h3 className="text-xl font-semibold mb-2">Video Recording</h3>
              <p className="text-gray-600">
                Record and review your interview sessions
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-accent-500 text-3xl mb-3">📝</div>
              <h3 className="text-xl font-semibold mb-2">Detailed Feedback</h3>
              <p className="text-gray-600">
                Get comprehensive feedback from experienced interviewers
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-accent-500 text-3xl mb-3">📈</div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your improvement over time
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
