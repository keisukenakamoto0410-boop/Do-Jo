"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const EMOJI_OPTIONS = [
  { emoji: "😊", label: "嬉しい" },
  { emoji: "🙏", label: "感謝" },
  { emoji: "✨", label: "楽しかった" },
  { emoji: "💪", label: "頑張れる" },
  { emoji: "🌸", label: "素敵" },
  { emoji: "🎉", label: "最高" },
];

export default function ThankYouPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;

  const [message, setMessage] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hostName, setHostName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch(`/api/reservations/${reservationId}`);
        if (res.ok) {
          const data = await res.json();
          setHostName(data.host?.name || "先生");
        }

        // 既にお礼メッセージを送信済みか確認
        const thankYouRes = await fetch(
          `/api/reservations/${reservationId}/thank-you`
        );
        if (thankYouRes.ok) {
          const thankYouData = await thankYouRes.json();
          if (thankYouData.thankYouMessage) {
            setAlreadySent(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch reservation:", error);
      }
    };

    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("メッセージを入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/reservations/${reservationId}/thank-you`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          rating,
          emoji: selectedEmoji,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || "送信に失敗しました");
      }
    } catch (error) {
      console.error("Failed to send thank you message:", error);
      alert("送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (alreadySent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Already Sent!
          </h1>
          <p className="text-gray-600 mb-6">
            You have already sent a thank you message for this session.
          </p>
          <Link
            href="/learner/dashboard"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Thank You Sent!
          </h1>
          <p className="text-gray-600 mb-2">
            Your message has been sent to {hostName}.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {hostName}さんにメッセージが届きました
          </p>
          <Link
            href="/learner/dashboard"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Send Thank You
          </h1>
          <p className="text-gray-600">
            Write a thank you message to {hostName}
          </p>
          <p className="text-gray-500 text-sm">
            {hostName}さんにお礼のメッセージを送りましょう
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How do you feel? / 気持ちを選んでください
            </label>
            <div className="flex flex-wrap gap-2 justify-center">
              {EMOJI_OPTIONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`flex flex-col items-center p-3 rounded-xl transition ${
                    selectedEmoji === emoji
                      ? "bg-orange-100 border-2 border-orange-500"
                      : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                  }`}
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-xs text-gray-500 mt-1">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How was the session? / セッションはどうでしたか？
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="text-3xl transition transform hover:scale-110"
                >
                  {star <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message / メッセージ
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thank you for the great conversation! / 素晴らしい会話をありがとうございました！"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {message.length} / 500
            </p>
          </div>

          {/* Example Messages */}
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-sm font-medium text-orange-800 mb-2">
              Examples / 例文:
            </p>
            <div className="space-y-2 text-sm text-orange-700">
              <button
                onClick={() =>
                  setMessage(
                    "Thank you for your patience and kindness! I learned a lot today."
                  )
                }
                className="block text-left hover:text-orange-900 transition"
              >
                • Thank you for your patience and kindness!
              </button>
              <button
                onClick={() =>
                  setMessage(
                    "今日は楽しかったです。また話しましょう！ (It was fun today. Let's talk again!)"
                  )
                }
                className="block text-left hover:text-orange-900 transition"
              >
                • 今日は楽しかったです。また話しましょう！
              </button>
              <button
                onClick={() =>
                  setMessage(
                    "I really enjoyed learning about Japanese culture from you!"
                  )
                }
                className="block text-left hover:text-orange-900 transition"
              >
                • I enjoyed learning about Japanese culture!
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
            className={`w-full py-4 rounded-xl font-bold text-lg transition ${
              isSubmitting || !message.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {isSubmitting ? "Sending..." : "Send Thank You 🙏"}
          </button>

          {/* Skip Link */}
          <div className="text-center">
            <Link
              href="/learner/dashboard"
              className="text-gray-500 text-sm hover:text-gray-700 transition"
            >
              Skip for now / あとで送る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
