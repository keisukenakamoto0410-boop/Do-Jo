"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Star,
  MessageCircle,
  Lightbulb,
  Heart,
  ArrowRight,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";

interface DetailedFeedback {
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

interface Reservation {
  id: string;
  status: string;
  sessionType: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  host: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

const TOPIC_LABELS: Record<string, string> = {
  "self-introduction": "Self-introduction",
  "daily-life": "Daily Life",
  "hobbies": "Hobbies & Interests",
  "work-career": "Work & Career",
  "japanese-culture": "Japanese Culture",
  "travel": "Travel",
  "food": "Food & Cuisine",
  "current-events": "Current Events",
};

export default function SessionSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const reservationId = params.reservationId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [feedback, setFeedback] = useState<DetailedFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (authStatus === "authenticated" && reservationId) {
      fetchData();
    }
  }, [authStatus, reservationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch reservation details (API returns data directly, not wrapped)
      const resRes = await fetch(`/api/reservations/${reservationId}`);
      if (!resRes.ok) throw new Error("Failed to fetch reservation");
      const resData = await resRes.json();
      // The API returns reservation data directly, check for detailedFeedback included
      setReservation(resData);
      if (resData.detailedFeedback) {
        setFeedback(resData.detailedFeedback);
      } else {
        // Fallback: fetch from detailed-feedback endpoint
        const feedbackRes = await fetch(
          `/api/detailed-feedback?reservationId=${reservationId}`
        );
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setFeedback(feedbackData.detailedFeedback);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i <= score
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const getScoreLabel = (score: number): string => {
    if (score === 5) return "Excellent!";
    if (score === 4) return "Great";
    if (score === 3) return "Good";
    if (score === 2) return "Fair";
    return "Needs Work";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-sky-500 hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Feedback Not Yet Available
          </h2>
          <p className="text-gray-600 mb-6">
            Your conversation partner hasn&apos;t submitted feedback yet. Please check
            back later!
          </p>
          <button
            onClick={() => router.push("/learner/dashboard")}
            className="bg-sky-500 text-white px-6 py-3 rounded-xl hover:bg-sky-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalScore =
    feedback.pronunciationScore +
    feedback.grammarScore +
    feedback.enthusiasmScore +
    feedback.comprehensionScore;
  const averageScore = totalScore / 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-6 h-6" />
            <span className="text-sky-100">Session Complete</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Your Session Feedback
          </h1>
          {reservation && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(reservation.slot.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                <User className="w-4 h-4" />
                <span>{reservation.host.name}-san</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* Overall Score Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-sky-600 mb-2">
              {averageScore.toFixed(1)}
            </div>
            <div className="text-gray-500">Overall Score</div>
            <div className="flex justify-center mt-2">
              {renderStars(Math.round(averageScore))}
            </div>
          </div>

          {/* Topics discussed */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Topics Discussed
            </h3>
            <div className="flex flex-wrap gap-2">
              {feedback.topics.map((topic, i) => (
                <span
                  key={i}
                  className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm"
                >
                  {TOPIC_LABELS[topic] || topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Detailed Evaluation
          </h2>

          <div className="space-y-4">
            {/* Pronunciation */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-800">Pronunciation</div>
                <div className="text-sm text-gray-500">発音</div>
              </div>
              <div className="text-right">
                {renderStars(feedback.pronunciationScore)}
                <div className="text-xs text-gray-500 mt-1">
                  {getScoreLabel(feedback.pronunciationScore)}
                </div>
              </div>
            </div>

            {/* Grammar */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-800">
                  Grammar & Word Usage
                </div>
                <div className="text-sm text-gray-500">文法・言葉の使い方</div>
              </div>
              <div className="text-right">
                {renderStars(feedback.grammarScore)}
                <div className="text-xs text-gray-500 mt-1">
                  {getScoreLabel(feedback.grammarScore)}
                </div>
              </div>
            </div>

            {/* Enthusiasm */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-800">
                  Communication Enthusiasm
                </div>
                <div className="text-sm text-gray-500">会話への積極性</div>
              </div>
              <div className="text-right">
                {renderStars(feedback.enthusiasmScore)}
                <div className="text-xs text-gray-500 mt-1">
                  {getScoreLabel(feedback.enthusiasmScore)}
                </div>
              </div>
            </div>

            {/* Comprehension */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-800">
                  Listening Comprehension
                </div>
                <div className="text-sm text-gray-500">聞き取り・理解力</div>
              </div>
              <div className="text-right">
                {renderStars(feedback.comprehensionScore)}
                <div className="text-xs text-gray-500 mt-1">
                  {getScoreLabel(feedback.comprehensionScore)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Good Expressions */}
        {feedback.goodExpression && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Great Expressions You Used
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {feedback.goodExpression}
              </p>
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {(feedback.improvementFrom || feedback.improvementTo) && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Improvement Tips
            </h2>
            <div className="space-y-3">
              {feedback.improvementFrom && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="text-xs text-red-600 font-medium mb-1">
                    Instead of saying:
                  </div>
                  <p className="text-gray-700">{feedback.improvementFrom}</p>
                </div>
              )}
              {feedback.improvementFrom && feedback.improvementTo && (
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              )}
              {feedback.improvementTo && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-xs text-green-600 font-medium mb-1">
                    Try saying:
                  </div>
                  <p className="text-gray-700">{feedback.improvementTo}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Encouragement Message */}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 shadow-lg border border-pink-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            Message from {reservation?.host.name}-san
          </h2>
          <div className="bg-white/80 rounded-xl p-4 border border-pink-100">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {feedback.encouragementMessage}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/learner/find")}
            className="w-full bg-sky-500 text-white py-4 rounded-xl font-bold hover:bg-sky-600 transition shadow-lg"
          >
            Book Another Session
          </button>
          <button
            onClick={() => router.push("/learner/dashboard")}
            className="w-full bg-white text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition border border-gray-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
