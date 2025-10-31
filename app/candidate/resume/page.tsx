"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ResumeUploader from "@/components/candidate/ResumeUploader";

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  isLatest: boolean;
}

export default function ResumePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchResumes();
    }
  }, [status, router]);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/resume/list");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "履歴書の取得に失敗しました");
      }

      setResumes(data.resumes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この履歴書を削除してもよろしいですか？")) {
      return;
    }

    setDeleteId(id);
    try {
      const response = await fetch(`/api/resume/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "削除に失敗しました");
      }

      // Refresh list
      await fetchResumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (url: string) => {
    // This is a placeholder - in real implementation, you'd store size in DB
    return "ファイルサイズ不明";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            履歴書管理
          </h1>
          <p className="text-gray-600">
            履歴書をアップロードして面接に使用します
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            新しい履歴書をアップロード
          </h2>
          <ResumeUploader onUploadSuccess={fetchResumes} />
        </div>

        {/* Resume List Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            アップロード済みの履歴書
          </h2>

          {resumes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-gray-600">
                まだ履歴書がアップロードされていません
              </p>
              <p className="text-sm text-gray-500 mt-2">
                上のフォームから履歴書をアップロードしてください
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-4xl">📄</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {resume.fileName}
                          </h3>
                          {resume.isLatest && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              最新
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          アップロード日時: {formatDate(resume.uploadedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        プレビュー
                      </a>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        disabled={deleteId === resume.id}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {deleteId === resume.id ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                履歴書のヒント
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>最新の履歴書が面接時に使用されます</li>
                  <li>PDF形式を推奨します（互換性が高いため）</li>
                  <li>ファイル名は分かりやすい名前にしてください</li>
                  <li>個人情報の取り扱いには十分ご注意ください</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
