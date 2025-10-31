"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import InterviewPlayer from "@/components/interviewer/InterviewPlayer";
import CandidateInfo from "@/components/interviewer/CandidateInfo";
import Link from "next/link";

interface InterviewDetails {
  id: string;
  status: string;
  scheduledAt: string;
  conductedAt: string | null;
  videoUrl: string | null;
  candidate: {
    id: string;
    name: string;
    email: string;
    japaneseLevel: string;
    profile?: any;
  };
  interviewer: {
    id: string;
    name: string;
    email: string;
  };
  slot: {
    jobCategory: string;
    startTime: string;
    endTime: string;
  };
  resume?: {
    id: string;
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  } | null;
  evaluation: any;
  fluencyAnalysis?: {
    id: string;
    speechRate: number;
    pauseFrequency: number;
    fillerCount: number;
    totalDuration: number;
    overallScore: number;
    analyzedAt: string;
  } | null;
}

export default function InterviewReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const interviewId = params?.interviewId as string;

  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session?.user?.userType !== "INTERVIEWER"
    ) {
      router.push("/unauthorized");
    } else if (status === "authenticated" && interviewId) {
      fetchInterviewDetails();
    }
  }, [status, session, router, interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/interview/${interviewId}/details`);

      if (!response.ok) {
        throw new Error("面接情報の取得に失敗しました");
      }

      const data = await response.json();
      setInterview(data.interview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error || "面接が見つかりません"}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchInterviewDetails}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              再試行
            </button>
            <button
              onClick={() => router.push("/interviewer/dashboard")}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if video is available
  if (!interview.videoUrl) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              動画がまだアップロードされていません
            </h2>
            <p className="text-gray-600 mb-6">
              候補者が面接動画をアップロードするまでお待ちください。
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => router.push("/interviewer/dashboard")}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                ダッシュボードに戻る
              </button>
              <button
                onClick={fetchInterviewDetails}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                面接動画レビュー
              </h1>
              <p className="text-gray-600">
                {interview.candidate.name}さんの面接動画を確認して評価を行います
              </p>
            </div>
            <button
              onClick={() => router.push("/interviewer/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 戻る
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video and Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <InterviewPlayer
              videoUrl={interview.videoUrl}
              title={`${interview.candidate.name} - ${interview.slot.jobCategory}`}
            />

            {/* Fluency Analysis */}
            {interview.fluencyAnalysis ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    流暢性分析結果
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      interview.fluencyAnalysis.overallScore >= 80
                        ? "bg-green-100 text-green-800"
                        : interview.fluencyAnalysis.overallScore >= 60
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    スコア: {interview.fluencyAnalysis.overallScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Speech Rate */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        発話速度
                      </span>
                      <span className="text-2xl">🗣️</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {interview.fluencyAnalysis.speechRate.toFixed(1)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">語/分</p>
                  </div>

                  {/* Pause Frequency */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-900">
                        ポーズ頻度
                      </span>
                      <span className="text-2xl">⏸️</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700">
                      {interview.fluencyAnalysis.pauseFrequency.toFixed(1)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">回/分</p>
                  </div>

                  {/* Filler Count */}
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-900">
                        フィラー数
                      </span>
                      <span className="text-2xl">💬</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                      {interview.fluencyAnalysis.fillerCount}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">回</p>
                  </div>

                  {/* Total Duration */}
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-teal-900">
                        総時間
                      </span>
                      <span className="text-2xl">⏱️</span>
                    </div>
                    <p className="text-2xl font-bold text-teal-700">
                      {formatDuration(interview.fluencyAnalysis.totalDuration)}
                    </p>
                    <p className="text-xs text-teal-600 mt-1">
                      {new Date(
                        interview.fluencyAnalysis.analyzedAt
                      ).toLocaleDateString("ja-JP")}
                      に分析
                    </p>
                  </div>
                </div>

                {/* Analysis Insights */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">
                    💡 分析結果の見方
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      • <strong>発話速度:</strong> 120-150語/分が自然なペース
                    </li>
                    <li>
                      • <strong>ポーズ頻度:</strong> 適度な間は理解を助けます
                    </li>
                    <li>
                      • <strong>フィラー:</strong> 「あの」「えっと」などの使用頻度
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  流暢性分析は未実施です
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  動画の自動分析は現在準備中です。手動で評価を行ってください。
                </p>
              </div>
            )}

            {/* Evaluation Button */}
            {!interview.evaluation ? (
              <Link
                href={`/interviewer/evaluate/${interviewId}`}
                className="block w-full py-4 bg-teal-600 text-white text-center rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg shadow-lg"
              >
                📝 評価を入力
              </Link>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">✅</div>
                    <div>
                      <h3 className="font-medium text-green-900">
                        評価済み
                      </h3>
                      <p className="text-sm text-green-700">
                        この面接は既に評価されています
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/interviewer/evaluate/${interviewId}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    評価を確認
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Candidate Info */}
          <div className="lg:col-span-1">
            <CandidateInfo
              candidate={interview.candidate}
              interviewDate={interview.scheduledAt}
              interviewTime={{
                start: interview.slot.startTime,
                end: interview.slot.endTime,
              }}
              jobCategory={interview.slot.jobCategory}
              resume={interview.resume}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
