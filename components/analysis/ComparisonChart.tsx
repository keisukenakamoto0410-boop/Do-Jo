"use client";

import { Bar } from "react-chartjs-2";

interface ComparisonChartProps {
  userScore: number;
  userLevel: string;
  previousScore?: number;
}

export default function ComparisonChart({
  userScore,
  userLevel,
  previousScore,
}: ComparisonChartProps) {
  // Define benchmark scores for different Japanese levels
  const getLevelBenchmarks = (level: string) => {
    switch (level) {
      case "N5":
        return { avg: 40, target: 50 };
      case "N4":
        return { avg: 50, target: 60 };
      case "N3":
        return { avg: 60, target: 70 };
      case "N2":
        return { avg: 70, target: 80 };
      case "N1":
        return { avg: 80, target: 90 };
      default:
        return { avg: 60, target: 70 };
    }
  };

  // Get target level (next level up)
  const getTargetLevel = (currentLevel: string): string => {
    const levels = ["N5", "N4", "N3", "N2", "N1"];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1
      ? levels[currentIndex + 1]
      : "Native";
  };

  const benchmarks = getLevelBenchmarks(userLevel);
  const targetLevel = getTargetLevel(userLevel);
  const targetBenchmarks = getLevelBenchmarks(targetLevel);

  // Prepare chart data
  const labels = previousScore
    ? ["前回", "今回", `${userLevel}平均`, `${targetLevel}目標`]
    : ["今回", `${userLevel}平均`, `${targetLevel}目標`];

  const data = previousScore
    ? [previousScore, userScore, benchmarks.avg, targetBenchmarks.avg]
    : [userScore, benchmarks.avg, targetBenchmarks.avg];

  const backgroundColors = previousScore
    ? ["#94a3b8", "#3b82f6", "#14b8a6", "#f59e0b"]
    : ["#3b82f6", "#14b8a6", "#f59e0b"];

  const chartData = {
    labels,
    datasets: [
      {
        label: "スコア",
        data,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `スコア: ${context.parsed.y}/100`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Calculate improvement
  const improvement = previousScore
    ? userScore - previousScore
    : null;

  const distanceToAverage = userScore - benchmarks.avg;
  const distanceToTarget = targetBenchmarks.avg - userScore;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          レベル比較
        </h3>
        <p className="text-sm text-gray-600">
          あなたのスコアを同レベルの平均や次のレベルの目標と比較しています。
        </p>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <Bar data={chartData} options={options} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Improvement */}
        {improvement !== null && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-900">前回からの改善</h4>
              {improvement > 0 ? (
                <span className="text-2xl">📈</span>
              ) : improvement < 0 ? (
                <span className="text-2xl">📉</span>
              ) : (
                <span className="text-2xl">➡️</span>
              )}
            </div>
            <div className="flex items-baseline space-x-1">
              <span
                className={`text-2xl font-bold ${
                  improvement > 0
                    ? "text-green-600"
                    : improvement < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {improvement > 0 ? "+" : ""}
                {improvement.toFixed(1)}
              </span>
              <span className="text-sm text-blue-700">ポイント</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {improvement > 0
                ? "素晴らしい！順調に上達しています"
                : improvement < 0
                ? "次回はもっと良くなります"
                : "前回と同じレベルを維持しています"}
            </p>
          </div>
        )}

        {/* Distance to Average */}
        <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-teal-900">{userLevel}平均との差</h4>
            <span className="text-2xl">
              {distanceToAverage >= 0 ? "👆" : "👇"}
            </span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span
              className={`text-2xl font-bold ${
                distanceToAverage >= 0 ? "text-green-600" : "text-orange-600"
              }`}
            >
              {distanceToAverage > 0 ? "+" : ""}
              {distanceToAverage.toFixed(1)}
            </span>
            <span className="text-sm text-teal-700">ポイント</span>
          </div>
          <p className="text-xs text-teal-700 mt-1">
            {distanceToAverage >= 0
              ? "平均以上のスコアです！"
              : "平均に近づくよう頑張りましょう"}
          </p>
        </div>

        {/* Distance to Target */}
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-orange-900">
              {targetLevel}目標まで
            </h4>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-orange-600">
              {distanceToTarget > 0 ? distanceToTarget.toFixed(1) : "達成！"}
            </span>
            {distanceToTarget > 0 && (
              <span className="text-sm text-orange-700">ポイント</span>
            )}
          </div>
          <p className="text-xs text-orange-700 mt-1">
            {distanceToTarget > 0
              ? `${targetLevel}レベルまであと${distanceToTarget.toFixed(0)}ポイント`
              : `${targetLevel}レベルに到達しました！`}
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          📊 分析結果
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          {userScore >= benchmarks.avg ? (
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>
                {userLevel}レベルの平均を上回っています。素晴らしいです！
              </span>
            </li>
          ) : (
            <li className="flex items-start">
              <span className="mr-2">💪</span>
              <span>
                {userLevel}レベルの平均まであと
                {Math.abs(distanceToAverage).toFixed(0)}
                ポイント。継続的な練習で到達できます。
              </span>
            </li>
          )}

          {distanceToTarget <= 0 ? (
            <li className="flex items-start">
              <span className="mr-2">🎉</span>
              <span>
                {targetLevel}
                レベルの目標スコアに到達しました。次のレベルを目指しましょう！
              </span>
            </li>
          ) : distanceToTarget <= 10 ? (
            <li className="flex items-start">
              <span className="mr-2">🔥</span>
              <span>
                {targetLevel}
                レベルまでもう少しです！このペースで練習を続けましょう。
              </span>
            </li>
          ) : (
            <li className="flex items-start">
              <span className="mr-2">🎯</span>
              <span>
                {targetLevel}
                レベルを目指して、焦らず一歩ずつ進みましょう。
              </span>
            </li>
          )}

          {previousScore && improvement !== null && improvement > 0 && (
            <li className="flex items-start">
              <span className="mr-2">📈</span>
              <span>
                前回から{improvement.toFixed(1)}
                ポイント向上しました。練習の成果が出ています！
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
