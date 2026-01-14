"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ReservationInfo {
  id: string;
  learnerName: string;
  learnerCountry?: string;
  sessionDate: string;
}

const TOPIC_OPTIONS = [
  { id: "self_intro", label: "自己紹介" },
  { id: "work_career", label: "仕事・キャリア" },
  { id: "japanese_culture", label: "日本の文化" },
  { id: "travel", label: "旅行" },
  { id: "food", label: "食べ物・料理" },
  { id: "hobbies", label: "趣味・休日の過ごし方" },
  { id: "daily_life", label: "日常会話" },
  { id: "business_keigo", label: "ビジネス・敬語" },
];

const SCORE_OPTIONS = {
  pronunciation: [
    { value: 5, label: "とても聞き取りやすかった" },
    { value: 4, label: "ほとんど聞き取れた" },
    { value: 3, label: "時々聞き取りにくい部分があった" },
    { value: 2, label: "聞き取りにくい部分が多かった" },
    { value: 1, label: "ほとんど聞き取れなかった" },
  ],
  grammar: [
    { value: 5, label: "自然な日本語だった" },
    { value: 4, label: "少し不自然な部分があったが十分伝わった" },
    { value: 3, label: "間違いはあるが意味は理解できた" },
    { value: 2, label: "間違いが多く、理解に苦労した" },
    { value: 1, label: "ほとんど理解できなかった" },
  ],
  enthusiasm: [
    { value: 5, label: "自分からたくさん話してくれた" },
    { value: 4, label: "質問にしっかり答え、質問もしてくれた" },
    { value: 3, label: "質問には答えてくれた" },
    { value: 2, label: "返答が短く、会話が続きにくかった" },
    { value: 1, label: "ほとんど話してくれなかった" },
  ],
  comprehension: [
    { value: 5, label: "普通のスピードで全て理解していた" },
    { value: 4, label: "ほとんど理解していた" },
    { value: 3, label: "ゆっくり話せば理解できた" },
    { value: 2, label: "簡単な言葉でも伝わりにくかった" },
    { value: 1, label: "ほとんど通じなかった" },
  ],
};

const EXAMPLE_MESSAGES = [
  "今日はありがとうございました！〇〇の話がとても面白かったです。",
  "日本語がとても上手ですね！自信を持ってください。",
  "一生懸命話してくれて嬉しかったです。日本の会社でもきっとうまくいきますよ！",
  "敬語を使おうとしているのが伝わりました。面接でも好印象だと思います！",
  "日本に来たらぜひ〇〇に行ってみてくださいね！応援しています。",
];

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

  // Form state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [otherTopic, setOtherTopic] = useState("");
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [grammarScore, setGrammarScore] = useState<number | null>(null);
  const [enthusiasmScore, setEnthusiasmScore] = useState<number | null>(null);
  const [comprehensionScore, setComprehensionScore] = useState<number | null>(null);
  const [goodExpression, setGoodExpression] = useState("");
  const [improvementFrom, setImprovementFrom] = useState("");
  const [improvementTo, setImprovementTo] = useState("");
  const [encouragementMessage, setEncouragementMessage] = useState("");

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
          learnerCountry: data.learner?.country,
          sessionDate: data.slot?.startTime || new Date().toISOString(),
        });

        // Check if detailed feedback already exists
        const feedbackRes = await fetch(
          `/api/detailed-feedback?reservationId=${reservationId}`
        );
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          if (feedbackData.detailedFeedback) {
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

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((t) => t !== topicId)
        : [...prev, topicId]
    );
  };

  const isFormValid = () => {
    const hasTopics = selectedTopics.length > 0 || otherTopic.trim().length > 0;
    const hasAllScores =
      pronunciationScore !== null &&
      grammarScore !== null &&
      enthusiasmScore !== null &&
      comprehensionScore !== null;
    const hasMessage = encouragementMessage.trim().length >= 50;
    const improvementValid =
      (improvementFrom.trim() === "" && improvementTo.trim() === "") ||
      (improvementFrom.trim() !== "" && improvementTo.trim() !== "");

    return hasTopics && hasAllScores && hasMessage && improvementValid;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setSubmitting(true);
    setError(null);

    const allTopics = [...selectedTopics];
    if (otherTopic.trim()) {
      allTopics.push(otherTopic.trim());
    }

    try {
      const res = await fetch("/api/detailed-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          topics: allTopics,
          pronunciationScore,
          grammarScore,
          enthusiasmScore,
          comprehensionScore,
          goodExpression: goodExpression.trim() || null,
          improvementFrom: improvementFrom.trim() || null,
          improvementTo: improvementTo.trim() || null,
          encouragementMessage: encouragementMessage.trim(),
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

  const renderStars = (score: number) => {
    return "★".repeat(score) + "☆".repeat(5 - score);
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href={isSenior ? "/senior/dashboard" : "/host/dashboard"}
              className="text-2xl font-bold text-amber-600"
            >
              Do Jo
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              フィードバックを送信しました！
            </h1>
            <p className="text-gray-600 mb-2">
              ご協力ありがとうございました。
            </p>
            <p className="text-amber-600 font-medium mb-8">
              あなたの応援メッセージが、学習者の日本就職への
              <br />
              大きな励みになります！
            </p>
            <Link
              href={isSenior ? "/senior/dashboard" : "/host/dashboard"}
              className="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              href={isSenior ? "/senior/dashboard" : "/host/dashboard"}
              className="text-2xl font-bold text-amber-600"
            >
              Do Jo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📝</span>
            <h1 className="text-2xl font-bold text-gray-900">
              フィードバックを送る
            </h1>
          </div>
          {reservation && (
            <div className="text-gray-600 space-y-1">
              <p className="font-medium text-lg">
                学習者: {reservation.learnerName}さん
                {reservation.learnerCountry && (
                  <span className="text-gray-400 text-sm ml-2">
                    ({reservation.learnerCountry})
                  </span>
                )}
              </p>
              <p>日時: {formatDate(reservation.sessionDate)}</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-sm">
              ※ あなたのフィードバックは、学習者の日本就職への大きな励みになります！
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Topics */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">
            ■ 今日話したトピック（複数選択可）
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {TOPIC_OPTIONS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => toggleTopic(topic.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedTopics.includes(topic.id)
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="mr-2">
                  {selectedTopics.includes(topic.id) ? "✓" : "□"}
                </span>
                {topic.label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              その他:
            </label>
            <input
              type="text"
              value={otherTopic}
              onChange={(e) => setOtherTopic(e.target.value)}
              placeholder="その他のトピックがあれば入力"
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Pronunciation Score */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">■ 発音について</h2>
          <div className="space-y-2">
            {SCORE_OPTIONS.pronunciation.map((option) => (
              <button
                key={option.value}
                onClick={() => setPronunciationScore(option.value)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  pronunciationScore === option.value
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg whitespace-nowrap">
                  {renderStars(option.value)}
                </span>
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grammar Score */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">
            ■ 文法・言葉の使い方について
          </h2>
          <div className="space-y-2">
            {SCORE_OPTIONS.grammar.map((option) => (
              <button
                key={option.value}
                onClick={() => setGrammarScore(option.value)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  grammarScore === option.value
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg whitespace-nowrap">
                  {renderStars(option.value)}
                </span>
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Enthusiasm Score */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">
            ■ 会話への積極性について
          </h2>
          <div className="space-y-2">
            {SCORE_OPTIONS.enthusiasm.map((option) => (
              <button
                key={option.value}
                onClick={() => setEnthusiasmScore(option.value)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  enthusiasmScore === option.value
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg whitespace-nowrap">
                  {renderStars(option.value)}
                </span>
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Comprehension Score */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">
            ■ 聞き取り・理解力について
          </h2>
          <div className="space-y-2">
            {SCORE_OPTIONS.comprehension.map((option) => (
              <button
                key={option.value}
                onClick={() => setComprehensionScore(option.value)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                  comprehensionScore === option.value
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg whitespace-nowrap">
                  {renderStars(option.value)}
                </span>
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Good Expression */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-2">
            ■ 良かった表現・印象に残った言葉（任意）
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            例:「よろしくお願いします」の発音が上手でした
          </p>
          <textarea
            value={goodExpression}
            onChange={(e) => setGoodExpression(e.target.value)}
            placeholder="良かった表現があれば書いてください"
            className="w-full p-4 border border-gray-200 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Improvement Suggestion */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-2">
            ■ こう言うともっと自然です（任意）
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            ※両方入力するか、両方空欄にしてください
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                学習者が言った表現:
              </label>
              <input
                type="text"
                value={improvementFrom}
                onChange={(e) => setImprovementFrom(e.target.value)}
                placeholder="例: 私は昨日買い物をしました"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="text-center text-gray-400">↓</div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                こう言うと自然:
              </label>
              <input
                type="text"
                value={improvementTo}
                onChange={(e) => setImprovementTo(e.target.value)}
                placeholder="例: 昨日、買い物に行きました"
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Encouragement Message - Most Important */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl shadow-lg p-6 mb-6 border-2 border-amber-300">
          <h2 className="font-bold text-gray-900 mb-2 text-lg">
            ■ 応援メッセージ（必須）
          </h2>
          <p className="text-amber-800 font-medium mb-3">
            この欄が学習者にとって一番大切です！
            <br />
            日本で働きたいと頑張っている学習者への応援をお願いします。
          </p>

          <div className="bg-white/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700 font-medium mb-2">
              【書くヒント】
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>・今日の会話で嬉しかったこと</li>
              <li>・学習者の良かったところ</li>
              <li>・日本で働く時に役立つアドバイス</li>
            </ul>
          </div>

          <div className="bg-white/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700 font-medium mb-2">
              【例文】※そのまま使ってもOK
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {EXAMPLE_MESSAGES.map((msg, i) => (
                <li
                  key={i}
                  className="cursor-pointer hover:text-amber-700"
                  onClick={() => setEncouragementMessage(msg)}
                >
                  ・「{msg}」
                </li>
              ))}
            </ul>
          </div>

          <textarea
            value={encouragementMessage}
            onChange={(e) => setEncouragementMessage(e.target.value)}
            placeholder="学習者への応援メッセージを書いてください（50文字以上）"
            className="w-full p-4 border-2 border-amber-300 rounded-xl resize-none h-40 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
          <div className="flex justify-between mt-2">
            <p
              className={`text-sm ${
                encouragementMessage.length >= 50
                  ? "text-green-600"
                  : "text-gray-500"
              }`}
            >
              {encouragementMessage.length >= 50
                ? "✓ 50文字以上です"
                : `あと${50 - encouragementMessage.length}文字必要です`}
            </p>
            <p className="text-sm text-gray-500">
              {encouragementMessage.length}文字
            </p>
          </div>
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || submitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isFormValid() && !submitting
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting ? "送信中..." : "送信する"}
            </button>
            {!isFormValid() && (
              <p className="text-center text-sm text-gray-500 mt-2">
                {selectedTopics.length === 0 && otherTopic.trim() === ""
                  ? "トピックを選択してください"
                  : pronunciationScore === null ||
                    grammarScore === null ||
                    enthusiasmScore === null ||
                    comprehensionScore === null
                  ? "すべての評価項目を選択してください"
                  : encouragementMessage.length < 50
                  ? "応援メッセージを50文字以上入力してください"
                  : "入力内容を確認してください"}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
