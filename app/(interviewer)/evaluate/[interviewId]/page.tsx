"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import EvaluationForm, {
  type EvaluationScores,
} from "@/components/evaluation/EvaluationForm";
import CommentSection, {
  type EvaluationComments,
} from "@/components/evaluation/CommentSection";

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
}

export default function EvaluatePage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params?.interviewId as string;

  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState<"scores" | "comments">("scores");
  const [scores, setScores] = useState<EvaluationScores | null>(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoresSubmit = (evaluationScores: EvaluationScores) => {
    setScores(evaluationScores);
    setStep("comments");
  };

  const handleCommentsSubmit = async (comments: EvaluationComments) => {
    if (!scores) {
      toast.error("スコアデータがありません");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/evaluation/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId,
          scores,
          comments: comments.goodPoints,
          advice: comments.advice,
          encouragementMessage: comments.encouragementMessage,
          improvementPoints: comments.improvementPoints,
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

  const handleBackToScores = () => {
    setStep("scores");
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

  if (error || !interview) {
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
          <button
            onClick={() => router.push("/interviewer/dashboard")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 py-8 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                面接評価フォーム
              </h1>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>候補者:</strong> {interview.candidate.name}
                </p>
                <p>
                  <strong>日本語レベル:</strong>{" "}
                  {interview.candidate.japaneseLevel}
                </p>
                <p>
                  <strong>面接日:</strong>{" "}
                  {new Date(interview.scheduledAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
            </div>
            {interview.videoUrl && (
              <a
                href={interview.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                📹 動画を見る
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      {step === "scores" ? (
        <EvaluationForm onSubmit={handleScoresSubmit} initialData={scores || undefined} />
      ) : (
        <CommentSection
          onSubmit={handleCommentsSubmit}
          onBack={handleBackToScores}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
