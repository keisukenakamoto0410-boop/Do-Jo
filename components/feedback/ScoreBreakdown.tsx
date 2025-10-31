"use client";

import { useState } from "react";

interface ScoreCategory {
  name: string;
  icon: string;
  score: number;
  maxScore: number;
  subcategories?: {
    name: string;
    score: number;
    maxScore: number;
  }[];
  comment?: string;
}

interface ScoreBreakdownProps {
  scores: ScoreCategory[];
}

export default function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // Calculate overall average
  const calculateOverallAverage = () => {
    const totalScore = scores.reduce((sum, cat) => sum + cat.score, 0);
    const totalMax = scores.reduce((sum, cat) => sum + cat.maxScore, 0);
    return (totalScore / totalMax) * 100;
  };

  // Get star rating (0-5)
  const getStarRating = (score: number, maxScore: number) => {
    return (score / maxScore) * 5;
  };

  // Render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400 text-2xl">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400 text-2xl relative">
            <span className="absolute inset-0">☆</span>
            <span className="absolute inset-0 overflow-hidden w-1/2">★</span>
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300 text-2xl">
            ☆
          </span>
        );
      }
    }
    return stars;
  };

  // Get color based on score percentage
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-orange-600";
  };

  const overallAverage = calculateOverallAverage();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          評価詳細
        </h2>
        <p className="text-gray-600">
          各カテゴリの評価とフィードバックを確認できます
        </p>
      </div>

      {/* Overall Score */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">総合評価</p>
            <div className="flex items-center space-x-2">
              {renderStars(overallAverage / 20)}
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-blue-600">
              {overallAverage.toFixed(1)}
              <span className="text-xl text-gray-500">%</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {scores.reduce((sum, cat) => sum + cat.score, 0)} /{" "}
              {scores.reduce((sum, cat) => sum + cat.maxScore, 0)} 点
            </p>
          </div>
        </div>
      </div>

      {/* Score Categories */}
      <div className="space-y-4">
        {scores.map((category, index) => {
          const isExpanded = expandedCategory === index;
          const percentage = (category.score / category.maxScore) * 100;
          const rating = getStarRating(category.score, category.maxScore);

          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-all"
            >
              {/* Category Header */}
              <button
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : index)
                }
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <span className="text-3xl">{category.icon}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-900">
                      {category.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {renderStars(rating)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${getScoreColor(
                        category.score,
                        category.maxScore
                      )}`}
                    >
                      {category.score}
                      <span className="text-sm text-gray-500">
                        /{category.maxScore}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {percentage.toFixed(0)}%
                    </p>
                  </div>
                  <span
                    className={`transform transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-6 py-4 bg-white border-t border-gray-200">
                  {/* Subcategories */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        詳細スコア
                      </h4>
                      <div className="space-y-3">
                        {category.subcategories.map((sub, subIndex) => {
                          const subPercentage = (sub.score / sub.maxScore) * 100;
                          return (
                            <div key={subIndex} className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 mb-1">
                                  {sub.name}
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      subPercentage >= 80
                                        ? "bg-green-500"
                                        : subPercentage >= 60
                                        ? "bg-blue-500"
                                        : subPercentage >= 40
                                        ? "bg-yellow-500"
                                        : "bg-orange-500"
                                    }`}
                                    style={{ width: `${subPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-sm font-bold text-gray-900">
                                  {sub.score}/{sub.maxScore}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Comment */}
                  {category.comment && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                        <span className="mr-2">💬</span>
                        フィードバック
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {category.comment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">評価基準</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">優秀 (80%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">良好 (60-79%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">普通 (40-59%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">要改善 (40%未満)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
