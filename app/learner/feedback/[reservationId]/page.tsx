"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DetailedFeedbackData {
  id: string;
  topics: string[];
  pronunciationScore: number;
  grammarScore: number;
  enthusiasmScore: number;
  comprehensionScore: number;
  goodExpression: string | null;
  improvementFrom: string | null;
  improvementTo: string | null;
  encouragementMessage: string;
  createdAt: string;
}

interface ReservationData {
  hostName: string;
  sessionDate: string;
}

// Helper function to get score label
function getScoreLabel(score: number) {
  if (score >= 4) return { label: "Excellent", color: "text-green-600" };
  if (score >= 3) return { label: "Good", color: "text-blue-600" };
  if (score >= 2) return { label: "Fair", color: "text-yellow-600" };
  return { label: "Needs Work", color: "text-orange-600" };
}

// Helper function to get bar color
function getBarColor(score: number) {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-blue-500";
  if (score >= 2) return "bg-yellow-500";
  return "bg-orange-500";
}

// ScoreBar component defined outside main component
function ScoreBar({ score, label }: { score: number; label: string }) {
  const scoreInfo = getScoreLabel(score);
  const barColor = getBarColor(score);
  const widthPercent = (score / 5) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className={`text-sm font-semibold ${scoreInfo.color}`}>{scoreInfo.label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${barColor}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function LearnerFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;

  const [feedback, setFeedback] = useState<DetailedFeedbackData | null>(null);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
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
        // Fetch detailed feedback
        const res = await fetch(`/api/detailed-feedback?reservationId=${reservationId}`);
        if (!res.ok) throw new Error("Failed to fetch feedback");
        const data = await res.json();

        if (data.detailedFeedback) {
          setFeedback(data.detailedFeedback);
        } else {
          setError("Feedback not yet available");
        }

        // Fetch reservation details for host name and date
        const resReservation = await fetch(`/api/reservations/${reservationId}`);
        if (resReservation.ok) {
          const reservationData = await resReservation.json();
          setReservation({
            hostName: reservationData.reservation?.host?.name || "Host",
            sessionDate: reservationData.reservation?.slot?.startTime || "",
          });
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

            {/* Thank You CTA */}
            <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 text-white mb-6">
              <span className="text-3xl mb-2 block">🙏</span>
              <h3 className="text-lg font-bold mb-2">
                While you wait, send a Thank You!
              </h3>
              <p className="opacity-90 text-sm mb-4">
                Show your appreciation to your conversation partner
              </p>
              <Link
                href={`/learner/session/${reservationId}/thank-you`}
                className="inline-block px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors"
              >
                Send Thank You Message
              </Link>
            </div>

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
              href="/learner/reservations"
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Sessions
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
              {reservation && (
                <p className="text-gray-600">
                  {formatDate(reservation.sessionDate)} with {reservation.hostName}
                </p>
              )}
            </div>

            {/* Topics Discussed */}
            {feedback.topics && feedback.topics.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💬</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Topics Discussed
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {feedback.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Scores */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📈</span>
                <h2 className="text-xl font-bold text-gray-900">
                  Your Performance
                </h2>
              </div>
              <ScoreBar score={feedback.pronunciationScore} label="Pronunciation" />
              <ScoreBar score={feedback.grammarScore} label="Grammar" />
              <ScoreBar score={feedback.enthusiasmScore} label="Enthusiasm" />
              <ScoreBar score={feedback.comprehensionScore} label="Comprehension" />
            </div>

            {/* Good Expression */}
            {feedback.goodExpression && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">⭐</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Great Expression You Used
                  </h2>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-400">
                  <p className="text-gray-700 text-lg font-medium">
                    「{feedback.goodExpression}」
                  </p>
                </div>
              </div>
            )}

            {/* Improvement Suggestion */}
            {feedback.improvementFrom && feedback.improvementTo && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💡</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Tip for Improvement
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="bg-orange-50 rounded-xl p-4 border-l-4 border-orange-400">
                    <p className="text-sm text-orange-600 font-medium mb-1">Instead of:</p>
                    <p className="text-gray-700">「{feedback.improvementFrom}」</p>
                  </div>
                  <div className="flex justify-center">
                    <span className="text-2xl">↓</span>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-400">
                    <p className="text-sm text-green-600 font-medium mb-1">Try saying:</p>
                    <p className="text-gray-700">「{feedback.improvementTo}」</p>
                  </div>
                </div>
              </div>
            )}

            {/* Encouragement Message */}
            {feedback.encouragementMessage && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💌</span>
                  <h2 className="text-xl font-bold text-gray-900">
                    Message from {reservation?.hostName || "Your Host"}
                  </h2>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {feedback.encouragementMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Thank You CTA */}
            <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="text-center">
                <span className="text-4xl mb-3 block">🙏</span>
                <h3 className="text-xl font-bold mb-2">
                  Say Thank You to {reservation?.hostName || "Your Host"}!
                </h3>
                <p className="opacity-90 mb-4 text-sm">
                  Send a thank you message to show your appreciation
                </p>
                <Link
                  href={`/learner/session/${reservationId}/thank-you`}
                  className="inline-block px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Send Thank You Message
                </Link>
              </div>
            </div>

            {/* Encouragement */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white text-center mt-6">
              <p className="text-lg font-medium mb-2">
                Keep up the great work!
              </p>
              <p className="opacity-90">
                Every conversation is a step forward in your Japanese journey.
              </p>
            </div>

            {/* Back Button */}
            <div className="mt-8 text-center">
              <Link
                href="/learner/reservations"
                className="inline-block px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl shadow-lg transition-colors"
              >
                Back to Sessions
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
