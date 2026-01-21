import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// トピック名マッピング
const TOPIC_NAMES: Record<string, { en: string; ja: string }> = {
  daily_conversation: { en: "Daily Conversation", ja: "日常会話" },
  japanese_food: { en: "Japanese Food Culture", ja: "日本の食文化" },
  travel: { en: "Travel in Japan", ja: "日本旅行" },
  seasons: { en: "Japanese Seasons", ja: "日本の四季" },
  family_life: { en: "Family & Daily Life", ja: "家族と日常" },
  hobbies: { en: "Hobbies & Entertainment", ja: "趣味・娯楽" },
  shopping: { en: "Shopping", ja: "買い物" },
  history: { en: "Japanese History", ja: "日本の歴史" },
  work: { en: "Work & Business", ja: "仕事・ビジネス" },
  health: { en: "Health & Wellness", ja: "健康" },
};

// 文法パターンマッピング
const GRAMMAR_PATTERNS: Record<
  string,
  { pattern: string; meaning: string; examples: string[] }
> = {
  te_mo_ii_desu_ka: {
    pattern: "〜てもいいですか",
    meaning: "May I...?",
    examples: ["写真を撮ってもいいですか？", "ここに座ってもいいですか？"],
  },
  te_wa_ikemasen: {
    pattern: "〜てはいけません",
    meaning: "Must not...",
    examples: ["ここで写真を撮ってはいけません", "タバコを吸ってはいけません"],
  },
  tai_desu: {
    pattern: "〜たいです",
    meaning: "I want to...",
    examples: ["日本に行きたいです", "寿司を食べたいです"],
  },
  mashou: {
    pattern: "〜ましょう",
    meaning: "Let's...",
    examples: ["一緒に食べましょう", "写真を見ましょう"],
  },
  ta_koto_ga_aru: {
    pattern: "〜たことがあります",
    meaning: "Have done...",
    examples: ["富士山に登ったことがあります", "納豆を食べたことがあります"],
  },
  te_kudasai: {
    pattern: "〜てください",
    meaning: "Please do...",
    examples: ["ゆっくり話してください", "もう一度言ってください"],
  },
  te_imasu: {
    pattern: "〜ています",
    meaning: "Is doing... / State",
    examples: ["日本語を勉強しています", "東京に住んでいます"],
  },
  basic_desu: {
    pattern: "〜です/ます",
    meaning: "Polite form",
    examples: ["学生です", "日本語を話します"],
  },
  basic_question: {
    pattern: "〜ですか",
    meaning: "Question form",
    examples: ["日本人ですか？", "これは何ですか？"],
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 予約情報を取得
    const reservation = await db.reservation.findUnique({
      where: { id },
      include: {
        host: true,
        learner: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // 学習者の過去の会話履歴を取得（重複防止用）
    const conversationHistory = await db.conversationHistory.findMany({
      where: { learnerId: reservation.learnerId },
      orderBy: { date: "desc" },
      take: 10,
    });

    // トピック・文法情報を取得
    const topicInfo =
      TOPIC_NAMES[reservation.selectedTopic || "daily_conversation"];
    const grammarInfo = (reservation.grammarToStudy || [])
      .map((g) => GRAMMAR_PATTERNS[g])
      .filter(Boolean);

    // プロンプト構築
    const prompt = buildAgendaPrompt({
      learner: reservation.learner!,
      senior: reservation.host,
      topic: topicInfo,
      grammar: grammarInfo,
      conversationHistory,
      goal: reservation.conversationGoal,
      notes: reservation.additionalNotes,
      progress: reservation.progressSinceLastSession,
    });

    // Claude APIでアジェンダ生成
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // レスポンスからJSONを抽出
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    let agenda;
    try {
      // JSONブロックを抽出
      const jsonMatch = content.text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        agenda = JSON.parse(jsonMatch[1]);
      } else {
        agenda = JSON.parse(content.text);
      }
    } catch (parseError) {
      console.error("Failed to parse agenda JSON:", content.text);
      throw new Error("Failed to parse agenda");
    }

    // アジェンダを予約に保存
    await db.reservation.update({
      where: { id },
      data: { generatedAgenda: agenda },
    });

    return NextResponse.json({ agenda });
  } catch (error) {
    console.error("Agenda generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate agenda", details: errorMessage },
      { status: 500 }
    );
  }
}

// プロンプト構築関数
function buildAgendaPrompt(data: {
  learner: any;
  senior: any;
  topic: { en: string; ja: string };
  grammar: { pattern: string; meaning: string; examples: string[] }[];
  conversationHistory: any[];
  goal: string | null;
  notes: string | null;
  progress: string | null;
}) {
  const {
    learner,
    senior,
    topic,
    grammar,
    conversationHistory,
    goal,
    notes,
    progress,
  } = data;

  // 過去のトピックリスト（重複防止用）
  const pastTopics =
    conversationHistory.map((h) => h.topic).join(", ") || "なし";

  return `あなたは日本語学習者向けの会話アジェンダを作成するアシスタントです。

【学習者情報】
- 名前: ${learner.name}
- レベル: ${learner.jlptLevel || "N4"}
- 教科書: ${learner.textbook || "不明"}
- 現在の課: ${learner.currentLesson || "不明"}
- 出身国: ${learner.country || "不明"}

【今回の学習内容】
- 話したいトピック: ${topic.en}（${topic.ja}）
- 練習したい文法: ${grammar.map((g) => g.pattern).join("、") || "特になし"}
- 会話の目標: ${goal || "楽しく話したい"}
- 補足メモ: ${notes || "なし"}
- 前回からの進捗: ${progress || "初回"}

【会話相手（シニア）情報】
- 名前: ${senior.name}
- 都道府県: ${senior.prefecture || "不明"}
- 得意な話題: ${senior.expertiseTopics?.join("、") || "不明"}
- 話し方の特徴: ${senior.speakingStyle || "不明"}
- 趣味: ${senior.hobbies?.join("、") || "不明"}

【過去の会話履歴】※重複を避けるために参照
過去に話したトピック: ${pastTopics}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【指示】

以下のルールに従って、25分の会話アジェンダをJSON形式で作成してください：

1. **重複禁止**: 過去の会話履歴にあるトピックと全く同じ内容は避ける。同じカテゴリでも違う角度から話す。

2. **文法を必ず使う場面を入れる**: 練習したい文法を使う具体的な質問・フレーズを各3つ以上用意

3. **シニアの得意分野を活かす**: ${senior.name}さんの趣味・得意分野に関連する質問を入れる

4. **レベルに合わせた語彙**: ${learner.jlptLevel || "N4"}レベルの語彙を使用

5. **会話の流れ**:
   - 0-3分: 挨拶・最近の出来事
   - 3-12分: メイントピック（学習者が質問）
   - 12-20分: 学習者が自分のことを話す
   - 20-25分: シニアからの質問タイム

【出力形式】
以下のJSON形式で出力してください：

\`\`\`json
{
  "summary": {
    "topic": "トピック名",
    "topicJa": "トピック名（日本語）",
    "duration": 25,
    "seniorName": "シニアの名前",
    "mainGoal": "今回のメイン目標"
  },
  "sections": [
    {
      "name": "greeting",
      "nameJa": "挨拶",
      "duration": 3,
      "startTime": "0:00",
      "endTime": "3:00",
      "goal": "挨拶と最近の出来事を共有",
      "suggestedPhrases": [
        "お元気ですか？",
        "最近どうですか？"
      ],
      "tips": "リラックスして、笑顔で始めましょう"
    },
    {
      "name": "mainTopic",
      "nameJa": "メイントピック",
      "duration": 9,
      "startTime": "3:00",
      "endTime": "12:00",
      "goal": "シニアに質問してトピックについて学ぶ",
      "questions": [
        {
          "question": "質問文",
          "grammarUsed": "使用する文法パターン（あれば）",
          "hint": "質問のヒント"
        }
      ],
      "vocabulary": [
        {
          "word": "単語",
          "reading": "よみがな",
          "meaning": "English meaning"
        }
      ]
    },
    {
      "name": "learnerSharing",
      "nameJa": "自分のことを話す",
      "duration": 8,
      "startTime": "12:00",
      "endTime": "20:00",
      "goal": "自分の国や経験について話す",
      "prompts": [
        "私は〇〇が好きです",
        "私の国では〇〇です"
      ]
    },
    {
      "name": "seniorQuestions",
      "nameJa": "シニアからの質問",
      "duration": 5,
      "startTime": "20:00",
      "endTime": "25:00",
      "goal": "シニアからの質問に答える",
      "note": "リラックスして、わからなければ聞き返してOK"
    }
  ],
  "todaysGoals": [
    "「〜たいです」を3回以上使う",
    "旅行の語彙を5つ以上使う"
  ],
  "grammarFocus": [
    {
      "pattern": "文法パターン",
      "meaning": "意味",
      "examplesForToday": [
        "今日使える例文1",
        "今日使える例文2"
      ]
    }
  ],
  "usefulPhrases": [
    {
      "japanese": "もう一度言ってもいいですか？",
      "meaning": "Could you say that again?",
      "when": "聞き取れなかったとき"
    },
    {
      "japanese": "〇〇は日本語で何と言いますか？",
      "meaning": "How do you say 〇〇 in Japanese?",
      "when": "単語がわからないとき"
    }
  ],
  "seniorInfo": {
    "name": "${senior.name}",
    "strengths": "シニアの得意なことや話題",
    "conversationTips": "このシニアと話すときのコツ"
  }
}
\`\`\`

JSONのみを出力してください。説明は不要です。`;
}
