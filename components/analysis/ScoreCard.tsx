"use client";

interface ScoreCardProps {
  title: string;
  icon: string;
  score: number;
  maxScore: number;
  unit: string;
  description: string;
  tips?: string[];
  benchmark?: {
    min: number;
    max: number;
    avg: number;
  };
  colorScheme?: "blue" | "purple" | "orange" | "green" | "teal";
}

export default function ScoreCard({
  title,
  icon,
  score,
  maxScore,
  unit,
  description,
  tips,
  benchmark,
  colorScheme = "blue",
}: ScoreCardProps) {
  // Calculate percentage for progress bar
  const percentage = (score / maxScore) * 100;

  // Get color classes based on scheme
  const getColorClasses = () => {
    switch (colorScheme) {
      case "blue":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-900",
          progress: "bg-blue-600",
          badge: "bg-blue-100 text-blue-800",
        };
      case "purple":
        return {
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-900",
          progress: "bg-purple-600",
          badge: "bg-purple-100 text-purple-800",
        };
      case "orange":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-900",
          progress: "bg-orange-600",
          badge: "bg-orange-100 text-orange-800",
        };
      case "green":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-900",
          progress: "bg-green-600",
          badge: "bg-green-100 text-green-800",
        };
      case "teal":
        return {
          bg: "bg-teal-50",
          border: "border-teal-200",
          text: "text-teal-900",
          progress: "bg-teal-600",
          badge: "bg-teal-100 text-teal-800",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-900",
          progress: "bg-gray-600",
          badge: "bg-gray-100 text-gray-800",
        };
    }
  };

  const colors = getColorClasses();

  // Determine performance level
  const getPerformanceLevel = () => {
    if (!benchmark) return null;

    if (score >= benchmark.avg) {
      return {
        label: "平均以上",
        emoji: "👍",
        color: "text-green-600",
      };
    } else if (score >= benchmark.min) {
      return {
        label: "平均以下",
        emoji: "📊",
        color: "text-yellow-600",
      };
    } else {
      return {
        label: "要改善",
        emoji: "💪",
        color: "text-orange-600",
      };
    }
  };

  const performanceLevel = getPerformanceLevel();

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg p-6 transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-3xl">{icon}</span>
            <h3 className={`text-lg font-bold ${colors.text}`}>{title}</h3>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Score Display */}
      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className={`text-4xl font-bold ${colors.text}`}>
            {typeof score === "number" ? score.toFixed(1) : score}
          </span>
          <span className="text-lg text-gray-500">{unit}</span>
        </div>

        {performanceLevel && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xl">{performanceLevel.emoji}</span>
            <span className={`text-sm font-medium ${performanceLevel.color}`}>
              {performanceLevel.label}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>進捗</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`${colors.progress} h-3 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Benchmark Comparison */}
      {benchmark && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">
            ベンチマーク比較
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">最小:</span>
              <span className="font-medium">{benchmark.min}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">平均:</span>
              <span className="font-medium">{benchmark.avg}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">最大:</span>
              <span className="font-medium">{benchmark.max}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-600">あなた:</span>
              <span className={`font-bold ${colors.text}`}>
                {typeof score === "number" ? score.toFixed(1) : score}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className={`p-3 ${colors.badge} rounded-lg`}>
          <h4 className="text-xs font-medium mb-2">💡 改善のヒント</h4>
          <ul className="space-y-1">
            {tips.slice(0, 3).map((tip, index) => (
              <li key={index} className="text-xs flex items-start">
                <span className="mr-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
