"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import VideoUploader from "@/components/interview/VideoUploader";

interface InterviewDetails {
  id: string;
  status: string;
  scheduledAt: string;
  videoUrl: string | null;
  interviewer: {
    name: string;
  };
  slot: {
    jobCategory: string;
    startTime: string;
    endTime: string;
  };
}

export default function VideoUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const interviewId = params?.interviewId as string;

  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session?.user?.userType !== "CANDIDATE"
    ) {
      router.push("/unauthorized");
    } else if (status === "authenticated" && interviewId) {
      fetchInterviewDetails();
    }
  }, [status, session, router, interviewId]);

  const fetchInterviewDetails = async () => {
    try {
      setIsLoading(true);

      // Fetch interview details
      const response = await fetch(`/api/interview/${interviewId}`);

      if (!response.ok) {
        throw new Error("面接情報の取得に失敗しました");
      }

      const data = await response.json();
      setInterview(data.interview);

      // Check if video already uploaded
      if (data.interview.videoUrl) {
        setUploadSuccess(true);
        setUploadedVideoUrl(data.interview.videoUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (videoUrl: string) => {
    setUploadSuccess(true);
    setUploadedVideoUrl(videoUrl);
    setError("");
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (error && !interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchInterviewDetails}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600">面接情報が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            面接動画のアップロード
          </h1>
          <p className="text-gray-600">
            実施した面接の録画動画をアップロードしてください
          </p>
        </div>

        {/* Interview Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">面接情報</h2>
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <span className="w-32 font-medium">面接官:</span>
              <span>{interview.interviewer.name}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-32 font-medium">カテゴリー:</span>
              <span>{interview.slot.jobCategory}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-32 font-medium">日時:</span>
              <span>{formatDate(interview.scheduledAt)}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-32 font-medium">時間:</span>
              <span>
                {formatTime(interview.slot.startTime)} -{" "}
                {formatTime(interview.slot.endTime)}
              </span>
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-32 font-medium">ステータス:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  interview.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {interview.status === "COMPLETED" ? "完了" : "予定済み"}
              </span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="text-4xl mr-4">✅</div>
              <div>
                <h3 className="text-lg font-bold text-green-900">
                  アップロード完了
                </h3>
                <p className="text-green-700">
                  動画のアップロードが完了しました。面接官が評価を行います。
                </p>
              </div>
            </div>

            {/* Video Preview */}
            {uploadedVideoUrl && (
              <div className="bg-black rounded-lg overflow-hidden mt-4">
                <video src={uploadedVideoUrl} controls className="w-full">
                  お使いのブラウザは動画の再生に対応していません。
                </video>
              </div>
            )}

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => router.push("/candidate/dashboard")}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                ダッシュボードに戻る
              </button>
              <button
                onClick={() => router.push("/candidate/interviews")}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                面接一覧を見る
              </button>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {error && !uploadSuccess && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Upload Area */}
        {!uploadSuccess && interview.status === "SCHEDULED" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              動画をアップロード
            </h2>
            <VideoUploader
              interviewId={interviewId}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        )}

        {/* Already Uploaded or Not Scheduled */}
        {!uploadSuccess &&
          interview.videoUrl &&
          interview.status === "COMPLETED" && (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                動画は既にアップロード済みです
              </h3>
              <p className="text-gray-600 mb-6">
                この面接には既に動画がアップロードされています。
              </p>
              <button
                onClick={() => router.push("/candidate/dashboard")}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                ダッシュボードに戻る
              </button>
            </div>
          )}

        {interview.status === "PENDING" && (
          <div className="bg-yellow-100 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              面接承認待ちです
            </h3>
            <p className="text-gray-600 mb-6">
              面接官が予約を承認してから動画をアップロードできます。
            </p>
            <button
              onClick={() => router.push("/candidate/dashboard")}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              ダッシュボードに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
