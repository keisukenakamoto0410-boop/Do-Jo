"use client";

import { useState, useMemo } from "react";
import { getWordsInfo } from "@/lib/wordDictionary";
import { AGENDA_TEMPLATES } from "@/lib/agenda-templates";

interface SupportHintsProps {
  targetWords?: string[];
  selectedTopic?: string;
  conversationGoal?: string;
  learnerName?: string;
}

// トピックの翻訳マッピング（日本人ホスト向けなので日本語のみ）
const TOPIC_TRANSLATIONS: Record<string, string> = {
  daily_conversation: "日常会話",
  japanese_food: "日本の食文化",
  travel: "日本旅行",
  seasons: "日本の四季",
  family_life: "家族と日常",
  hobbies: "趣味・娯楽",
  shopping: "買い物",
  history: "日本の歴史",
  work: "仕事・ビジネス",
  health: "健康",
};

// 会話目標の翻訳マッピング（日本人ホスト向けなので日本語のみ）
const GOAL_TRANSLATIONS: Record<string, string> = {
  practice_grammar: "新しい文法を練習したい",
  improve_listening: "リスニングを向上させたい",
  natural_expressions: "自然な表現を学びたい",
  build_confidence: "会話に自信をつけたい",
  just_enjoy: "会話を楽しみたい",
};

export default function SupportHints({
  targetWords,
  selectedTopic,
  conversationGoal,
  learnerName,
}: SupportHintsProps) {
  const [expanded, setExpanded] = useState(true);

  // 単語情報を取得（読み仮名と英語の意味付き）
  const wordsWithInfo = useMemo(() => {
    if (!targetWords || targetWords.length === 0) return [];
    return getWordsInfo(targetWords);
  }, [targetWords]);

  // トピックに応じた便利フレーズを取得
  const keyPhrases = useMemo(() => {
    if (!selectedTopic) return [];
    const template = AGENDA_TEMPLATES[selectedTopic];
    return template?.keyPhrases || [];
  }, [selectedTopic]);

  // 何も情報がなければ表示しない
  const hasTargetWords = targetWords && targetWords.length > 0;
  const hasTopic = selectedTopic && selectedTopic.trim() !== "";
  const hasGoal = conversationGoal && conversationGoal.trim() !== "";
  const hasKeyPhrases = keyPhrases.length > 0;

  if (!hasTargetWords && !hasTopic && !hasGoal && !hasKeyPhrases) return null;

  // トピックを翻訳
  const getTopicText = (topic: string) => {
    return TOPIC_TRANSLATIONS[topic] || topic;
  };

  // 目標を翻訳
  const getGoalText = (goal: string) => {
    return GOAL_TRANSLATIONS[goal] || goal;
  };

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
            <span className="text-sky-100 ml-2 text-sm">
              {TOPIC_TRANSLATIONS[selectedTopic] || selectedTopic}
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
                  {getTopicText(selectedTopic)}
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
                  {getGoalText(conversationGoal)}
                </p>
              </div>
            )}

            {/* ミッション単語 */}
            {hasTargetWords && (
              <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                <p className="text-sm text-sky-700 font-medium mb-3">
                  📌 学習者が使いたい単語
                </p>
                <div className="flex flex-wrap gap-2">
                  {wordsWithInfo.map((wordInfo, index) => (
                    <div
                      key={index}
                      className="bg-white px-4 py-2 rounded-full border-2 border-sky-300 shadow-sm"
                    >
                      <span className="text-lg font-bold text-sky-800">
                        {wordInfo.word}
                      </span>
                      {/* 読み仮名（漢字と異なる場合のみ表示） */}
                      {wordInfo.reading !== wordInfo.word && (
                        <span className="text-orange-600 text-sm ml-1">
                          ({wordInfo.reading})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-sky-600 mt-3 bg-yellow-50 p-2 rounded border border-yellow-200">
                  ※ 会話の中でこれらの単語を使えるよう導いてあげてください。
                  <br />
                  学習者が使えたら、たくさん褒めてあげましょう！ 😊
                </p>
              </div>
            )}

            {/* トピック別の便利フレーズ */}
            {hasKeyPhrases && (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-700 font-medium mb-3">
                  💬 このトピックで使える便利フレーズ
                </p>
                <div className="space-y-2">
                  {keyPhrases.map((phrase: string, index: number) => (
                    <div
                      key={index}
                      className="bg-white px-4 py-2 rounded-lg border border-orange-200 shadow-sm"
                    >
                      <span className="text-gray-800 font-medium">
                        {phrase}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-orange-600 mt-3 bg-white p-2 rounded border border-orange-200">
                  💡 会話の中でこれらのフレーズを使って話しかけてみましょう
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
