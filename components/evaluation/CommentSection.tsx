"use client";

import { useState } from "react";
import Button from "../ui/Button";

export interface EvaluationComments {
  goodPoints: string;
  improvementPoints: string;
  advice: string;
  encouragementMessage: string;
}

interface CommentSectionProps {
  onSubmit: (comments: EvaluationComments) => void;
  onBack: () => void;
  isSubmitting?: boolean;
  initialData?: Partial<EvaluationComments>;
}

const MIN_LENGTHS = {
  goodPoints: 50,
  improvementPoints: 50,
  advice: 100,
  encouragementMessage: 50,
};

export default function CommentSection({
  onSubmit,
  onBack,
  isSubmitting = false,
  initialData,
}: CommentSectionProps) {
  const [comments, setComments] = useState<EvaluationComments>(
    initialData || {
      goodPoints: "",
      improvementPoints: "",
      advice: "",
      encouragementMessage: "",
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof EvaluationComments, string>>>({});

  const handleChange = (field: keyof EvaluationComments, value: string) => {
    setComments((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EvaluationComments, string>> = {};

    if (comments.goodPoints.length < MIN_LENGTHS.goodPoints) {
      newErrors.goodPoints = `最低${MIN_LENGTHS.goodPoints}文字必要です（現在: ${comments.goodPoints.length}文字）`;
    }

    if (comments.improvementPoints.length < MIN_LENGTHS.improvementPoints) {
      newErrors.improvementPoints = `最低${MIN_LENGTHS.improvementPoints}文字必要です（現在: ${comments.improvementPoints.length}文字）`;
    }

    if (comments.advice.length < MIN_LENGTHS.advice) {
      newErrors.advice = `最低${MIN_LENGTHS.advice}文字必要です（現在: ${comments.advice.length}文字）`;
    }

    if (comments.encouragementMessage.length < MIN_LENGTHS.encouragementMessage) {
      newErrors.encouragementMessage = `最低${MIN_LENGTHS.encouragementMessage}文字必要です（現在: ${comments.encouragementMessage.length}文字）`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(comments);
    }
  };

  const getCharCountColor = (current: number, min: number) => {
    if (current >= min) return "text-green-600";
    if (current >= min * 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            詳細フィードバック
          </h2>
          <p className="text-gray-600">
            候補者の成長に役立つ、具体的で建設的なフィードバックをお願いします
          </p>
        </div>

        <div className="space-y-8">
          {/* Good Points */}
          <div>
            <label className="block mb-2">
              <span className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">👍</span>
                良かった点
                <span className="ml-2 text-red-500">*</span>
              </span>
              <span className="text-sm text-gray-600">
                面接で良かった点、優れていた点を具体的に記述してください
              </span>
            </label>
            <textarea
              value={comments.goodPoints}
              onChange={(e) => handleChange("goodPoints", e.target.value)}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.goodPoints ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="例: 日本語の発音が非常に明瞭で、文法的にも正確な表現ができていました。特に敬語の使い方が適切で、ビジネスシーンでも問題なく活躍できるレベルです。また、質問に対して具体例を用いて説明する姿勢が素晴らしかったです。"
            />
            <div className="flex items-center justify-between mt-2">
              {errors.goodPoints ? (
                <p className="text-sm text-red-600">{errors.goodPoints}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  最低{MIN_LENGTHS.goodPoints}文字
                </p>
              )}
              <p
                className={`text-sm font-medium ${getCharCountColor(
                  comments.goodPoints.length,
                  MIN_LENGTHS.goodPoints
                )}`}
              >
                {comments.goodPoints.length}文字
              </p>
            </div>
          </div>

          {/* Improvement Points */}
          <div>
            <label className="block mb-2">
              <span className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">💡</span>
                改善すべき点
                <span className="ml-2 text-red-500">*</span>
              </span>
              <span className="text-sm text-gray-600">
                改善が必要な点を、前向きな表現で記述してください
              </span>
            </label>
            <textarea
              value={comments.improvementPoints}
              onChange={(e) => handleChange("improvementPoints", e.target.value)}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.improvementPoints ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="例: 緊張からか、時々「えっと」「あの」などのフィラーワードが多くなる傾向がありました。ゆっくり話すことを意識すると、より落ち着いた印象になります。また、自己PRの際にもう少し具体的な成果や数字を交えると、説得力が増すでしょう。"
            />
            <div className="flex items-center justify-between mt-2">
              {errors.improvementPoints ? (
                <p className="text-sm text-red-600">{errors.improvementPoints}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  最低{MIN_LENGTHS.improvementPoints}文字
                </p>
              )}
              <p
                className={`text-sm font-medium ${getCharCountColor(
                  comments.improvementPoints.length,
                  MIN_LENGTHS.improvementPoints
                )}`}
              >
                {comments.improvementPoints.length}文字
              </p>
            </div>
          </div>

          {/* Advice */}
          <div>
            <label className="block mb-2">
              <span className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📝</span>
                具体的なアドバイス
                <span className="ml-2 text-red-500">*</span>
              </span>
              <span className="text-sm text-gray-600">
                今後の成長に向けた、実践的で具体的なアドバイスを記述してください
              </span>
            </label>
            <textarea
              value={comments.advice}
              onChange={(e) => handleChange("advice", e.target.value)}
              rows={8}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.advice ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="例: 次の面接に向けて、以下の練習をお勧めします。&#10;1. 毎日10分、音読練習を行い、フィラーワードを減らす意識をつけましょう。&#10;2. 自己PRを1分、3分、5分の3パターンで準備し、時間に応じて調整できるようにしましょう。&#10;3. 想定質問リストを作成し、それぞれに対して具体的なエピソードを準備しておきましょう。&#10;4. 録音や録画を活用して、自分の話し方を客観的に確認する習慣をつけましょう。"
            />
            <div className="flex items-center justify-between mt-2">
              {errors.advice ? (
                <p className="text-sm text-red-600">{errors.advice}</p>
              ) : (
                <p className="text-sm text-gray-500">最低{MIN_LENGTHS.advice}文字</p>
              )}
              <p
                className={`text-sm font-medium ${getCharCountColor(
                  comments.advice.length,
                  MIN_LENGTHS.advice
                )}`}
              >
                {comments.advice.length}文字
              </p>
            </div>
          </div>

          {/* Encouragement Message - SPECIAL STYLING */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border-2 border-orange-200">
            <label className="block mb-3">
              <span className="text-xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">🌟</span>
                応援メッセージ
                <span className="ml-2 text-red-500">*</span>
              </span>
              <span className="text-sm text-gray-600 block mt-1">
                候補者を励まし、モチベーションを高める温かいメッセージをお願いします
              </span>
            </label>
            <div className="bg-white rounded-lg p-1">
              <textarea
                value={comments.encouragementMessage}
                onChange={(e) => handleChange("encouragementMessage", e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.encouragementMessage ? "border-red-500" : "border-orange-200"
                }`}
                placeholder="例: 本日は面接お疲れ様でした！日本語学習への真摯な姿勢と、仕事に対する熱意が強く伝わってきました。まだ改善の余地はありますが、確実に成長されています。失敗を恐れず、どんどん挑戦していってください。あなたの努力は必ず実を結びます。次の面接でお会いできることを楽しみにしています。応援しています！"
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              {errors.encouragementMessage ? (
                <p className="text-sm text-red-600 font-medium">
                  {errors.encouragementMessage}
                </p>
              ) : (
                <p className="text-sm text-orange-700 font-medium">
                  ⚠️ 最低{MIN_LENGTHS.encouragementMessage}文字（必須）
                </p>
              )}
              <p
                className={`text-sm font-bold ${getCharCountColor(
                  comments.encouragementMessage.length,
                  MIN_LENGTHS.encouragementMessage
                )}`}
              >
                {comments.encouragementMessage.length}文字
              </p>
            </div>
            <div className="mt-3 p-3 bg-orange-100 rounded-lg">
              <p className="text-xs text-orange-900">
                💡 <strong>ヒント:</strong> 具体的に良かった点を挙げ、候補者の努力を認め、前向きな言葉で締めくくりましょう。このメッセージは候補者の成長とモチベーションに大きく影響します。
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={onBack} leftIcon={<span>←</span>}>
            スコア入力に戻る
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            size="lg"
          >
            評価を提出する
          </Button>
        </div>
      </div>
    </div>
  );
}
