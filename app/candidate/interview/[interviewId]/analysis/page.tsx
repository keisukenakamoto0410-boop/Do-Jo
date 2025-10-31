"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import ScoreCard from "@/components/analysis/ScoreCard";
import ComparisonChart from "@/components/analysis/ComparisonChart";
import {
  generateSuggestions,
  getEncouragementMessage,
  getNextMilestone,
} from "@/lib/analysis/suggestions";

interface AnalysisData {
  metrics: {
    speechRate: { value: number; unit: string; benchmark: any };
    pauseFrequency: { value: number; unit: string; benchmark: any };
    fillerCount: { value: number; unit: string; benchmark: any };
    totalDuration: { value: number; unit: string };
  };
  overallScore: {
    value: number;
    scale: string;
    scoreOn5Scale: number;
    interpretation: any;
  };
  analyzedAt: string;
  candidate: {
    name: string;
    japaneseLevel: string;
  };
}

interface InterviewInfo {
  id: string;
  scheduledAt: string;
  interviewer: {
    name: string;
  };
  slot: {
    jobCategory: string;
  };
  evaluation: any;
}

export default function CandidateAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const interviewId = params?.interviewId as string;

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [interviewInfo, setInterviewInfo] = useState<InterviewInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session?.user?.userType !== "CANDIDATE"
    ) {
      router.push("/unauthorized");
    } else if (status === "authenticated" && interviewId) {
      fetchAnalysisData();
    }
  }, [status, session, router, interviewId]);

  const fetchAnalysisData = async () => {
    try {
      setIsLoading(true);

      // Fetch both analysis and interview details
      const [analysisRes, detailsRes] = await Promise.all([
        fetch(`/api/analysis/${interviewId}`),
        fetch(`/api/interview/${interviewId}/details`),
      ]);

      if (!analysisRes.ok) {
        throw new Error("分析結果の取得に失敗しました");
      }

      if (!detailsRes.ok) {
        throw new Error("面接情報の取得に失敗しました");
      }

      const analysisData = await analysisRes.json();
      const detailsData = await detailsRes.json();

      if (!analysisData.success || !analysisData.analysis) {
        throw new Error("分析結果がまだ完了していません");
      }

      setAnalysis(analysisData.analysis);
      setInterviewInfo(detailsData.interview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis || !interviewInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">
              {error || "分析結果が見つかりません"}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchAnalysisData}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              再試行
            </button>
            <button
              onClick={() => router.push("/candidate/dashboard")}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const suggestions = generateSuggestions({
    speechRate: analysis.metrics.speechRate.value,
    pauseFrequency: analysis.metrics.pauseFrequency.value,
    fillerCount: analysis.metrics.fillerCount.value,
    totalDuration: analysis.metrics.totalDuration.value,
    overallScore: analysis.overallScore.value,
  });

  const encouragement = getEncouragementMessage(analysis.overallScore.value);
  const nextMilestone = getNextMilestone(analysis.overallScore.value);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/candidate/dashboard")}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
          >
            ← ダッシュボードに戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            流暢性分析結果
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>📅 {formatDate(interviewInfo.scheduledAt)}</span>
            <span>•</span>
            <span>👔 面接官: {interviewInfo.interviewer.name}</span>
            <span>•</span>
            <span>💼 {interviewInfo.slot.jobCategory}</span>
          </div>
        </div>

        {/* Evaluation Status Banner */}
        {!interviewInfo.evaluation ? (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>面接官の評価を待っています</strong>
                  <br />
                  流暢性の自動分析は完了しました。面接官からの詳細な評価をお待ちください。
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>評価完了</strong>
                  <br />
                  面接官からの評価が完了しました。詳細な評価結果をご確認ください。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Score Section */}
        <div className="mb-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-2 opacity-90">
              総合スコア
            </h2>
            <div className="text-7xl font-bold mb-4">
              {analysis.overallScore.value}
            </div>
            <div className="text-2xl mb-2">/ 100</div>
            <div className="inline-block px-6 py-2 bg-white bg-opacity-20 rounded-full text-lg font-medium mb-4">
              {analysis.overallScore.interpretation.label}
            </div>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {encouragement}
            </p>
          </div>

          {/* Next Milestone */}
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div>
                <p className="text-sm opacity-75 mb-1">次の目標</p>
                <p className="text-xl font-bold">{nextMilestone.label}</p>
                <p className="text-sm opacity-75">{nextMilestone.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-75 mb-1">必要スコア</p>
                <p className="text-3xl font-bold">{nextMilestone.target}</p>
              </div>
            </div>
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${(analysis.overallScore.value / nextMilestone.target) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-right mt-1 opacity-75">
                あと{(nextMilestone.target - analysis.overallScore.value).toFixed(0)}ポイント
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            詳細な分析結果
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScoreCard
              title="発話速度"
              icon="🗣️"
              score={analysis.metrics.speechRate.value}
              maxScore={analysis.metrics.speechRate.benchmark.max}
              unit={analysis.metrics.speechRate.unit}
              description="話す速さを測定しています"
              benchmark={analysis.metrics.speechRate.benchmark}
              tips={
                suggestions.find((s) => s.category === "発話速度")?.tips
              }
              colorScheme="blue"
            />

            <ScoreCard
              title="ポーズ頻度"
              icon="⏸️"
              score={analysis.metrics.pauseFrequency.value}
              maxScore={analysis.metrics.pauseFrequency.benchmark.max}
              unit={analysis.metrics.pauseFrequency.unit}
              description="話の間の取り方を分析しています"
              benchmark={analysis.metrics.pauseFrequency.benchmark}
              tips={
                suggestions.find((s) => s.category === "ポーズの使い方")?.tips
              }
              colorScheme="purple"
            />

            <ScoreCard
              title="フィラー使用"
              icon="💬"
              score={analysis.metrics.fillerCount.value}
              maxScore={analysis.metrics.fillerCount.benchmark.max}
              unit={analysis.metrics.fillerCount.unit}
              description="「あの」「えっと」などの使用頻度"
              benchmark={analysis.metrics.fillerCount.benchmark}
              tips={
                suggestions.find((s) => s.category === "フィラーワード")?.tips
              }
              colorScheme="orange"
            />
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="mb-8">
          <ComparisonChart
            userScore={analysis.overallScore.value}
            userLevel={analysis.candidate.japaneseLevel}
          />
        </div>

        {/* Improvement Suggestions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            あなたへのアドバイス
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-500"
              >
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-4xl">{suggestion.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {suggestion.title}
                      </h3>
                      {suggestion.priority === "high" && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                          重要
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {suggestion.description}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    💡 具体的なアドバイス
                  </h4>
                  <ul className="space-y-2">
                    {suggestion.tips.map((tip, tipIndex) => (
                      <li
                        key={tipIndex}
                        className="text-sm text-gray-700 flex items-start"
                      >
                        <span className="text-primary-500 mr-2">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">📊 分析について</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="mb-2">
                <strong>分析日時:</strong>{" "}
                {new Date(analysis.analyzedAt).toLocaleString("ja-JP")}
              </p>
              <p className="mb-2">
                <strong>面接時間:</strong>{" "}
                {formatDuration(analysis.metrics.totalDuration.value)}
              </p>
              <p>
                <strong>日本語レベル:</strong> {analysis.candidate.japaneseLevel}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>ℹ️ 分析方法について</strong>
                <br />
                この分析は、あなたの話し方の客観的な特徴を測定しています。
                スコアは参考値として活用し、継続的な練習で改善を目指しましょう。
                面接官からの詳細な評価も併せてご確認ください。
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => router.push("/candidate/dashboard")}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            ダッシュボードに戻る
          </button>
          {interviewInfo.evaluation && (
            <button
              onClick={() => router.push(`/candidate/evaluation/${interviewId}`)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              面接官の評価を見る
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
