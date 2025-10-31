"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Radar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface FluencyResultsProps {
  analysis: {
    metrics: {
      speechRate: { value: number; unit: string; benchmark: any };
      pauseFrequency: { value: number; unit: string; benchmark: any };
      fillerCount: { value: number; unit: string; benchmark: any };
      totalDuration: { value: number; unit: string };
    };
    overallScore: {
      value: number;
      scale: string;
      scoreOn5Scale: number;
      interpretation: {
        label: string;
        color: string;
        description: string;
      };
    };
    analyzedAt: string;
    candidate: {
      name: string;
      japaneseLevel: string;
    };
  };
}

export default function FluencyResults({ analysis }: FluencyResultsProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.0) return { bg: "bg-green-500", text: "text-green-700" };
    if (score >= 3.0) return { bg: "bg-yellow-500", text: "text-yellow-700" };
    if (score >= 2.0) return { bg: "bg-orange-500", text: "text-orange-700" };
    return { bg: "bg-red-500", text: "text-red-700" };
  };

  const scoreColors = getScoreColor(analysis.overallScore.scoreOn5Scale);

  // Overall Score Doughnut Chart
  const scorePercentage = (analysis.overallScore.value / 100) * 100;
  const doughnutData = {
    labels: ["スコア", "残り"],
    datasets: [
      {
        data: [scorePercentage, 100 - scorePercentage],
        backgroundColor: [
          analysis.overallScore.scoreOn5Scale >= 4.0
            ? "#10b981"
            : analysis.overallScore.scoreOn5Scale >= 3.0
            ? "#eab308"
            : analysis.overallScore.scoreOn5Scale >= 2.0
            ? "#f97316"
            : "#ef4444",
          "#e5e7eb",
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    cutout: "75%",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  // Speech Rate Bar Chart
  const speechRateData = {
    labels: ["最小", "あなた", "平均", "最大"],
    datasets: [
      {
        label: "モーラ/秒",
        data: [
          analysis.metrics.speechRate.benchmark.min,
          analysis.metrics.speechRate.value,
          analysis.metrics.speechRate.benchmark.avg,
          analysis.metrics.speechRate.benchmark.max,
        ],
        backgroundColor: [
          "#e5e7eb",
          "#3b82f6",
          "#14b8a6",
          "#e5e7eb",
        ],
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
      },
    },
  };

  // Radar Chart for All Metrics
  const radarData = {
    labels: ["発話速度", "ポーズ頻度", "フィラー使用", "総合評価"],
    datasets: [
      {
        label: "あなたのスコア",
        data: [
          (analysis.metrics.speechRate.value /
            analysis.metrics.speechRate.benchmark.max) *
            5,
          5 -
            (analysis.metrics.pauseFrequency.value /
              analysis.metrics.pauseFrequency.benchmark.max) *
              5,
          5 -
            (analysis.metrics.fillerCount.value /
              analysis.metrics.fillerCount.benchmark.max) *
              5,
          analysis.overallScore.scoreOn5Scale,
        ],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(59, 130, 246)",
      },
      {
        label: "平均",
        data: [
          (analysis.metrics.speechRate.benchmark.avg /
            analysis.metrics.speechRate.benchmark.max) *
            5,
          5 -
            (analysis.metrics.pauseFrequency.benchmark.avg /
              analysis.metrics.pauseFrequency.benchmark.max) *
              5,
          5 -
            (analysis.metrics.fillerCount.benchmark.avg /
              analysis.metrics.fillerCount.benchmark.max) *
              5,
          3.5,
        ],
        backgroundColor: "rgba(20, 184, 166, 0.2)",
        borderColor: "rgb(20, 184, 166)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(20, 184, 166)",
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">流暢性分析結果</h2>
            <p className="text-sm text-gray-600 mt-1">
              {analysis.candidate.name}さん（{analysis.candidate.japaneseLevel}）
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            分析日時:{" "}
            {new Date(analysis.analyzedAt).toLocaleString("ja-JP")}
          </div>
        </div>

        {/* Overall Score Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Gauge */}
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
            <div className="relative w-48 h-48">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-gray-900">
                  {analysis.overallScore.value}
                </div>
                <div className="text-sm text-gray-500">/ 100</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span
                className={`inline-block px-4 py-2 rounded-full font-medium ${
                  analysis.overallScore.interpretation.color === "green"
                    ? "bg-green-100 text-green-800"
                    : analysis.overallScore.interpretation.color === "yellow"
                    ? "bg-yellow-100 text-yellow-800"
                    : analysis.overallScore.interpretation.color === "orange"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {analysis.overallScore.interpretation.label}
              </span>
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="flex flex-col justify-center p-6 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-3">評価コメント</h3>
            <p className="text-gray-700 mb-4">
              {analysis.overallScore.interpretation.description}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-24 text-gray-600">スコア:</div>
                <div className="font-medium">
                  {analysis.overallScore.scoreOn5Scale.toFixed(1)} / 5.0
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-24 text-gray-600">レベル:</div>
                <div className="font-medium">
                  {analysis.candidate.japaneseLevel}
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-24 text-gray-600">面接時間:</div>
                <div className="font-medium">
                  {formatDuration(analysis.metrics.totalDuration.value)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Speech Rate */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">発話速度</h3>
            <span className="text-3xl">🗣️</span>
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-blue-600">
              {analysis.metrics.speechRate.value.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">
              {analysis.metrics.speechRate.unit}
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>最小:</span>
              <span>{analysis.metrics.speechRate.benchmark.min}</span>
            </div>
            <div className="flex justify-between">
              <span>平均:</span>
              <span>{analysis.metrics.speechRate.benchmark.avg}</span>
            </div>
            <div className="flex justify-between">
              <span>最大:</span>
              <span>{analysis.metrics.speechRate.benchmark.max}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${
                    (analysis.metrics.speechRate.value /
                      analysis.metrics.speechRate.benchmark.max) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Pause Frequency */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">ポーズ頻度</h3>
            <span className="text-3xl">⏸️</span>
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-purple-600">
              {analysis.metrics.pauseFrequency.value.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">
              {analysis.metrics.pauseFrequency.unit}
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>最小:</span>
              <span>{analysis.metrics.pauseFrequency.benchmark.min}</span>
            </div>
            <div className="flex justify-between">
              <span>平均:</span>
              <span>{analysis.metrics.pauseFrequency.benchmark.avg}</span>
            </div>
            <div className="flex justify-between">
              <span>最大:</span>
              <span>{analysis.metrics.pauseFrequency.benchmark.max}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${
                    (analysis.metrics.pauseFrequency.value /
                      analysis.metrics.pauseFrequency.benchmark.max) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Filler Count */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">フィラー使用</h3>
            <span className="text-3xl">💬</span>
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-orange-600">
              {analysis.metrics.fillerCount.value}
            </div>
            <div className="text-sm text-gray-600">
              {analysis.metrics.fillerCount.unit}
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>最小:</span>
              <span>{analysis.metrics.fillerCount.benchmark.min}</span>
            </div>
            <div className="flex justify-between">
              <span>平均:</span>
              <span>{analysis.metrics.fillerCount.benchmark.avg}</span>
            </div>
            <div className="flex justify-between">
              <span>最大:</span>
              <span>{analysis.metrics.fillerCount.benchmark.max}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{
                  width: `${
                    (analysis.metrics.fillerCount.value /
                      analysis.metrics.fillerCount.benchmark.max) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speech Rate Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">発話速度の比較</h3>
          <Bar data={speechRateData} options={barOptions} />
          <p className="text-sm text-gray-600 mt-4">
            あなたの発話速度を最小値、平均値、最大値と比較しています。
          </p>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">総合パフォーマンス</h3>
          <Radar data={radarData} options={radarOptions} />
          <p className="text-sm text-gray-600 mt-4">
            青色があなたのスコア、緑色が平均を表しています。
          </p>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-900 mb-4">💡 改善のヒント</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">発話速度について</h4>
            <p className="text-sm text-blue-800">
              理想的な発話速度は3.0-3.5モーラ/秒です。
              {analysis.metrics.speechRate.value < 3.0
                ? "もう少し速く話すことを意識してみましょう。"
                : analysis.metrics.speechRate.value > 3.5
                ? "少しゆっくり話すことで、より理解しやすくなります。"
                : "とても良いペースです！"}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">
              ポーズについて
            </h4>
            <p className="text-sm text-purple-800">
              適度なポーズ（7-10回/分）は理解を助けます。
              {analysis.metrics.pauseFrequency.value < 7
                ? "もう少しポーズを入れることで、聞き手に考える時間を与えられます。"
                : analysis.metrics.pauseFrequency.value > 10
                ? "ポーズが多すぎると不自然に聞こえることがあります。"
                : "適切なポーズの使い方ができています！"}
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-900 mb-2">
              フィラーワードについて
            </h4>
            <p className="text-sm text-orange-800">
              「あの」「えっと」などのフィラーは少ないほど良いです。
              {analysis.metrics.fillerCount.value <= 5
                ? "フィラーの使用が非常に少なく、流暢です！"
                : analysis.metrics.fillerCount.value <= 10
                ? "適度な範囲内です。さらに減らすことを目指しましょう。"
                : "フィラーが多いと感じます。事前に話す内容を整理することが効果的です。"}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">次のステップ</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• 録音して自分の話し方を確認する</li>
              <li>• ゆっくりと明瞭に話す練習をする</li>
              <li>• 事前に話す内容を整理しておく</li>
              <li>• 定期的に面接練習を行う</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
