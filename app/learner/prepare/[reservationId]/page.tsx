"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

// トピック選択肢
const TOPICS = [
  { id: "daily_conversation", name: "Daily Conversation", nameJa: "日常会話" },
  { id: "japanese_food", name: "Japanese Food Culture", nameJa: "日本の食文化" },
  { id: "travel", name: "Travel in Japan", nameJa: "日本旅行" },
  { id: "seasons", name: "Japanese Seasons", nameJa: "日本の四季" },
  { id: "family_life", name: "Family & Daily Life", nameJa: "家族と日常" },
  { id: "hobbies", name: "Hobbies & Entertainment", nameJa: "趣味・娯楽" },
  { id: "shopping", name: "Shopping", nameJa: "買い物" },
  { id: "history", name: "Japanese History", nameJa: "日本の歴史" },
  { id: "work", name: "Work & Business", nameJa: "仕事・ビジネス" },
  { id: "health", name: "Health & Wellness", nameJa: "健康" },
];

// 教科書選択肢
const TEXTBOOKS = [
  { id: "minna_no_nihongo", name: "Minna no Nihongo (みんなの日本語)" },
  { id: "genki", name: "Genki (げんき)" },
  { id: "marugoto", name: "Marugoto (まるごと)" },
  { id: "dekiru_nihongo", name: "Dekiru Nihongo (できる日本語)" },
  { id: "tobira", name: "Tobira (とびら)" },
  { id: "other", name: "Other / Self-study" },
];

// 文法ポイント（教科書・課に応じて動的に変更可能）
const GRAMMAR_POINTS: Record<
  string,
  { id: string; pattern: string; meaning: string }[]
> = {
  minna_12: [
    { id: "te_mo_ii_desu_ka", pattern: "〜てもいいですか", meaning: "May I...?" },
    { id: "te_wa_ikemasen", pattern: "〜てはいけません", meaning: "Must not..." },
  ],
  minna_13: [
    { id: "tai_desu", pattern: "〜たいです", meaning: "I want to..." },
    { id: "mashou", pattern: "〜ましょう", meaning: "Let's..." },
    { id: "ni_ikimasu", pattern: "〜に行きます", meaning: "Go to do..." },
  ],
  minna_14: [
    { id: "te_kudasai", pattern: "〜てください", meaning: "Please do..." },
    { id: "te_imasu", pattern: "〜ています", meaning: "Is doing... / State" },
  ],
  minna_15: [
    { id: "te_mo_ii", pattern: "〜てもいいです", meaning: "It's okay to..." },
    {
      id: "te_wa_dame",
      pattern: "〜てはだめです",
      meaning: "You shouldn't...",
    },
  ],
  genki_7: [
    { id: "te_form", pattern: "〜て", meaning: "Te-form basics" },
    { id: "te_kudasai", pattern: "〜てください", meaning: "Please do..." },
  ],
  genki_8: [
    { id: "short_form", pattern: "Short form", meaning: "Casual speech" },
    {
      id: "to_omoimasu",
      pattern: "〜と思います",
      meaning: "I think that...",
    },
  ],
  default: [
    { id: "basic_desu", pattern: "〜です/ます", meaning: "Polite form" },
    { id: "basic_question", pattern: "〜ですか", meaning: "Question form" },
    { id: "wa_ga", pattern: "〜は/〜が", meaning: "Topic/Subject markers" },
  ],
};

// 進捗選択肢
const PROGRESS_OPTIONS = [
  {
    id: "new_lesson",
    label: "Yes, I moved to a new lesson",
    labelJa: "新しい課に進んだ",
  },
  {
    id: "same_lesson_new_grammar",
    label: "Same lesson, but learned new grammar",
    labelJa: "同じ課だが新しい文法を学んだ",
  },
  {
    id: "same",
    label: "Still studying the same content",
    labelJa: "まだ同じ内容を勉強中",
  },
  {
    id: "review",
    label: "I want to review previous content",
    labelJa: "前回の内容を復習したい",
  },
];

// 会話目標選択肢
const GOAL_OPTIONS = [
  { id: "practice_grammar", label: "Practice new grammar patterns" },
  { id: "improve_listening", label: "Improve listening skills" },
  { id: "natural_expressions", label: "Learn natural expressions" },
  { id: "build_confidence", label: "Build speaking confidence" },
  { id: "just_enjoy", label: "Just enjoy the conversation" },
];

export default function PreparationPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.reservationId as string;
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFirstSession, setIsFirstSession] = useState(true);
  const [previousTopic, setPreviousTopic] = useState<string | null>(null);

  // フォームステート
  const [progress, setProgress] = useState("");
  const [textbook, setTextbook] = useState("");
  const [currentLesson, setCurrentLesson] = useState("");
  const [selectedGrammar, setSelectedGrammar] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [conversationGoal, setConversationGoal] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // 前回の会話履歴を取得
  useEffect(() => {
    const fetchPreviousSession = async () => {
      try {
        const res = await fetch(`/api/learner/previous-session`);
        if (res.ok) {
          const data = await res.json();
          if (data.previousSession) {
            setIsFirstSession(false);
            setPreviousTopic(data.previousSession.topic);
            setTextbook(data.previousSession.textbook || "");
            setCurrentLesson(
              data.previousSession.currentLesson?.toString() || ""
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch previous session:", err);
      }
    };
    fetchPreviousSession();
  }, []);

  // 教科書と課に基づいて文法ポイントを取得
  const getGrammarPoints = () => {
    const key = `${textbook}_${currentLesson}`;
    return GRAMMAR_POINTS[key] || GRAMMAR_POINTS["default"];
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. 準備データを保存
      const prepareRes = await fetch(
        `/api/reservations/${reservationId}/prepare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progressSinceLastSession: progress,
            textbook,
            currentLesson: parseInt(currentLesson) || null,
            grammarToStudy: selectedGrammar,
            selectedTopic,
            conversationGoal,
            additionalNotes,
          }),
        }
      );

      if (!prepareRes.ok) {
        throw new Error("Failed to save preparation");
      }

      // 2. アジェンダ生成
      const agendaRes = await fetch(
        `/api/reservations/${reservationId}/generate-agenda`,
        {
          method: "POST",
        }
      );

      if (!agendaRes.ok) {
        throw new Error("Failed to generate agenda");
      }

      // 3. アジェンダ確認ページへ遷移
      router.push(`/learner/prepare/${reservationId}/agenda`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Prepare for Your Conversation
        </h1>
        <p className="text-gray-600 mb-8">
          Answer a few questions so we can create the perfect conversation
          agenda for you.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 前回からの進捗（2回目以降のみ表示） */}
          {!isFirstSession && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Progress Since Last Session
              </h2>
              {previousTopic && (
                <p className="text-sm text-gray-500 mb-4">
                  Last time you talked about:{" "}
                  <span className="font-medium">{previousTopic}</span>
                </p>
              )}
              <div className="space-y-3">
                {PROGRESS_OPTIONS.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="progress"
                      value={option.id}
                      checked={progress === option.id}
                      onChange={(e) => setProgress(e.target.value)}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 教科書と課 */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What are you studying?
            </h2>

            <div className="space-y-4">
              {/* 教科書選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Textbook
                </label>
                <select
                  value={textbook}
                  onChange={(e) => setTextbook(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select your textbook...</option>
                  {TEXTBOOKS.map((tb) => (
                    <option key={tb.id} value={tb.id}>
                      {tb.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 課の選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Lesson
                </label>
                <select
                  value={currentLesson}
                  onChange={(e) => setCurrentLesson(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select lesson number...</option>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      Lesson {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 文法選択 */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Grammar you want to practice
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Select the grammar patterns you learned recently
            </p>
            <div className="space-y-3">
              {getGrammarPoints().map((grammar) => (
                <label
                  key={grammar.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={grammar.id}
                    checked={selectedGrammar.includes(grammar.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGrammar([...selectedGrammar, grammar.id]);
                      } else {
                        setSelectedGrammar(
                          selectedGrammar.filter((g) => g !== grammar.id)
                        );
                      }
                    }}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      {grammar.pattern}
                    </span>
                    <span className="text-gray-500 ml-2">
                      ({grammar.meaning})
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* トピック選択 */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What do you want to talk about?
            </h2>
            {previousTopic && (
              <p className="text-sm text-amber-600 mb-4">
                Tip: Try a different topic from last time for variety!
              </p>
            )}
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Select a topic...</option>
              {TOPICS.map((topic) => (
                <option
                  key={topic.id}
                  value={topic.id}
                  disabled={topic.id === previousTopic}
                >
                  {topic.name} ({topic.nameJa})
                  {topic.id === previousTopic ? " - talked last time" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 会話の目標 */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your goal for this conversation
            </h2>
            <div className="space-y-3">
              {GOAL_OPTIONS.map((goal) => (
                <label
                  key={goal.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="goal"
                    value={goal.id}
                    checked={conversationGoal === goal.id}
                    onChange={(e) => setConversationGoal(e.target.value)}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span className="text-gray-700">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 補足メモ */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Anything else? (Optional)
            </h2>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="E.g., specific questions you want to ask, words you want to learn..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isLoading || !selectedTopic}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating your agenda...
              </span>
            ) : (
              "Generate Conversation Agenda"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
