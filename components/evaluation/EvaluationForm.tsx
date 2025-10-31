"use client";

import { useState } from "react";
import Button from "../ui/Button";

export interface EvaluationScores {
  japanese: {
    vocabulary: number;
    grammar: number;
    pronunciation: number;
    fluency: number;
    total: number;
    comment: string;
  };
  communication: {
    listening: number;
    speaking: number;
    logic: number;
    persuasion: number;
    total: number;
    comment: string;
  };
  manner: {
    greeting: number;
    posture: number;
    eyeContact: number;
    expression: number;
    total: number;
    comment: string;
  };
  answers: {
    understanding: number;
    relevance: number;
    specificity: number;
    depth: number;
    total: number;
    comment: string;
  };
  overall: {
    enthusiasm: number;
    confidence: number;
    sincerity: number;
    potential: number;
    total: number;
    comment: string;
  };
}

interface EvaluationFormProps {
  onSubmit: (scores: EvaluationScores) => void;
  isSubmitting?: boolean;
  initialData?: Partial<EvaluationScores>;
}

type SectionKey = keyof EvaluationScores;

const sections = [
  {
    key: "japanese" as SectionKey,
    title: "日本語能力",
    icon: "🗣️",
    items: [
      { key: "vocabulary", label: "語彙・表現", description: "適切な語彙を使用できているか" },
      { key: "grammar", label: "文法・正確性", description: "文法的に正しい日本語を使えているか" },
      { key: "pronunciation", label: "発音・イントネーション", description: "聞き取りやすい発音か" },
      { key: "fluency", label: "流暢性", description: "スムーズに話せているか" },
    ],
  },
  {
    key: "communication" as SectionKey,
    title: "コミュニケーション能力",
    icon: "💬",
    items: [
      { key: "listening", label: "聞く力", description: "質問を正確に理解できているか" },
      { key: "speaking", label: "話す力", description: "考えを明確に伝えられているか" },
      { key: "logic", label: "論理性", description: "論理的に話せているか" },
      { key: "persuasion", label: "説得力", description: "説得力のある説明ができているか" },
    ],
  },
  {
    key: "manner" as SectionKey,
    title: "面接マナー",
    icon: "🎩",
    items: [
      { key: "greeting", label: "挨拶・礼儀", description: "適切な挨拶と礼儀があるか" },
      { key: "posture", label: "姿勢・態度", description: "姿勢や態度は適切か" },
      { key: "eyeContact", label: "アイコンタクト", description: "適切なアイコンタクトがあるか" },
      { key: "expression", label: "表情", description: "明るく前向きな表情か" },
    ],
  },
  {
    key: "answers" as SectionKey,
    title: "質問への回答",
    icon: "❓",
    items: [
      { key: "understanding", label: "理解度", description: "質問の意図を理解しているか" },
      { key: "relevance", label: "適切性", description: "質問に対して適切な回答をしているか" },
      { key: "specificity", label: "具体性", description: "具体例を用いて説明できているか" },
      { key: "depth", label: "深さ", description: "深い洞察や考察があるか" },
    ],
  },
  {
    key: "overall" as SectionKey,
    title: "全体印象",
    icon: "⭐",
    items: [
      { key: "enthusiasm", label: "熱意・意欲", description: "仕事への熱意が感じられるか" },
      { key: "confidence", label: "自信", description: "自信を持って話せているか" },
      { key: "sincerity", label: "誠実さ", description: "誠実な態度で臨んでいるか" },
      { key: "potential", label: "ポテンシャル", description: "将来性を感じるか" },
    ],
  },
];

const scoreLabels = [
  { value: 1, label: "要改善", color: "text-red-600" },
  { value: 2, label: "やや不足", color: "text-orange-600" },
  { value: 3, label: "普通", color: "text-yellow-600" },
  { value: 4, label: "良い", color: "text-blue-600" },
  { value: 5, label: "優秀", color: "text-green-600" },
];

export default function EvaluationForm({
  onSubmit,
  isSubmitting = false,
  initialData,
}: EvaluationFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [scores, setScores] = useState<EvaluationScores>(
    initialData || {
      japanese: { vocabulary: 0, grammar: 0, pronunciation: 0, fluency: 0, total: 0, comment: "" },
      communication: { listening: 0, speaking: 0, logic: 0, persuasion: 0, total: 0, comment: "" },
      manner: { greeting: 0, posture: 0, eyeContact: 0, expression: 0, total: 0, comment: "" },
      answers: { understanding: 0, relevance: 0, specificity: 0, depth: 0, total: 0, comment: "" },
      overall: { enthusiasm: 0, confidence: 0, sincerity: 0, potential: 0, total: 0, comment: "" },
    }
  );

  const currentSectionData = sections[currentSection];
  const currentSectionKey = currentSectionData.key;
  const currentScores = scores[currentSectionKey];

  const handleScoreChange = (itemKey: string, value: number) => {
    setScores((prev) => {
      const updated = { ...prev };
      const section = updated[currentSectionKey];
      (section as any)[itemKey] = value;

      // Calculate total
      const total = currentSectionData.items.reduce(
        (sum, item) => sum + ((section as any)[item.key] || 0),
        0
      );
      section.total = total;

      return updated;
    });
  };

  const handleCommentChange = (value: string) => {
    setScores((prev) => ({
      ...prev,
      [currentSectionKey]: {
        ...prev[currentSectionKey],
        comment: value,
      },
    }));
  };

  const isCurrentSectionComplete = () => {
    return currentSectionData.items.every(
      (item) => (currentScores as any)[item.key] > 0
    );
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(scores);
  };

  const getOverallCompletion = () => {
    let completedSections = 0;
    sections.forEach((section) => {
      const sectionScores = scores[section.key];
      const isComplete = section.items.every(
        (item) => (sectionScores as any)[item.key] > 0
      );
      if (isComplete) completedSections++;
    });
    return (completedSections / sections.length) * 100;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            進捗状況: {getOverallCompletion().toFixed(0)}%
          </span>
          <span className="text-sm text-gray-500">
            セクション {currentSection + 1} / {sections.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${getOverallCompletion()}%` }}
          ></div>
        </div>

        {/* Section Tabs */}
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {sections.map((section, index) => {
            const sectionScores = scores[section.key];
            const isComplete = section.items.every(
              (item) => (sectionScores as any)[item.key] > 0
            );
            return (
              <button
                key={section.key}
                onClick={() => setCurrentSection(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentSection === index
                    ? "bg-blue-600 text-white"
                    : isComplete
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="mr-1">{section.icon}</span>
                {section.title}
                {isComplete && <span className="ml-1">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-4xl">{currentSectionData.icon}</span>
            <h2 className="text-3xl font-bold text-gray-900">
              {currentSectionData.title}
            </h2>
          </div>
          <p className="text-gray-600">
            各項目を5段階で評価してください（1: 要改善 〜 5: 優秀）
          </p>
        </div>

        {/* Score Items */}
        <div className="space-y-8">
          {currentSectionData.items.map((item) => {
            const score = (currentScores as any)[item.key] || 0;

            return (
              <div key={item.key} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>

                {/* Radio Buttons */}
                <div className="flex flex-wrap items-center space-x-2 space-y-2 md:space-y-0">
                  {scoreLabels.map((scoreLabel) => (
                    <label
                      key={scoreLabel.value}
                      className={`flex-1 min-w-[120px] cursor-pointer`}
                    >
                      <input
                        type="radio"
                        name={`${currentSectionKey}-${item.key}`}
                        value={scoreLabel.value}
                        checked={score === scoreLabel.value}
                        onChange={() => handleScoreChange(item.key, scoreLabel.value)}
                        className="sr-only"
                      />
                      <div
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          score === scoreLabel.value
                            ? "border-blue-500 bg-blue-50 shadow-md scale-105"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-2xl font-bold mb-1">{scoreLabel.value}</div>
                        <div className={`text-xs font-medium ${scoreLabel.color}`}>
                          {scoreLabel.label}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section Comment */}
        <div className="mt-8">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            このセクションについてのコメント（任意）
          </label>
          <textarea
            value={currentScores.comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="このセクションについての具体的なフィードバックがあれば記入してください..."
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSection === 0}
          leftIcon={<span>←</span>}
        >
          前へ
        </Button>

        <div className="text-sm text-gray-600">
          セクション {currentSection + 1} / {sections.length}
        </div>

        {currentSection < sections.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!isCurrentSectionComplete()}
            rightIcon={<span>→</span>}
          >
            次へ
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isCurrentSectionComplete() || isSubmitting}
            isLoading={isSubmitting}
          >
            コメント入力へ進む
          </Button>
        )}
      </div>
    </div>
  );
}
