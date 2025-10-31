"use client";

import Link from "next/link";

interface FeedbackItem {
  id: string;
  date: string;
  interviewer: string;
  jobCategory?: string;
  score: number;
  createdAt: string;
}

interface RecentFeedbackProps {
  feedback: FeedbackItem[];
  averageScore: number;
}

export default function RecentFeedback({ feedback, averageScore }: RecentFeedbackProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "優秀";
    if (score >= 60) return "良好";
    if (score >= 40) return "改善中";
    return "要努力";
  };

  if (feedback.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          最近のフィードバック
        </h3>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 mb-2">
            まだフィードバックがありません
          </p>
          <p className="text-sm text-gray-500">
            面接を完了すると、ここにフィードバックが表示されます
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          最近のフィードバック
        </h3>
        {averageScore > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-600">平均スコア</p>
            <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore}%
            </p>
          </div>
        )}
      </div>

      {/* Mini Chart */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-end justify-between h-32 gap-2">
          {feedback.map((item, index) => (
            <div key={item.id} className="flex-1 flex flex-col items-center">
              <div className="w-full h-full flex items-end">
                <div
                  className={`w-full ${getScoreBgColor(item.score)} rounded-t transition-all hover:opacity-80`}
                  style={{ height: `${item.score}%` }}
                  title={`${item.score}%`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(item.date).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-3">
        {feedback.map((item) => (
          <Link
            key={item.id}
            href={`/candidate/interview/${item.id}/feedback`}
            className="block"
          >
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {item.interviewer}
                    </span>
                    {item.jobCategory && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {item.jobCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(item.date).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {getScoreLabel(item.score)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {feedback.length >= 5 && (
        <Link href="/candidate/history">
          <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            すべての履歴を見る →
          </button>
        </Link>
      )}
    </div>
  );
}
