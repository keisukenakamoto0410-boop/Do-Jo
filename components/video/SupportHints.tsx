"use client";

import { useState } from "react";

interface SupportHintsProps {
  targetWords?: string[];
  selectedTopic?: string;
  conversationGoal?: string;
  learnerName?: string;
}

export default function SupportHints({
  targetWords,
  selectedTopic,
  conversationGoal,
  learnerName,
}: SupportHintsProps) {
  const [expanded, setExpanded] = useState(true);

  // 何も情報がなければ表示しない
  const hasTargetWords = targetWords && targetWords.length > 0;
  const hasTopic = selectedTopic && selectedTopic.trim() !== "";
  const hasGoal = conversationGoal && conversationGoal.trim() !== "";

  if (!hasTargetWords && !hasTopic && !hasGoal) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white px-4 py-3 flex items-center justify-between shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="font-medium">今日の会話サポート</span>
          {!expanded && hasTopic && (
            <span className="text-sky-100 ml-2">
              トピック: {selectedTopic}
            </span>
          )}
        </div>
        <span className="text-xl">{expanded ? "▼" : "▲"}</span>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="bg-white border-t-2 border-sky-500 p-4 shadow-xl max-h-[50vh] overflow-y-auto">
          <div className="max-w-lg mx-auto space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span>💡</span>
              {learnerName ? `${learnerName}さんの` : ""}今日の会話サポート
            </h3>

            {/* トピック */}
            {hasTopic && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-700 font-medium mb-1">
                  🎯 話したいトピック
                </p>
                <p className="text-purple-900 font-bold text-lg">
                  {selectedTopic}
                </p>
              </div>
            )}

            {/* 会話目標 */}
            {hasGoal && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">
                  🎯 会話の目標
                </p>
                <p className="text-green-900">
                  {conversationGoal}
                </p>
              </div>
            )}

            {/* ミッション単語 */}
            {hasTargetWords && (
              <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                <p className="text-sm text-sky-700 font-medium mb-2">
                  📌 使いたい単語（ミッション）
                </p>
                <div className="flex flex-wrap gap-2">
                  {targetWords.map((word, index) => (
                    <span
                      key={index}
                      className="bg-white px-3 py-1.5 rounded-full text-sky-700 font-bold border-2 border-sky-300 shadow-sm"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-sky-600 mt-2">
                  ※ 会話の中でこれらの単語を使えるよう導いてあげてください
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
              学習者が目標を達成したら、たくさん褒めてあげてください！ 😊
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
