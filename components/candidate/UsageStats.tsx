"use client";

interface UsageStatsProps {
  used: number;
  limit: number;
  remaining: number;
}

export default function UsageStats({ used, limit, remaining }: UsageStatsProps) {
  const percentage = (used / limit) * 100;

  // Color based on usage
  const getColor = () => {
    if (remaining === 0) return "text-red-600";
    if (remaining === 1) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    if (remaining === 0) return "bg-red-500";
    if (remaining === 1) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getMessage = () => {
    if (remaining === 0) return "今月の利用制限に達しました";
    if (remaining === 1) return "残り1回利用できます";
    return `残り${remaining}回利用できます`;
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-blue-100 text-sm font-medium">今月の利用状況</p>
          <h3 className="text-3xl font-bold mt-1">
            {used} / {limit}
          </h3>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-50">{getMessage()}</p>
        {remaining > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
            {remaining}回残り
          </span>
        )}
      </div>

      {/* Warning if limit reached */}
      {remaining === 0 && (
        <div className="mt-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg p-3">
          <p className="text-sm text-red-50">
            ⚠️ 来月1日に利用回数がリセットされます
          </p>
        </div>
      )}
    </div>
  );
}
