"use client";

import { useState, useMemo } from "react";
import { getWordsInfo } from "@/lib/wordDictionary";

interface TargetWordsBarProps {
  targetWords: string[];
  conversationGoal?: string | null;
  language?: "en" | "ja";
}

// 会話目標の英語→日本語マッピング
const GOAL_TRANSLATIONS: Record<string, { ja: string; en: string }> = {
  practice_grammar: { ja: "新しい文法を練習する", en: "Practice new grammar patterns" },
  improve_listening: { ja: "リスニングを向上させる", en: "Improve listening skills" },
  natural_expressions: { ja: "自然な表現を学ぶ", en: "Learn natural expressions" },
  build_confidence: { ja: "会話に自信をつける", en: "Build speaking confidence" },
  just_enjoy: { ja: "会話を楽しむ", en: "Just enjoy the conversation" },
};

export default function TargetWordsBar({
  targetWords,
  conversationGoal,
  language = "en",
}: TargetWordsBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [wordsUsed, setWordsUsed] = useState<string[]>([]);

  // 単語情報を取得（読み仮名と英語の意味付き）
  const wordsWithInfo = useMemo(() => {
    if (!targetWords || targetWords.length === 0) return [];
    return getWordsInfo(targetWords);
  }, [targetWords]);

  if (!targetWords || targetWords.length === 0) return null;

  const toggleWordUsed = (word: string) => {
    setWordsUsed((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  const usedCount = wordsUsed.length;
  const totalCount = targetWords.length;
  const allCompleted = usedCount === totalCount && totalCount > 0;

  // 目標を翻訳
  const getGoalText = (goal: string) => {
    const translation = GOAL_TRANSLATIONS[goal];
    if (translation) {
      return language === "en"
        ? `${translation.ja} (${translation.en})`
        : translation.ja;
    }
    return goal;
  };

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {/* Expanded Panel */}
      {expanded && (
        <div className="mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-[70vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <span>🎯</span>
                {language === "en" ? "Target Words" : "ターゲット単語"}
              </h3>
              <span className="bg-white/20 px-2 py-1 rounded text-sm">
                {usedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Word List */}
          <div className="p-3 max-h-[50vh] overflow-y-auto">
            <div className="space-y-2">
              {wordsWithInfo.map((wordInfo, index) => (
                <div
                  key={index}
                  onClick={() => toggleWordUsed(wordInfo.word)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    wordsUsed.includes(wordInfo.word)
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 hover:bg-orange-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-1 ${
                        wordsUsed.includes(wordInfo.word)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {wordsUsed.includes(wordInfo.word) && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                    <div className="flex-1">
                      {/* 日本語（漢字） */}
                      <div
                        className={`text-lg font-bold ${
                          wordsUsed.includes(wordInfo.word)
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {wordInfo.word}
                      </div>
                      {/* 読み仮名（漢字と異なる場合のみ表示） */}
                      {wordInfo.reading !== wordInfo.word && (
                        <div className="text-sm text-orange-600">
                          ({wordInfo.reading})
                        </div>
                      )}
                      {/* 英語の意味 */}
                      {wordInfo.meaning && (
                        <div className="text-sm text-gray-500 mt-1">
                          📖 {wordInfo.meaning}
                        </div>
                      )}
                    </div>
                    {wordsUsed.includes(wordInfo.word) && (
                      <span className="text-green-500 text-xs font-medium flex-shrink-0">
                        {language === "en" ? "Used!" : "使った!"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {conversationGoal && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium mb-1">
                    🎯 {language === "en" ? "Conversation Goal" : "会話の目標"}
                  </p>
                  <p className="text-blue-900 text-sm">
                    {getGoalText(conversationGoal)}
                  </p>
                </div>
              </div>
            )}

            {allCompleted && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-center">
                <span className="text-green-600 font-bold">
                  {language === "en"
                    ? "🎉 Great job! All words used!"
                    : "🎉 素晴らしい！全部使いました！"}
                </span>
              </div>
            )}

            {/* ヒント */}
            <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700">
                {language === "en"
                  ? "💡 Tap a word when you use it in conversation!"
                  : "💡 単語を使ったらタップしてチェックしましょう！"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          allCompleted
            ? "bg-green-500 hover:bg-green-600"
            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        }`}
      >
        <span className="text-2xl">{allCompleted ? "✅" : "🎯"}</span>
        {/* Progress indicator */}
        {!allCompleted && usedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-orange-500 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-orange-500">
            {usedCount}
          </span>
        )}
      </button>
    </div>
  );
}
