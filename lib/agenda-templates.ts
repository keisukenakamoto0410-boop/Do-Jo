// lib/agenda-templates.ts
// 完全無料のテンプレートベースアジェンダシステム

interface AgendaTemplate {
  topic: string;
  topicJa: string;
  conversationFlow: {
    phase: string;
    duration: string;
    suggestions: string[];
  }[];
  keyPhrases: string[];
  tips: string[];
}

export const AGENDA_TEMPLATES: Record<string, AgendaTemplate> = {
  daily_conversation: {
    topic: "Daily Conversation",
    topicJa: "日常会話",
    conversationFlow: [
      {
        phase: "ウォームアップ",
        duration: "5分",
        suggestions: [
          "今日はどんな一日でしたか？",
          "週末は何をしましたか？",
          "最近、楽しかったことは何ですか？",
        ],
      },
      {
        phase: "メイントーク",
        duration: "15分",
        suggestions: [
          "{country}の日常生活について教えてください",
          "日本の生活と違うところはありますか？",
          "一番驚いたことや面白いと思ったことは？",
          "普段どんな趣味を楽しんでいますか？",
        ],
      },
      {
        phase: "単語練習",
        duration: "3分",
        suggestions: [
          "学習者が選んだ単語を使って短い文を作ってみましょう",
          "実際の会話で使えるシーンを一緒に考えましょう",
        ],
      },
      {
        phase: "まとめ",
        duration: "2分",
        suggestions: [
          "今日学んだことを復習しましょう",
          "次回話したいことはありますか？",
        ],
      },
    ],
    keyPhrases: [
      "〜はどうですか？",
      "〜について教えてください",
      "〜と思います",
      "そうですね",
    ],
    tips: [
      "ゆっくり、はっきり話しましょう",
      "相手の国の文化に興味を示しましょう",
      "間違いを恐れず話すよう励ましましょう",
    ],
  },

  japanese_food: {
    topic: "Japanese Food Culture",
    topicJa: "日本の食文化",
    conversationFlow: [
      {
        phase: "ウォームアップ",
        duration: "5分",
        suggestions: [
          "日本食で好きなものはありますか？",
          "食べたことがある日本食を教えてください",
          "{country}の料理と似ているものはありますか？",
        ],
      },
      {
        phase: "メイントーク",
        duration: "15分",
        suggestions: [
          "おすすめの日本食を紹介しましょう",
          "日本の食事マナーについて話しましょう",
          "季節ごとの料理について説明しましょう",
          "居酒屋やレストランでの注文方法を教えましょう",
        ],
      },
      {
        phase: "単語練習",
        duration: "3分",
        suggestions: [
          "食べ物に関する単語を使って文を作りましょう",
          "レストランで使えるフレーズを練習しましょう",
        ],
      },
      {
        phase: "まとめ",
        duration: "2分",
        suggestions: [
          "今日紹介した料理を覚えていますか？",
          "次に食べてみたい日本食は何ですか？",
        ],
      },
    ],
    keyPhrases: [
      "〜を食べたことがありますか？",
      "〜はどんな味ですか？",
      "おすすめは〜です",
      "いただきます・ごちそうさま",
    ],
    tips: [
      "写真や絵を使うと分かりやすいです",
      "実際の体験談を話すと興味を持ってもらえます",
      "地元の食べ物についても聞いてみましょう",
    ],
  },

  travel: {
    topic: "Travel in Japan",
    topicJa: "日本旅行",
    conversationFlow: [
      {
        phase: "ウォームアップ",
        duration: "5分",
        suggestions: [
          "日本のどこに行ってみたいですか？",
          "すでに行ったことがある場所はありますか？",
          "どんな旅行が好きですか？（観光、自然、文化など）",
        ],
      },
      {
        phase: "メイントーク",
        duration: "15分",
        suggestions: [
          "おすすめの観光地を紹介しましょう",
          "日本の交通機関の使い方を教えましょう",
          "旅行で使える便利なフレーズを練習しましょう",
          "季節ごとのおすすめスポットを紹介しましょう",
        ],
      },
      {
        phase: "単語練習",
        duration: "3分",
        suggestions: [
          "旅行に関する単語を使って質問を作りましょう",
          "駅や空港で使えるフレーズを練習しましょう",
        ],
      },
      {
        phase: "まとめ",
        duration: "2分",
        suggestions: [
          "今日学んだ場所やフレーズを復習しましょう",
          "旅行の計画を立ててみましょう",
        ],
      },
    ],
    keyPhrases: [
      "〜へ行きたいです",
      "〜はどこにありますか？",
      "〜までどのくらいかかりますか？",
      "〜をください",
    ],
    tips: [
      "地図や写真を見せると分かりやすいです",
      "実際の旅行経験を共有しましょう",
      "交通ICカードの使い方も教えてあげましょう",
    ],
  },

  work: {
    topic: "Work & Business",
    topicJa: "仕事・ビジネス",
    conversationFlow: [
      {
        phase: "ウォームアップ",
        duration: "5分",
        suggestions: [
          "どんな仕事に興味がありますか？",
          "日本で働いてみたいですか？",
          "{country}と日本の働き方の違いは何だと思いますか？",
        ],
      },
      {
        phase: "メイントーク",
        duration: "15分",
        suggestions: [
          "日本の会社文化について説明しましょう",
          "ビジネスマナーやメールの書き方を教えましょう",
          "面接でよく聞かれる質問を練習しましょう",
          "敬語の使い方を簡単に説明しましょう",
        ],
      },
      {
        phase: "単語練習",
        duration: "3分",
        suggestions: [
          "ビジネスシーンで使う単語を練習しましょう",
          "自己紹介を日本語で作ってみましょう",
        ],
      },
      {
        phase: "まとめ",
        duration: "2分",
        suggestions: [
          "今日学んだビジネスマナーを復習しましょう",
          "次回、もっと詳しく知りたいことはありますか？",
        ],
      },
    ],
    keyPhrases: [
      "お世話になっております",
      "よろしくお願いします",
      "〜させていただきます",
      "失礼します",
    ],
    tips: [
      "実際のビジネス経験を共有しましょう",
      "敬語は徐々に教えるようにしましょう",
      "名刺交換の練習も役立ちます",
    ],
  },

  hobbies: {
    topic: "Hobbies & Entertainment",
    topicJa: "趣味・娯楽",
    conversationFlow: [
      {
        phase: "ウォームアップ",
        duration: "5分",
        suggestions: [
          "どんな趣味がありますか？",
          "休日は何をして過ごしますか？",
          "日本のアニメや漫画は好きですか？",
        ],
      },
      {
        phase: "メイントーク",
        duration: "15分",
        suggestions: [
          "日本の娯楽文化について紹介しましょう",
          "共通の趣味があれば詳しく話しましょう",
          "おすすめの映画、音楽、本などを教え合いましょう",
          "日本の伝統的な趣味も紹介しましょう",
        ],
      },
      {
        phase: "単語練習",
        duration: "3分",
        suggestions: [
          "趣味に関する単語を使って文を作りましょう",
          "「好き」「興味がある」などの表現を練習しましょう",
        ],
      },
      {
        phase: "まとめ",
        duration: "2分",
        suggestions: [
          "今日紹介し合った趣味を覚えていますか？",
          "新しく挑戦してみたいことはありますか？",
        ],
      },
    ],
    keyPhrases: [
      "〜が好きです",
      "〜に興味があります",
      "〜をやったことがあります",
      "おすすめは〜です",
    ],
    tips: [
      "共通の趣味を見つけると会話が盛り上がります",
      "相手の国の文化も聞いてみましょう",
      "実際に趣味を楽しんでいる写真を見せると良いです",
    ],
  },
};

/**
 * テンプレートから実際のアジェンダを生成
 */
export function generateAgendaFromTemplate(
  topicKey: string,
  learnerData: {
    name: string;
    country?: string;
    jlptLevel?: string;
    targetWords?: string[];
  }
): {
  topic: string;
  topicJa: string;
  conversationFlow: any[];
  targetWords: string[];
  keyPhrases: string[];
  tips: string[];
} {
  const template = AGENDA_TEMPLATES[topicKey] || AGENDA_TEMPLATES.daily_conversation;

  // プレースホルダーを置換
  const conversationFlow = template.conversationFlow.map((phase) => ({
    ...phase,
    suggestions: phase.suggestions.map((suggestion) =>
      suggestion.replace("{country}", learnerData.country || "あなたの国")
    ),
  }));

  return {
    topic: template.topic,
    topicJa: template.topicJa,
    conversationFlow,
    targetWords: learnerData.targetWords || [],
    keyPhrases: template.keyPhrases,
    tips: template.tips,
  };
}
