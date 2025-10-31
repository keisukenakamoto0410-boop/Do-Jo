"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EncouragementCard from "@/components/feedback/EncouragementCard";
import ScoreBreakdown from "@/components/feedback/ScoreBreakdown";
import ImprovementPlan from "@/components/feedback/ImprovementPlan";
import { FluencyResults } from "@/components/analysis/FluencyResults";

interface FeedbackData {
  interview: {
    id: string;
    scheduledAt: string;
    conductedAt: string;
    videoUrl: string;
    status: string;
  };
  evaluation: {
    scores: any;
    comments: string;
    advice: string;
    encouragementMessage: string;
    submittedAt: string;
    interviewer: {
      id: string;
      name: string;
      email: string;
    };
  };
  fluencyAnalysis: {
    speechRate: number;
    pauseFrequency: number;
    fillerCount: number;
    totalDuration: number;
    overallScore: number;
    analyzedAt: string;
  } | null;
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.interviewId as string;

  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    if (interviewId) {
      fetchFeedback();
    }
  }, [interviewId]);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/interview/${interviewId}/details`);

      if (!response.ok) {
        throw new Error("フィードバックの取得に失敗しました");
      }

      const data = await response.json();

      // Check if evaluation exists
      if (!data.evaluation) {
        throw new Error("まだフィードバックが提供されていません");
      }

      setFeedback(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const response = await fetch(`/api/feedback/${interviewId}/pdf`);

      if (!response.ok) {
        throw new Error("PDFの生成に失敗しました");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-feedback-${interviewId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDFのダウンロードに失敗しました");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleViewVideo = () => {
    if (feedback?.interview.videoUrl) {
      window.open(feedback.interview.videoUrl, "_blank");
    }
  };

  // Parse evaluation scores
  const parseScores = () => {
    if (!feedback?.evaluation.scores) return [];

    const scoresData = feedback.evaluation.scores;

    // Expected structure: 5 main categories with subcategories
    const categories = [
      {
        name: "日本語能力",
        icon: "🗣️",
        score: scoresData.japanese?.total || 0,
        maxScore: 20,
        subcategories: [
          {
            name: "語彙・表現",
            score: scoresData.japanese?.vocabulary || 0,
            maxScore: 5,
          },
          {
            name: "文法・正確性",
            score: scoresData.japanese?.grammar || 0,
            maxScore: 5,
          },
          {
            name: "発音・イントネーション",
            score: scoresData.japanese?.pronunciation || 0,
            maxScore: 5,
          },
          {
            name: "流暢性",
            score: scoresData.japanese?.fluency || 0,
            maxScore: 5,
          },
        ],
        comment: scoresData.japanese?.comment || "",
      },
      {
        name: "コミュニケーション能力",
        icon: "💬",
        score: scoresData.communication?.total || 0,
        maxScore: 20,
        subcategories: [
          {
            name: "聞く力",
            score: scoresData.communication?.listening || 0,
            maxScore: 5,
          },
          {
            name: "話す力",
            score: scoresData.communication?.speaking || 0,
            maxScore: 5,
          },
          {
            name: "論理性",
            score: scoresData.communication?.logic || 0,
            maxScore: 5,
          },
          {
            name: "説得力",
            score: scoresData.communication?.persuasion || 0,
            maxScore: 5,
          },
        ],
        comment: scoresData.communication?.comment || "",
      },
      {
        name: "面接マナー",
        icon: "🎩",
        score: scoresData.manner?.total || 0,
        maxScore: 20,
        subcategories: [
          {
            name: "挨拶・礼儀",
            score: scoresData.manner?.greeting || 0,
            maxScore: 5,
          },
          {
            name: "姿勢・態度",
            score: scoresData.manner?.posture || 0,
            maxScore: 5,
          },
          {
            name: "アイコンタクト",
            score: scoresData.manner?.eyeContact || 0,
            maxScore: 5,
          },
          {
            name: "表情",
            score: scoresData.manner?.expression || 0,
            maxScore: 5,
          },
        ],
        comment: scoresData.manner?.comment || "",
      },
      {
        name: "質問への回答",
        icon: "❓",
        score: scoresData.answers?.total || 0,
        maxScore: 20,
        subcategories: [
          {
            name: "理解度",
            score: scoresData.answers?.understanding || 0,
            maxScore: 5,
          },
          {
            name: "適切性",
            score: scoresData.answers?.relevance || 0,
            maxScore: 5,
          },
          {
            name: "具体性",
            score: scoresData.answers?.specificity || 0,
            maxScore: 5,
          },
          {
            name: "深さ",
            score: scoresData.answers?.depth || 0,
            maxScore: 5,
          },
        ],
        comment: scoresData.answers?.comment || "",
      },
      {
        name: "全体印象",
        icon: "⭐",
        score: scoresData.overall?.total || 0,
        maxScore: 20,
        subcategories: [
          {
            name: "熱意・意欲",
            score: scoresData.overall?.enthusiasm || 0,
            maxScore: 5,
          },
          {
            name: "自信",
            score: scoresData.overall?.confidence || 0,
            maxScore: 5,
          },
          {
            name: "誠実さ",
            score: scoresData.overall?.sincerity || 0,
            maxScore: 5,
          },
          {
            name: "ポテンシャル",
            score: scoresData.overall?.potential || 0,
            maxScore: 5,
          },
        ],
        comment: scoresData.overall?.comment || "",
      },
    ];

    return categories;
  };

  // Get weak categories (below 60%)
  const getWeakCategories = () => {
    const scores = parseScores();
    return scores
      .filter((cat) => (cat.score / cat.maxScore) * 100 < 60)
      .map((cat) => ({
        name: cat.name,
        score: cat.score,
        maxScore: cat.maxScore,
      }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-red-600">{error}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={fetchFeedback}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              再試行
            </button>
            <Link
              href="/candidate/dashboard"
              className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-center"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  const scores = parseScores();
  const totalScore = scores.reduce((sum, cat) => sum + cat.score, 0);
  const totalMaxScore = scores.reduce((sum, cat) => sum + cat.maxScore, 0);
  const overallPercentage = (totalScore / totalMaxScore) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <p className="text-sm font-medium">面接フィードバック</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            お疲れ様でした！
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            面接官からのフィードバックが届いています
          </p>

          {/* Overall Score Display */}
          <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-white/30">
            <p className="text-sm font-medium text-blue-100 mb-2">総合スコア</p>
            <div className="flex items-baseline justify-center space-x-2">
              <span className="text-7xl font-bold">
                {overallPercentage.toFixed(0)}
              </span>
              <span className="text-3xl text-blue-100">%</span>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-3xl ${
                    i < Math.round(overallPercentage / 20)
                      ? "text-yellow-300"
                      : "text-white/30"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm text-blue-100 mt-4">
              {totalScore} / {totalMaxScore} 点
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {feedback.interview.videoUrl && (
              <button
                onClick={handleViewVideo}
                className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold shadow-lg flex items-center space-x-2"
              >
                <span>📹</span>
                <span>動画を見直す</span>
              </button>
            )}
            <Link
              href="/candidate/book"
              className="px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-bold shadow-lg flex items-center space-x-2"
            >
              <span>📅</span>
              <span>次の面接を予約</span>
            </Link>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-8 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-bold shadow-lg flex items-center space-x-2 backdrop-blur-sm disabled:opacity-50"
            >
              <span>📄</span>
              <span>
                {isDownloadingPdf ? "生成中..." : "フィードバックをダウンロード (PDF)"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Encouragement Message */}
        <EncouragementCard
          message={feedback.evaluation.encouragementMessage}
          interviewerName={feedback.evaluation.interviewer.name}
          overallScore={overallPercentage}
        />

        {/* Fluency Analysis Results */}
        {feedback.fluencyAnalysis && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                自動流暢性分析結果
              </h2>
              <p className="text-gray-600">
                AIがあなたの話し方を分析した結果です
              </p>
            </div>
            <FluencyResults
              speechRate={feedback.fluencyAnalysis.speechRate}
              pauseFrequency={feedback.fluencyAnalysis.pauseFrequency}
              fillerCount={feedback.fluencyAnalysis.fillerCount}
              totalDuration={feedback.fluencyAnalysis.totalDuration}
              overallScore={feedback.fluencyAnalysis.overallScore}
            />
          </div>
        )}

        {/* Score Breakdown */}
        <ScoreBreakdown scores={scores} />

        {/* Detailed Comments and Advice */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Comments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">💬</span>
              <h3 className="text-xl font-bold text-gray-900">
                面接官のコメント
              </h3>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {feedback.evaluation.comments}
              </p>
            </div>
          </div>

          {/* Advice */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="text-xl font-bold text-gray-900">
                改善アドバイス
              </h3>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {feedback.evaluation.advice}
              </p>
            </div>
          </div>
        </div>

        {/* Improvement Plan */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              改善プラン
            </h2>
            <p className="text-gray-600">
              あなた専用の改善計画とアドバイスです
            </p>
          </div>
          <ImprovementPlan
            overallScore={overallPercentage}
            speechRate={feedback.fluencyAnalysis?.speechRate || 3.0}
            pauseFrequency={feedback.fluencyAnalysis?.pauseFrequency || 8}
            fillerCount={feedback.fluencyAnalysis?.fillerCount || 5}
            totalDuration={feedback.fluencyAnalysis?.totalDuration || 300}
            weakCategories={getWeakCategories()}
          />
        </div>

        {/* Bottom Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">次のステップに進みましょう！</h3>
          <p className="text-blue-100 mb-6">
            フィードバックを活かして、さらなる成長を目指しましょう
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/candidate/book"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold shadow-lg"
            >
              次の面接を予約する
            </Link>
            <Link
              href="/candidate/dashboard"
              className="px-8 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-bold shadow-lg"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
