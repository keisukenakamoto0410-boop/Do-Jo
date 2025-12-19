import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId } = await context.params;

    // 予約と学習者のStudyPostを取得
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        learner: {
          select: {
            id: true,
            name: true,
            jlptLevel: true,
            learningGoal: true,
            interests: true,
            country: true,
            nativeLanguage: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    const learner = reservation.learner;

    // 学習者のStudyPostを取得
    const studyPosts = await prisma.studyPost.findMany({
      where: { userId: learner?.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        caption: true,
        analysisResult: true,
        createdAt: true,
      },
    });

    // StudyPostがない場合のデフォルト
    if (!studyPosts || studyPosts.length === 0) {
      return NextResponse.json({
        summary: "まだ学習投稿がありません",
        improvements: ["学習の習慣をつけることから始めましょう"],
        topics: ["日本での目標について", "日本語を学び始めたきっかけ", "好きな日本の文化"],
        questions: [
          "日本語を勉強し始めてどのくらいですか？",
          "日本で働きたい分野は何ですか？",
          "最近、日本語で難しいと感じることは何ですか？",
        ],
      });
    }

    // Claude APIで分析
    const anthropic = new Anthropic();

    const studyPostContent = studyPosts.map(post => {
      const analysis = post.analysisResult ? JSON.parse(JSON.stringify(post.analysisResult)) : null;
      return `【${post.createdAt.toLocaleDateString()}】
キャプション: ${post.caption || "なし"}
AI分析: ${analysis ? JSON.stringify(analysis) : "なし"}`;
    }).join("\n\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `あなたは日本語学習者をサポートするホスト（日本人）のためのアドバイザーです。

以下は学習者の情報と最近の学習投稿です：

【学習者情報】
- 名前: ${learner?.name}
- 出身国: ${learner?.country || "不明"}
- 母国語: ${learner?.nativeLanguage || "不明"}
- 日本語レベル: ${learner?.jlptLevel || "不明"}
- 学習目標: ${learner?.learningGoal || "不明"}
- 興味: ${learner?.interests ? JSON.stringify(learner.interests) : "不明"}

【最近の学習投稿】
${studyPostContent}

上記を分析し、以下のJSON形式で回答してください：
{
  "summary": "学習内容の要約（2-3文）",
  "improvements": ["改善ポイント1", "改善ポイント2", "改善ポイント3"],
  "topics": ["話すと良いトピック1", "話すと良いトピック2", "話すと良いトピック3"],
  "questions": ["質問例1", "質問例2", "質問例3"]
}

JSONのみを返してください。`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      try {
        const advisorData = JSON.parse(content.text);
        return NextResponse.json(advisorData);
      } catch {
        console.error("Failed to parse advisor response:", content.text);
        return NextResponse.json({
          summary: "分析結果の解析に失敗しました",
          improvements: ["もう一度お試しください"],
          topics: ["日本での目標について", "日本語学習について"],
          questions: ["日本語の勉強は順調ですか？"],
        });
      }
    }

    return NextResponse.json({ error: "Failed to generate advice" }, { status: 500 });
  } catch (error) {
    console.error("Advisor API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
