"use client";

import { generateSuggestions, getNextMilestone } from "@/lib/analysis/suggestions";

interface ImprovementPlanProps {
  overallScore: number;
  speechRate: number;
  pauseFrequency: number;
  fillerCount: number;
  totalDuration: number;
  weakCategories?: {
    name: string;
    score: number;
    maxScore: number;
  }[];
}

export default function ImprovementPlan({
  overallScore,
  speechRate,
  pauseFrequency,
  fillerCount,
  totalDuration,
  weakCategories = [],
}: ImprovementPlanProps) {
  // Generate AI suggestions based on fluency analysis
  const suggestions = generateSuggestions({
    speechRate,
    pauseFrequency,
    fillerCount,
    totalDuration,
    overallScore,
  });

  // Get next milestone
  const nextMilestone = getNextMilestone(overallScore);

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "優先度: 高";
      case "medium":
        return "優先度: 中";
      case "low":
        return "優先度: 低";
      default:
        return "";
    }
  };

  // Calculate progress to next milestone
  const progressToMilestone = (overallScore / nextMilestone.target) * 100;

  return (
    <div className="space-y-6">
      {/* Next Milestone */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-purple-600 mb-1">
              次の目標
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              {nextMilestone.label}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {nextMilestone.description}
            </p>
          </div>
          <div className="text-5xl">🎯</div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">現在のスコア</span>
            <span className="font-bold text-purple-600">
              {overallScore} / {nextMilestone.target}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(progressToMilestone, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            あと {Math.max(0, nextMilestone.target - overallScore).toFixed(0)}{" "}
            ポイント！
          </p>
        </div>
      </div>

      {/* Weak Areas (if any) */}
      {weakCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">💪</span>
            <h3 className="text-xl font-bold text-gray-900">
              重点改善エリア
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            以下のエリアに注力することで、大きな改善が期待できます
          </p>
          <div className="space-y-3">
            {weakCategories.map((category, index) => {
              const percentage = (category.score / category.maxScore) * 100;
              return (
                <div
                  key={index}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">
                      {category.name}
                    </p>
                    <p className="text-sm text-orange-600 font-bold">
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI-Generated Suggestions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🤖</span>
          <h3 className="text-xl font-bold text-gray-900">
            AIによる改善アドバイス
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          あなたのパフォーマンスを分析し、効果的な改善方法を提案します
        </p>

        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-all"
            >
              {/* Suggestion Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{suggestion.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {suggestion.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm px-3 py-1 bg-white rounded-full border border-gray-300 flex items-center space-x-1">
                    <span>{getPriorityIcon(suggestion.priority)}</span>
                    <span className="text-xs font-medium">
                      {getPriorityLabel(suggestion.priority)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Suggestion Content */}
              <div className="p-4">
                <p className="text-sm text-gray-700 mb-4">
                  {suggestion.description}
                </p>

                {/* Tips */}
                {suggestion.tips && suggestion.tips.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h5 className="text-xs font-semibold text-blue-900 mb-2 flex items-center">
                      <span className="mr-1">💡</span>
                      実践的なヒント
                    </h5>
                    <ul className="space-y-2">
                      {suggestion.tips.map((tip, tipIndex) => (
                        <li
                          key={tipIndex}
                          className="text-sm text-gray-700 flex items-start"
                        >
                          <span className="mr-2 text-blue-500 font-bold">
                            •
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Steps */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">✅</span>
          <h3 className="text-xl font-bold text-gray-900">次のステップ</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                フィードバックを復習する
              </p>
              <p className="text-sm text-gray-600">
                面接官のコメントと改善点を確認しましょう
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                動画を見直す
              </p>
              <p className="text-sm text-gray-600">
                自分のパフォーマンスを客観的に確認しましょう
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                重点エリアを練習する
              </p>
              <p className="text-sm text-gray-600">
                提案された改善方法を1週間実践しましょう
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                次の面接を予約する
              </p>
              <p className="text-sm text-gray-600">
                練習の成果を確認し、さらなる改善を目指しましょう
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
