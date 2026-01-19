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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* Collapsed Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="font-medium">
            {language === "en" ? "Today's Goals:" : "今日の目標:"}
          </span>
          <span className="text-orange-100">
            {targetWords.slice(0, 3).join(" / ")}
            {targetWords.length > 3 && "..."}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-white/20 px-2 py-1 rounded text-sm">
            {usedCount}/{totalCount}
          </span>
          <span className="text-xl">{expanded ? "▼" : "▲"}</span>
        </div>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="bg-white border-t-2 border-orange-500 p-4 shadow-xl max-h-64 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>🎯</span>
            {language === "en" ? "Today's Target Words" : "今日のターゲット単語"}
          </h3>

          <div className="space-y-2 mb-4">
            {targetWords.map((word, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={wordsUsed.includes(word)}
                    onChange={() => toggleWordUsed(word)}
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                  />
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
                  <span className="text-green-500 text-sm font-medium">
                    {language === "en" ? "Used!" : "使った!"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {conversationGoal && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span>📎</span>
                <span className="font-medium">
                  {language === "en" ? "Goal:" : "目標:"}
                </span>
                <span>{conversationGoal}</span>
              </p>
            </div>
          )}

          {usedCount === totalCount && totalCount > 0 && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg text-center">
              <span className="text-green-600 font-bold">
                {language === "en"
                  ? "🎉 Great job! You used all your target words!"
                  : "🎉 すごい！全部の単語を使いました！"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
