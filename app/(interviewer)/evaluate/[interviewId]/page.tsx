"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { CenteredSpinner } from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ComprehensiveEvaluationForm, {
  type EvaluationScores,
  type EvaluationComments,
} from "@/components/evaluation/ComprehensiveEvaluationForm";

interface InterviewDetails {
  id: string;
  candidate: {
    name: string;
    email: string;
    japaneseLevel: string;
  };
  scheduledAt: string;
  conductedAt: string;
  videoUrl: string;
  fluencyAnalysis?: {
    speechRate: number;
    pauseFrequency: number;
    fillerCount: number;
    totalDuration: number;
  };
}

export default function EvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.interviewId as string;

  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    scores: EvaluationScores;
    comments: EvaluationComments;
  } | null>(null);

  useEffect(() => {
    fetchInterviewDetails();
  }, [interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/interview/${interviewId}/details`);

      if (!response.ok) {
        throw new Error("面接情報の取得に失敗しました");
      }

      const data = await response.json();

      // Check if already evaluated
      if (data.evaluation) {
        toast.warning("この面接は既に評価済みです");
        router.push("/interviewer/dashboard");
        return;
      }

      setInterview(data.interview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      toast.error(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (scores: EvaluationScores, comments: EvaluationComments) => {
    setPendingSubmission({ scores, comments });
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingSubmission) return;

    try {
      setIsSubmitting(true);
      setShowConfirmDialog(false);

      // Transform scores to match API format
      const apiScores = {
        japanese: {
          total: Object.values(pendingSubmission.scores.japanese).reduce((a, b) => a + b, 0),
          ...pendingSubmission.scores.japanese,
        },
        fluency: {
          total: Object.values(pendingSubmission.scores.fluency).reduce((a, b) => a + b, 0),
          ...pendingSubmission.scores.fluency,
        },
        communication: {
          total: Object.values(pendingSubmission.scores.communication).reduce((a, b) => a + b, 0),
          ...pendingSubmission.scores.communication,
        },
        interviewContent: {
          total: Object.values(pendingSubmission.scores.interviewContent).reduce((a, b) => a + b, 0),
          ...pendingSubmission.scores.interviewContent,
        },
        overall: {
          total: Object.values(pendingSubmission.scores.overall).reduce((a, b) => a + b, 0),
          ...pendingSubmission.scores.overall,
        },
      };

      const response = await fetch("/api/evaluation/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId,
          scores: apiScores,
          comments: pendingSubmission.comments.strengths,
          advice: pendingSubmission.comments.advice,
          encouragementMessage: pendingSubmission.comments.encouragement,
          improvementPoints: pendingSubmission.comments.improvements,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "評価の提出に失敗しました");
      }

      // Success!
      toast.success("評価を提出しました！候補者に通知されます。");
      router.push("/interviewer/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "評価の提出に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <CenteredSpinner size="lg" text="読み込み中..." fullScreen />;
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="エラーが発生しました"
            message={error || "面接情報を読み込めませんでした"}
            variant="card"
            severity="error"
            onRetry={fetchInterviewDetails}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 py-8 px-4">
      {/* Header with Interview Details */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                面接評価フォーム
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">候補者</p>
                  <p className="font-medium text-gray-900">{interview.candidate.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">日本語レベル</p>
                  <p className="font-medium text-gray-900">{interview.candidate.japaneseLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">面接日</p>
                  <p className="font-medium text-gray-900">
                    {new Date(interview.scheduledAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {interview.videoUrl && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">録画</p>
                    <a
                      href={interview.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      📹 動画を見る
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Fluency Analysis Results */}
              {interview.fluencyAnalysis && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    🤖 自動流暢性分析結果
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-blue-700">話速</p>
                      <p className="font-semibold text-blue-900">
                        {interview.fluencyAnalysis.speechRate.toFixed(1)} 文字/秒
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">ポーズ頻度</p>
                      <p className="font-semibold text-blue-900">
                        {interview.fluencyAnalysis.pauseFrequency.toFixed(1)} 回/分
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">フィラー</p>
                      <p className="font-semibold text-blue-900">
                        {interview.fluencyAnalysis.fillerCount} 回
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">総時間</p>
                      <p className="font-semibold text-blue-900">
                        {Math.floor(interview.fluencyAnalysis.totalDuration / 60)}分
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Form */}
      <ComprehensiveEvaluationForm
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              評価を提出しますか？
            </h3>
            <p className="text-gray-600 mb-6">
              提出後は編集できません。内容を確認してください。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "送信中..." : "提出する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
