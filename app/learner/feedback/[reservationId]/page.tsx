"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface FeedbackData {
  id: string;
  message: string | null;
  hostName: string;
  sessionDate: string;
  strengths: string[];
  improvements: string[];
}

export default function LearnerFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;

  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "learner") {
      router.push("/host/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch(`/api/feedback?reservationId=${reservationId}`);
        if (!res.ok) throw new Error("Failed to fetch feedback");
        const data = await res.json();

        if (data.feedback) {
          setFeedback(data.feedback);
        } else {
          setError("Feedback not yet available");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };

    if (reservationId && session?.user?.id) {
      fetchFeedback();
    }
  }, [reservationId, session?.user?.id]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (error === "Feedback not yet available") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <Link
                href="/learner/dashboard"
                className="text-2xl font-bold text-blue-600"
              >
                Do Jo
              </Link>
              <Link
                href="/learner/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Feedback Not Yet Available
            </h1>
            <p className="text-gray-600 mb-8">
              Your conversation partner hasn&apos;t submitted feedback yet.
              <br />
              Please check back later!
            </p>
            <Link
              href="/learner/dashboard"
              className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/learner/dashboard"
              className="text-2xl font-bold text-blue-600"
            >
              Do Jo
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Link
              href="/learner/dashboard"
              className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/learner/dashboard"
              className="text-2xl font-bold text-blue-600"
            >
              Do Jo
            </Link>
            <Link
              href="/learner/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {feedback && (
          <>
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📊</span>
                <h1 className="text-2xl font-bold text-gray-900">
                  Session Feedback
                </h1>
              </div>
              <p className="text-gray-600">
                {formatDate(feedback.sessionDate)} with {feedback.hostName}
              </p>
            </div>

            {/* Strengths */}
            {feedback.strengths.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💪</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    What You Did Well
                  </h2>
                </div>
                <ul className="space-y-3">
                  {feedback.strengths.map((strength, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 bg-green-50 rounded-xl p-4"
                    >
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {feedback.improvements.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📈</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Areas to Improve
                  </h2>
                </div>
                <ul className="space-y-3">
                  {feedback.improvements.map((improvement, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 bg-blue-50 rounded-xl p-4"
                    >
                      <span className="text-blue-500 mt-0.5">→</span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Message from Host */}
            {feedback.message && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💬</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Message from {feedback.hostName}
                  </h2>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    &ldquo;{feedback.message}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Encouragement */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white text-center">
              <p className="text-lg font-medium mb-2">
                Keep up the great work! 🌟
              </p>
              <p className="opacity-90">
                Every conversation is a step forward in your Japanese journey.
              </p>
            </div>

            {/* Back Button */}
            <div className="mt-8 text-center">
              <Link
                href="/learner/dashboard"
                className="inline-block px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl shadow-lg transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
