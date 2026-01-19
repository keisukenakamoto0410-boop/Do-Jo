"use client";

import { useState } from "react";

interface SupportHintsProps {
  targetWords: string[];
  learnerName?: string;
}

export default function SupportHints({
  targetWords,
  learnerName,
}: SupportHintsProps) {
  const [expanded, setExpanded] = useState(true);

  if (!targetWords || targetWords.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white px-4 py-3 flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="font-medium">サポート目標</span>
          {!expanded && (
            <span className="text-sky-100 ml-2">
              {targetWords.slice(0, 3).join("、")}
              {targetWords.length > 3 && "..."}
            </span>
          )}
        </div>
        <span className="text-xl">{expanded ? "▼" : "▲"}</span>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="bg-white border-t-2 border-sky-500 p-4 shadow-xl">
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>💡</span>
              今日のサポート目標
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {learnerName ? `${learnerName}さんが` : "学習者が"}
              以下の単語を使いたいと思っています。
              <br />
              会話の中で自然に使えるようサポートしてあげてください。
            </p>

            <div className="bg-sky-50 rounded-lg p-4">
              <p className="text-sm text-sky-700 font-medium mb-2">
                📌 この単語を会話に入れてあげてください：
              </p>
              <div className="flex flex-wrap gap-2">
                {targetWords.map((word, index) => (
                  <span
                    key={index}
                    className="bg-white px-3 py-1 rounded-full text-sky-700 font-medium border border-sky-200 shadow-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              ※ 学習者がこれらの単語を使ったら、褒めてあげてください！
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
