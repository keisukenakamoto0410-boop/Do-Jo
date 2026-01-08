"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ReservationInfo {
  id: string;
  learnerName: string;
  sessionDate: string;
}

type AnswerValue = 0 | 1 | 2;

interface Answers {
  q1: AnswerValue | null;
  q2: AnswerValue | null;
  q3: AnswerValue | null;
  q4: AnswerValue | null;
}

export default function HostFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;

  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Answers>({
    q1: null,
    q2: null,
    q3: null,
    q4: null,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role === "learner") {
      router.push("/learner/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`);
        if (!res.ok) throw new Error("Failed to fetch reservation");
        const data = await res.json();
        setReservation({
          id: data.id,
          learnerName: data.learner?.name || "学習者",
          sessionDate: data.slot?.startTime || new Date().toISOString(),
        });

        // Check if feedback already exists
        const feedbackRes = await fetch(
          `/api/feedback?reservationId=${reservationId}`
        );
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          if (feedbackData.feedback) {
            setSubmitted(true);
          }
        }
      } catch (err) {
        console.error(err);
        setError("予約情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (reservationId && session?.user?.id) {
      fetchReservation();
    }
  }, [reservationId, session?.user?.id]);

  const handleAnswer = (question: keyof Answers, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const isComplete =
    answers.q1 !== null &&
    answers.q2 !== null &&
    answers.q3 !== null &&
    answers.q4 !== null;

  const handleSubmit = async () => {
    if (!isComplete) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          q1: answers.q1,
          q2: answers.q2,
          q3: answers.q3,
          q4: answers.q4,
          message: message.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "送信に失敗しました");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!session?.user) return null;

  const isSenior = session.user.role === "senior";

  if (submitted) {
    return (
      <div
        className={`min-h-screen ${isSenior ? "bg-gradient-to-br from-amber-50 via-white to-orange-50" : "bg-gradient-to-br from-purple-50 via-white to-pink-50"}`}
      >
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/host/dashboard"
              className={`text-2xl font-bold ${isSenior ? "text-amber-600" : "text-purple-600"}`}
            >
              Do Jo
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              フィードバックを送信しました
            </h1>
            <p className="text-gray-600 mb-8">
              ご協力ありがとうございました。
              <br />
              学習者の日本語上達に役立てさせていただきます。
            </p>
            <Link
              href="/host/dashboard"
              className={`inline-block px-8 py-3 ${isSenior ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"} text-white font-bold rounded-xl transition-colors`}
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const questions = [
    {
      id: "q1" as const,
      text: "質問に対して的確に答えていましたか？",
      options: [
        { value: 2 as AnswerValue, label: "はい" },
        { value: 1 as AnswerValue, label: "ときどき" },
        { value: 0 as AnswerValue, label: "いいえ" },
      ],
    },
    {
      id: "q2" as const,
      text: "敬語を自然に使っていましたか？",
      options: [
        { value: 2 as AnswerValue, label: "はい" },
        { value: 1 as AnswerValue, label: "ときどき" },
        { value: 0 as AnswerValue, label: "いいえ" },
      ],
    },
    {
      id: "q3" as const,
      text: "言い回しに違和感がありましたか？",
      options: [
        { value: 2 as AnswerValue, label: "なかった" },
        { value: 1 as AnswerValue, label: "ときどき" },
        { value: 0 as AnswerValue, label: "よくあった" },
      ],
    },
    {
      id: "q4" as const,
      text: "日本人と話している感覚でしたか？",
      options: [
        { value: 2 as AnswerValue, label: "はい" },
        { value: 1 as AnswerValue, label: "ときどき" },
        { value: 0 as AnswerValue, label: "いいえ" },
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen ${isSenior ? "bg-gradient-to-br from-amber-50 via-white to-orange-50" : "bg-gradient-to-br from-purple-50 via-white to-pink-50"}`}
    >
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/host/dashboard"
              className={`text-2xl font-bold ${isSenior ? "text-amber-600" : "text-purple-600"}`}
            >
              Do Jo
            </Link>
            <Link
              href="/host/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            セッションフィードバック
          </h1>
          {reservation && (
            <div className="text-gray-600">
              <p>{formatDate(reservation.sessionDate)}</p>
              <p className="font-medium">{reservation.learnerName}さんとの会話</p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl shadow-lg p-6">
              <p className="font-bold text-gray-900 mb-4">
                Q{index + 1}. {question.text}
              </p>
              <div className="flex gap-3">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      answers[question.id] === option.value
                        ? isSenior
                          ? "bg-amber-500 text-white shadow-lg"
                          : "bg-purple-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Message */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="font-bold text-gray-900 mb-2">
              Q5. メッセージ（任意）
            </p>
            <p className="text-sm text-gray-500 mb-4">
              学習者に伝えたいことがあれば書いてください（最大200文字）
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              placeholder="例：今日も楽しかったです！ITの話、面白かったよ。"
              className="w-full p-4 border border-gray-200 rounded-xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-right text-sm text-gray-500 mt-2">
              {message.length}/200
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isComplete && !submitting
                ? isSenior
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {submitting ? "送信中..." : "送信する"}
          </button>
          {!isComplete && (
            <p className="text-center text-sm text-gray-500 mt-2">
              すべての質問に回答してください
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
