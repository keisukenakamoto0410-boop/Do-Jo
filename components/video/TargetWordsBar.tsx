"use client";

import { useState } from "react";

interface TargetWordsBarProps {
  targetWords: string[];
  conversationGoal?: string | null;
  language?: "en" | "ja";
}

export default function TargetWordsBar({
  targetWords,
  conversationGoal,
  language = "en",
}: TargetWordsBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [wordsUsed, setWordsUsed] = useState<string[]>([]);

  if (!targetWords || targetWords.length === 0) return null;

  const toggleWordUsed = (word: string) => {
    setWordsUsed((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  const usedCount = wordsUsed.length;
  const totalCount = targetWords.length;
  const allCompleted = usedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {/* Expanded Panel */}
      {expanded && (
        <div className="mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 w-72 max-h-80 overflow-hidden">
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
          <div className="p-3 max-h-52 overflow-y-auto">
            <div className="space-y-2">
              {targetWords.map((word, index) => (
                <div
                  key={index}
                  onClick={() => toggleWordUsed(word)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    wordsUsed.includes(word)
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 hover:bg-orange-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        wordsUsed.includes(word)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {wordsUsed.includes(word) && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                    <span
                      className={`font-medium ${
                        wordsUsed.includes(word)
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {word}
                    </span>
                  </div>
                  {wordsUsed.includes(word) && (
                    <span className="text-green-500 text-xs font-medium">
                      {language === "en" ? "Used!" : "使った!"}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {conversationGoal && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 flex items-start gap-2">
                  <span>📎</span>
                  <span>
                    <span className="font-medium">
                      {language === "en" ? "Goal: " : "目標: "}
                    </span>
                    {conversationGoal}
                  </span>
                </p>
              </div>
            )}

            {allCompleted && (
              <div className="mt-3 p-2 bg-green-50 rounded-lg text-center">
                <span className="text-green-600 font-bold text-sm">
                  {language === "en"
                    ? "🎉 All words used!"
                    : "🎉 全部使いました！"}
                </span>
              </div>
            )}
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
