/**
 * Personalized Improvement Suggestions Generator
 *
 * Generates encouraging and actionable suggestions based on
 * fluency analysis results.
 */

interface AnalysisMetrics {
  speechRate: number;
  pauseFrequency: number;
  fillerCount: number;
  totalDuration: number;
  overallScore: number; // 0-100 scale
}

interface Suggestion {
  category: string;
  icon: string;
  title: string;
  description: string;
  tips: string[];
  priority: "high" | "medium" | "low";
}

/**
 * Generate personalized suggestions based on analysis results
 */
export function generateSuggestions(metrics: AnalysisMetrics): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const scoreOn5Scale = metrics.overallScore / 20;
  const fillersPerMinute = (metrics.fillerCount / metrics.totalDuration) * 60;

  // Speech Rate Suggestions
  if (metrics.speechRate < 2.8) {
    suggestions.push({
      category: "発話速度",
      icon: "🗣️",
      title: "発話速度を上げましょう",
      description:
        "現在の発話速度が少しゆっくりすぎます。もう少し速く話すことで、より自然な会話になります。",
      tips: [
        "音読練習を毎日10分間行いましょう",
        "ニュースアナウンサーの話し方を真似してみましょう",
        "タイマーを使って、決められた時間内で話す練習をしましょう",
        "録音して自分の話すペースを確認しましょう",
      ],
      priority: "high",
    });
  } else if (metrics.speechRate > 3.8) {
    suggestions.push({
      category: "発話速度",
      icon: "🐢",
      title: "少しゆっくり話しましょう",
      description:
        "発話速度が速すぎると、聞き手が理解しにくくなります。意識的にペースを落としましょう。",
      tips: [
        "重要な単語の後に、短いポーズを入れましょう",
        "深呼吸をしてから話し始めましょう",
        "話す内容を事前に整理しておきましょう",
        "聞き手の反応を確認しながら話しましょう",
      ],
      priority: "high",
    });
  } else if (metrics.speechRate >= 2.8 && metrics.speechRate < 3.0) {
    suggestions.push({
      category: "発話速度",
      icon: "👍",
      title: "発話速度は良好です",
      description:
        "良いペースで話せています。この調子で練習を続けましょう。",
      tips: [
        "現在のペースを維持しましょう",
        "様々なトピックで練習してみましょう",
        "緊張した場面でも同じペースを保てるよう練習しましょう",
      ],
      priority: "low",
    });
  }

  // Pause Frequency Suggestions
  if (metrics.pauseFrequency < 6) {
    suggestions.push({
      category: "ポーズの使い方",
      icon: "⏸️",
      title: "適度なポーズを入れましょう",
      description:
        "ポーズが少なすぎると、聞き手が情報を処理する時間がありません。意識的にポーズを入れましょう。",
      tips: [
        "文の区切りで1秒程度のポーズを入れましょう",
        "重要なポイントの前後でポーズを入れましょう",
        "呼吸のタイミングでポーズを入れましょう",
        "質問に答える前に、考える時間を取りましょう",
      ],
      priority: "medium",
    });
  } else if (metrics.pauseFrequency > 12) {
    suggestions.push({
      category: "ポーズの使い方",
      icon: "⏩",
      title: "ポーズを減らしましょう",
      description:
        "ポーズが多すぎると、不自然に聞こえます。もう少しスムーズに話しましょう。",
      tips: [
        "事前に話す内容を準備しておきましょう",
        "よく使うフレーズを暗記しましょう",
        "自信を持って話すよう心がけましょう",
        "リラックスして、自然体で話しましょう",
      ],
      priority: "medium",
    });
  } else {
    suggestions.push({
      category: "ポーズの使い方",
      icon: "✨",
      title: "ポーズの使い方が上手です",
      description:
        "適切なタイミングでポーズを入れられています。聞きやすい話し方です。",
      tips: [
        "現在のバランスを維持しましょう",
        "状況に応じてポーズの長さを調整しましょう",
      ],
      priority: "low",
    });
  }

  // Filler Word Suggestions
  if (fillersPerMinute > 2.0) {
    suggestions.push({
      category: "フィラーワード",
      icon: "💬",
      title: "フィラーワードを減らしましょう",
      description:
        "「あの」「えっと」などのフィラーワードが多いです。これを減らすと、より流暢に聞こえます。",
      tips: [
        "自分の録音を聞いて、どんなフィラーをよく使うか確認しましょう",
        "フィラーの代わりに短いポーズを入れましょう",
        "事前に話す内容を整理しておきましょう",
        "ゆっくり話して、考える時間を作りましょう",
        "「えっと」と言いそうになったら、深呼吸しましょう",
      ],
      priority: "high",
    });
  } else if (fillersPerMinute > 1.0) {
    suggestions.push({
      category: "フィラーワード",
      icon: "🎯",
      title: "フィラーワードをもう少し減らしましょう",
      description:
        "フィラーワードの使用は平均的ですが、さらに減らすことで印象が良くなります。",
      tips: [
        "話す前に一呼吸置きましょう",
        "よく使う表現を練習しておきましょう",
        "自信を持って話すよう心がけましょう",
      ],
      priority: "medium",
    });
  } else {
    suggestions.push({
      category: "フィラーワード",
      icon: "🌟",
      title: "フィラーワードの使用が少ないです",
      description:
        "フィラーワードをほとんど使わずに話せています。素晴らしいです！",
      tips: [
        "この良い習慣を維持しましょう",
        "緊張する場面でも同じように話せるよう練習しましょう",
      ],
      priority: "low",
    });
  }

  // Overall Performance Suggestions
  if (scoreOn5Scale >= 4.0) {
    suggestions.push({
      category: "総合評価",
      icon: "🏆",
      title: "素晴らしい流暢性です！",
      description:
        "非常に高いレベルの日本語流暢性を持っています。この調子で頑張りましょう！",
      tips: [
        "ビジネス用語や専門用語の練習も取り入れましょう",
        "様々なシチュエーションでの会話練習をしましょう",
        "他の学習者にアドバイスしてあげましょう",
      ],
      priority: "low",
    });
  } else if (scoreOn5Scale >= 3.0) {
    suggestions.push({
      category: "総合評価",
      icon: "📈",
      title: "着実に上達しています",
      description:
        "良いレベルに達しています。継続的な練習で、さらに向上できます。",
      tips: [
        "毎日15分の音読練習を続けましょう",
        "日本人との会話機会を増やしましょう",
        "自分の話し方を録音して、定期的に確認しましょう",
        "興味のあるトピックで話す練習をしましょう",
      ],
      priority: "medium",
    });
  } else if (scoreOn5Scale >= 2.0) {
    suggestions.push({
      category: "総合評価",
      icon: "💪",
      title: "練習を続けましょう",
      description:
        "改善の余地がありますが、諦めないでください。練習すれば必ず上達します。",
      tips: [
        "シャドーイング練習を毎日10分行いましょう",
        "簡単なトピックから始めて、徐々に難易度を上げましょう",
        "日本語のポッドキャストを聞きましょう",
        "言語交換パートナーを見つけましょう",
        "基本的な文型を繰り返し練習しましょう",
      ],
      priority: "high",
    });
  } else {
    suggestions.push({
      category: "総合評価",
      icon: "🌱",
      title: "基礎から丁寧に学びましょう",
      description:
        "まだ発展途上ですが、心配いりません。正しい方法で練習すれば、確実に上達します。",
      tips: [
        "基本的な会話文を暗記しましょう",
        "ゆっくりでも正確に話すことを優先しましょう",
        "毎日5分の音読から始めましょう",
        "日本語の教科書の音声を真似しましょう",
        "短い文から練習を始めましょう",
        "焦らず、一歩ずつ進みましょう",
      ],
      priority: "high",
    });
  }

  // Additional Practice Suggestions
  suggestions.push({
    category: "おすすめの練習方法",
    icon: "📚",
    title: "効果的な練習方法",
    description: "これらの練習方法を取り入れることで、さらに上達できます。",
    tips: [
      "毎日決まった時間に練習する習慣をつけましょう",
      "録音して自分の声を客観的に聞きましょう",
      "面接の想定質問を用意して、答える練習をしましょう",
      "日本語で独り言を言う習慣をつけましょう",
      "興味のあるトピックについて1分間話す練習をしましょう",
    ],
    priority: "medium",
  });

  // Sort by priority
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get encouragement message based on overall score
 */
export function getEncouragementMessage(overallScore: number): string {
  const scoreOn5Scale = overallScore / 20;

  if (scoreOn5Scale >= 4.5) {
    return "素晴らしい！あなたの日本語は非常に流暢です。自信を持って面接に臨んでください。";
  } else if (scoreOn5Scale >= 4.0) {
    return "とても良い結果です！少しの改善で、さらに印象が良くなります。";
  } else if (scoreOn5Scale >= 3.5) {
    return "良い結果です！改善点に取り組めば、すぐに上達できます。";
  } else if (scoreOn5Scale >= 3.0) {
    return "良いスタートです！継続的な練習で、着実に上達していきましょう。";
  } else if (scoreOn5Scale >= 2.5) {
    return "まだまだ伸びしろがあります！焦らず、一つずつ改善していきましょう。";
  } else if (scoreOn5Scale >= 2.0) {
    return "改善の余地はありますが、諦めないでください。練習すれば必ず上達します。";
  } else {
    return "これからです！基礎を固めて、少しずつ上達していきましょう。応援しています！";
  }
}

/**
 * Get next milestone based on current score
 */
export function getNextMilestone(
  overallScore: number
): {
  target: number;
  label: string;
  description: string;
} {
  const scoreOn5Scale = overallScore / 20;

  if (scoreOn5Scale >= 4.5) {
    return {
      target: 100,
      label: "完璧な流暢性",
      description: "ネイティブレベルの流暢性を目指しましょう",
    };
  } else if (scoreOn5Scale >= 4.0) {
    return {
      target: 90,
      label: "卓越した流暢性",
      description: "どんな状況でも自信を持って話せるレベル",
    };
  } else if (scoreOn5Scale >= 3.5) {
    return {
      target: 80,
      label: "優秀な流暢性",
      description: "ビジネスシーンで問題なく活躍できるレベル",
    };
  } else if (scoreOn5Scale >= 3.0) {
    return {
      target: 70,
      label: "良好な流暢性",
      description: "自然な会話ができるレベル",
    };
  } else if (scoreOn5Scale >= 2.5) {
    return {
      target: 60,
      label: "標準的な流暢性",
      description: "基本的なコミュニケーションができるレベル",
    };
  } else {
    return {
      target: 50,
      label: "基礎的な流暢性",
      description: "簡単な会話ができるレベル",
    };
  }
}
