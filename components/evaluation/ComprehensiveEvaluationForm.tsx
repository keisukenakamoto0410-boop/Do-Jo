"use client";

import { useState, useEffect } from "react";
import Button from "../ui/Button";

// Progress Indicator Component
interface ProgressIndicatorProps {
  currentSection: number;
  totalSections: number;
  sectionTitles: string[];
}

function ProgressIndicator({ currentSection, totalSections, sectionTitles }: ProgressIndicatorProps) {
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          評価進捗: {currentSection + 1} / {totalSections}
        </h3>
        <span className="text-sm text-gray-600">{Math.round(progress)}% 完了</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {sectionTitles.map((title, index) => (
          <div
            key={index}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              index === currentSection
                ? "bg-blue-600 text-white"
                : index < currentSection
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {index < currentSection ? "✓ " : ""}
            {title}
          </div>
        ))}
      </div>
    </div>
  );
}

// Score Item Component with Tooltips
interface ScoreItemProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  tooltip: { [key: number]: string };
}

function ScoreItem({ label, description, value, onChange, tooltip }: ScoreItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getScoreColor = (score: number) => {
    if (score === 5) return "border-green-500 bg-green-50";
    if (score === 4) return "border-blue-500 bg-blue-50";
    if (score === 3) return "border-yellow-500 bg-yellow-50";
    if (score === 2) return "border-orange-500 bg-orange-50";
    if (score === 1) return "border-red-500 bg-red-50";
    return "border-gray-300 bg-white";
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{label}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <button
          type="button"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs">
          <p className="font-medium text-blue-900 mb-1">評価基準:</p>
          {Object.entries(tooltip).map(([score, desc]) => (
            <div key={score} className="text-blue-800">
              {score}点: {desc}
            </div>
          ))}
        </div>
      )}

      {/* Radio Buttons */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <label
            key={score}
            className={`flex-1 cursor-pointer transition-all ${
              value === score ? getScoreColor(score) : "border-gray-300 bg-white hover:bg-gray-50"
            } border-2 rounded-lg p-3 text-center`}
          >
            <input
              type="radio"
              name={label}
              value={score}
              checked={value === score}
              onChange={() => onChange(score)}
              className="sr-only"
            />
            <div className="text-lg font-bold text-gray-900">{score}</div>
            <div className="text-xs text-gray-600 mt-1">
              {score === 5 && "優秀"}
              {score === 4 && "良好"}
              {score === 3 && "普通"}
              {score === 2 && "改善必要"}
              {score === 1 && "要努力"}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// Main Form Interface
export interface EvaluationScores {
  japanese: {
    pronunciation: number;
    vocabulary: number;
    grammar: number;
  };
  fluency: {
    speed: number;
    pauses: number;
    fillers: number;
  };
  communication: {
    comprehension: number;
    logic: number;
    listening: number;
  };
  interviewContent: {
    selfIntro: number;
    motivation: number;
    responses: number;
  };
  overall: {
    businessManner: number;
    potential: number;
  };
}

export interface EvaluationComments {
  strengths: string;
  improvements: string;
  advice: string;
  encouragement: string;
}

interface ComprehensiveEvaluationFormProps {
  onSubmit: (scores: EvaluationScores, comments: EvaluationComments) => void;
  isSubmitting?: boolean;
  initialData?: {
    scores?: Partial<EvaluationScores>;
    comments?: Partial<EvaluationComments>;
  };
}

export default function ComprehensiveEvaluationForm({
  onSubmit,
  isSubmitting = false,
  initialData,
}: ComprehensiveEvaluationFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [scores, setScores] = useState<EvaluationScores>(
    initialData?.scores || {
      japanese: { pronunciation: 0, vocabulary: 0, grammar: 0 },
      fluency: { speed: 0, pauses: 0, fillers: 0 },
      communication: { comprehension: 0, logic: 0, listening: 0 },
      interviewContent: { selfIntro: 0, motivation: 0, responses: 0 },
      overall: { businessManner: 0, potential: 0 },
    }
  );
  const [comments, setComments] = useState<EvaluationComments>(
    initialData?.comments || {
      strengths: "",
      improvements: "",
      advice: "",
      encouragement: "",
    }
  );

  // Auto-save to localStorage
  useEffect(() => {
    const autoSave = setInterval(() => {
      const draft = { scores, comments, savedAt: new Date().toISOString() };
      localStorage.setItem("evaluation-draft", JSON.stringify(draft));
      console.log("Auto-saved draft");
    }, 30000); // Every 30 seconds

    return () => clearInterval(autoSave);
  }, [scores, comments]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("evaluation-draft");
    if (savedDraft && !initialData) {
      const draft = JSON.parse(savedDraft);
      setScores(draft.scores);
      setComments(draft.comments);
    }
  }, []);

  const sections = [
    {
      key: "japanese",
      title: "日本語能力",
      icon: "🗣️",
      items: [
        {
          key: "pronunciation",
          label: "発音・イントネーション",
          description: "聞き取りやすい明瞭な発音か",
          tooltip: {
            5: "非常に明瞭で自然な発音",
            4: "概ね聞き取りやすい",
            3: "通じるが改善の余地あり",
            2: "聞き取りにくい箇所が多い",
            1: "理解が困難",
          },
        },
        {
          key: "vocabulary",
          label: "語彙・表現力",
          description: "適切な語彙を使用できているか",
          tooltip: {
            5: "豊富で適切な語彙を使用",
            4: "基本的な語彙は十分",
            3: "やや限られているが通じる",
            2: "語彙不足が目立つ",
            1: "語彙が非常に限定的",
          },
        },
        {
          key: "grammar",
          label: "文法・正確性",
          description: "文法的に正しい日本語を使えているか",
          tooltip: {
            5: "ほぼ完璧な文法",
            4: "小さなミスがあるが問題なし",
            3: "ミスはあるが意味は通じる",
            2: "文法ミスが多い",
            1: "文法が理解できていない",
          },
        },
      ],
    },
    {
      key: "fluency",
      title: "流暢さ",
      icon: "💫",
      items: [
        {
          key: "speed",
          label: "話すスピード",
          description: "適切な速さで話せているか",
          tooltip: {
            5: "完璧なペース配分",
            4: "概ね適切なスピード",
            3: "やや速い/遅いが通じる",
            2: "スピードに問題あり",
            1: "極端に速い/遅い",
          },
        },
        {
          key: "pauses",
          label: "間の取り方",
          description: "自然な間で話せているか",
          tooltip: {
            5: "非常に自然な間",
            4: "適切な間を取れる",
            3: "時々不自然な間がある",
            2: "間の取り方に課題",
            1: "間が全く取れない",
          },
        },
        {
          key: "fillers",
          label: "フィラーワード",
          description: "「えっと」「あの」等の少なさ",
          tooltip: {
            5: "ほとんど使用なし",
            4: "たまに使用する程度",
            3: "やや多いが許容範囲",
            2: "頻繁に使用",
            1: "非常に多用",
          },
        },
      ],
    },
    {
      key: "communication",
      title: "コミュニケーション能力",
      icon: "💬",
      items: [
        {
          key: "comprehension",
          label: "理解力",
          description: "質問の意図を正確に理解できているか",
          tooltip: {
            5: "完璧な理解",
            4: "ほぼ正確に理解",
            3: "基本的には理解できる",
            2: "理解に時間がかかる",
            1: "理解が困難",
          },
        },
        {
          key: "logic",
          label: "論理性",
          description: "論理的に話を展開できているか",
          tooltip: {
            5: "非常に論理的",
            4: "概ね論理的",
            3: "基本的な論理性はある",
            2: "論理が飛躍している",
            1: "論理性が欠如",
          },
        },
        {
          key: "listening",
          label: "傾聴力",
          description: "相手の話を聞く姿勢があるか",
          tooltip: {
            5: "優れた傾聴力",
            4: "しっかり聞いている",
            3: "基本的には聞いている",
            2: "聞く姿勢が弱い",
            1: "傾聴できていない",
          },
        },
      ],
    },
    {
      key: "interviewContent",
      title: "面接内容",
      icon: "📝",
      items: [
        {
          key: "selfIntro",
          label: "自己紹介",
          description: "効果的な自己紹介ができているか",
          tooltip: {
            5: "非常に印象的",
            4: "良い自己紹介",
            3: "標準的",
            2: "やや物足りない",
            1: "不十分",
          },
        },
        {
          key: "motivation",
          label: "志望動機",
          description: "明確な動機を伝えられているか",
          tooltip: {
            5: "非常に説得力がある",
            4: "明確で具体的",
            3: "一応理解できる",
            2: "やや不明確",
            1: "不明瞭",
          },
        },
        {
          key: "responses",
          label: "質問への回答",
          description: "適切で具体的な回答ができているか",
          tooltip: {
            5: "優れた回答",
            4: "適切な回答",
            3: "標準的な回答",
            2: "やや不適切",
            1: "不適切",
          },
        },
      ],
    },
    {
      key: "overall",
      title: "総合評価",
      icon: "⭐",
      items: [
        {
          key: "businessManner",
          label: "ビジネスマナー",
          description: "社会人として適切なマナーがあるか",
          tooltip: {
            5: "完璧なマナー",
            4: "良好なマナー",
            3: "標準的なマナー",
            2: "改善が必要",
            1: "マナーに問題あり",
          },
        },
        {
          key: "potential",
          label: "成長可能性",
          description: "今後の成長が期待できるか",
          tooltip: {
            5: "非常に高いポテンシャル",
            4: "高いポテンシャル",
            3: "標準的なポテンシャル",
            2: "やや低い",
            1: "改善が必要",
          },
        },
      ],
    },
  ];

  const isCommentSection = currentSection === sections.length;

  const handleScoreChange = (sectionKey: string, itemKey: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey as keyof EvaluationScores],
        [itemKey]: value,
      },
    }));
  };

  const isSectionComplete = (sectionKey: string) => {
    const section = scores[sectionKey as keyof EvaluationScores];
    return Object.values(section).every((score) => score > 0);
  };

  const areAllSectionsComplete = () => {
    return sections.every((section) => isSectionComplete(section.key));
  };

  const areCommentsComplete = () => {
    return (
      comments.strengths.length >= 50 &&
      comments.improvements.length >= 50 &&
      comments.advice.length >= 100 &&
      comments.encouragement.length >= 50
    );
  };

  const calculateAverage = () => {
    const allScores = Object.values(scores).flatMap((section) => Object.values(section));
    const total = allScores.reduce((sum, score) => sum + score, 0);
    return allScores.length > 0 ? (total / allScores.length).toFixed(1) : "0.0";
  };

  const handleNext = () => {
    if (currentSection < sections.length) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    if (areAllSectionsComplete() && areCommentsComplete()) {
      onSubmit(scores, comments);
      localStorage.removeItem("evaluation-draft");
    }
  };

  const saveDraft = () => {
    const draft = { scores, comments, savedAt: new Date().toISOString() };
    localStorage.setItem("evaluation-draft", JSON.stringify(draft));
    alert("下書きを保存しました");
  };

  const sectionTitles = [...sections.map((s) => s.title), "コメント"];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <ProgressIndicator
        currentSection={currentSection}
        totalSections={sections.length + 1}
        sectionTitles={sectionTitles}
      />

      {/* Average Score Display */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">現在の平均スコア</p>
            <p className="text-4xl font-bold">{calculateAverage()} / 5.0</p>
          </div>
          <div className="text-5xl">📊</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {!isCommentSection ? (
          // Score Section
          <>
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4">{sections[currentSection].icon}</span>
              <h2 className="text-2xl font-bold text-gray-900">
                {sections[currentSection].title}
              </h2>
            </div>

            {sections[currentSection].items.map((item) => (
              <ScoreItem
                key={item.key}
                label={item.label}
                description={item.description}
                value={
                  scores[sections[currentSection].key as keyof EvaluationScores][
                    item.key as keyof typeof scores.japanese
                  ]
                }
                onChange={(value) =>
                  handleScoreChange(sections[currentSection].key, item.key, value)
                }
                tooltip={item.tooltip}
              />
            ))}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentSection === 0}
                leftIcon={<span>←</span>}
              >
                前のセクション
              </Button>

              <Button onClick={saveDraft} variant="ghost">
                💾 下書き保存
              </Button>

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!isSectionComplete(sections[currentSection].key)}
                rightIcon={<span>→</span>}
              >
                次のセクション
              </Button>
            </div>
          </>
        ) : (
          // Comment Section
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              詳細フィードバック
            </h2>

            {/* Strengths */}
            <div className="mb-6">
              <label className="block mb-2">
                <span className="text-lg font-semibold flex items-center">
                  <span className="mr-2">👍</span>
                  良かった点
                  <span className="ml-2 text-red-500">*</span>
                </span>
                <span className="text-sm text-gray-600">最低50文字</span>
              </label>
              <textarea
                value={comments.strengths}
                onChange={(e) => setComments({ ...comments, strengths: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="面接で良かった点を具体的に記述してください"
              />
              <p className="text-sm text-gray-500 mt-1">
                {comments.strengths.length} / 50文字
              </p>
            </div>

            {/* Improvements */}
            <div className="mb-6">
              <label className="block mb-2">
                <span className="text-lg font-semibold flex items-center">
                  <span className="mr-2">💡</span>
                  改善すべき点
                  <span className="ml-2 text-red-500">*</span>
                </span>
                <span className="text-sm text-gray-600">最低50文字</span>
              </label>
              <textarea
                value={comments.improvements}
                onChange={(e) => setComments({ ...comments, improvements: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="改善が必要な点を前向きな表現で記述してください"
              />
              <p className="text-sm text-gray-500 mt-1">
                {comments.improvements.length} / 50文字
              </p>
            </div>

            {/* Advice */}
            <div className="mb-6">
              <label className="block mb-2">
                <span className="text-lg font-semibold flex items-center">
                  <span className="mr-2">📝</span>
                  具体的なアドバイス
                  <span className="ml-2 text-red-500">*</span>
                </span>
                <span className="text-sm text-gray-600">最低100文字</span>
              </label>
              <textarea
                value={comments.advice}
                onChange={(e) => setComments({ ...comments, advice: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="今後の成長に向けた、実践的で具体的なアドバイスを記述してください"
              />
              <p className="text-sm text-gray-500 mt-1">
                {comments.advice.length} / 100文字
              </p>
            </div>

            {/* PROMINENT Encouragement Message */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border-4 border-orange-300 shadow-lg mb-6">
              <label className="block mb-4">
                <span className="text-2xl font-bold flex items-center text-orange-900">
                  <span className="mr-3 text-4xl">🌟</span>
                  応援メッセージ
                  <span className="ml-3 text-red-600 text-2xl">*</span>
                </span>
                <span className="text-sm text-orange-700 block mt-2">
                  候補者を励まし、モチベーションを高める温かいメッセージをお願いします（最低50文字）
                </span>
              </label>
              <div className="bg-white rounded-lg p-1 shadow-inner">
                <textarea
                  value={comments.encouragement}
                  onChange={(e) => setComments({ ...comments, encouragement: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                  placeholder="例: 本日は面接お疲れ様でした！日本語学習への真摯な姿勢と、仕事に対する熱意が強く伝わってきました。まだ改善の余地はありますが、確実に成長されています。失敗を恐れず、どんどん挑戦していってください。あなたの努力は必ず実を結びます。応援しています！"
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className={`text-sm font-bold ${comments.encouragement.length >= 50 ? "text-green-600" : "text-red-600"}`}>
                  {comments.encouragement.length >= 50 ? "✓ " : "⚠️ "}
                  {comments.encouragement.length} / 50文字
                </p>
              </div>
              <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                <p className="text-xs text-orange-900">
                  💡 <strong>重要:</strong> この応援メッセージは候補者のモチベーションと成長に大きく影響します。具体的に良かった点を挙げ、候補者の努力を認め、前向きな言葉で締めくくりましょう。
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                leftIcon={<span>←</span>}
              >
                スコア入力に戻る
              </Button>

              <Button onClick={saveDraft} variant="ghost">
                💾 下書き保存
              </Button>

              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!areAllSectionsComplete() || !areCommentsComplete() || isSubmitting}
                isLoading={isSubmitting}
                size="lg"
              >
                評価を提出する
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
