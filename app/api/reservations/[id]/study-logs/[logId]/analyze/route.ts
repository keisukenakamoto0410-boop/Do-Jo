import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// Lazy initialize OpenAI client to avoid build errors when API key is not set
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// POST - Analyze a study log image with AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId, logId } = await params;

    // Get the study log
    const studyLog = await prisma.studyLog.findUnique({
      where: { id: logId },
      include: { reservation: true },
    });

    if (!studyLog) {
      return NextResponse.json({ error: "Study log not found" }, { status: 404 });
    }

    if (studyLog.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Return mock analysis for development
      const mockAnalysis = {
        session_id: reservationId,
        analyzed_at: new Date().toISOString(),
        extracted_data: {
          grammar_points: ["〜てしまう", "受身形", "使役形"],
          vocabulary: ["弊社", "調整", "確認", "承知", "依頼"],
          topic_category: studyLog.reservation.sessionType === "business" ? "Business" : "Daily Conversation",
          difficulty_level: "N3",
        },
        ai_generated_output: {
          suggested_questions: [
            "「〜てしまう」を使った文を作ってみましょう",
            "ビジネスメールでよく使う敬語を教えてください",
            "今週勉強した中で一番難しかった文法は何ですか？",
          ],
          learning_focus: "敬語表現と受身形の使い分けを練習しましょう",
          praise_comment: "素晴らしい学習記録ですね！文法の整理がとても上手です！ ✨",
        },
      };

      const updatedLog = await prisma.studyLog.update({
        where: { id: logId },
        data: { analysisResult: mockAnalysis },
      });

      return NextResponse.json(updatedLog);
    }

    // Real OpenAI analysis
    const openaiClient = getOpenAI();
    if (!openaiClient) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }
    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `この画像は日本語学習者のノートや教材です。以下を分析してJSON形式で返してください：

1. extracted_data:
   - grammar_points: 文法項目（例: "〜てしまう", "受身形"）配列で3-5個
   - vocabulary: 重要語彙（5-10個の配列）
   - topic_category: トピック（例: "Business", "Daily Conversation", "Interview", "Casual"）
   - difficulty_level: JLPTレベル（"N1", "N2", "N3", "N4", "N5"のいずれか）

2. ai_generated_output:
   - praise_comment: 励ましのコメント（日本語で1文、ポジティブに、絵文字を1つ含める）
   - suggested_questions: セッションで使える質問（日本語で2-3個の配列）
   - learning_focus: 学習の焦点（日本語で1文）

必ずJSON形式のみで返してください。他のテキストは含めないでください。`,
              },
              {
                type: "image_url",
                image_url: {
                  url: studyLog.imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      let analysisResult;

      try {
        // Parse the JSON response
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        // Fallback mock analysis
        analysisResult = {
          extracted_data: {
            grammar_points: ["文法項目1", "文法項目2"],
            vocabulary: ["語彙1", "語彙2", "語彙3"],
            topic_category: "General",
            difficulty_level: "N3",
          },
          ai_generated_output: {
            praise_comment: "良い学習記録ですね！📚",
            suggested_questions: ["今日学んだ文法を使って文を作ってみましょう"],
            learning_focus: "基礎的な文法と語彙の確認",
          },
        };
      }

      const fullAnalysis = {
        session_id: reservationId,
        analyzed_at: new Date().toISOString(),
        ...analysisResult,
      };

      const updatedLog = await prisma.studyLog.update({
        where: { id: logId },
        data: { analysisResult: fullAnalysis },
      });

      return NextResponse.json(updatedLog);
    } catch (openaiError) {
      console.error("OpenAI error:", openaiError);

      // Return mock analysis on error
      const fallbackAnalysis = {
        session_id: reservationId,
        analyzed_at: new Date().toISOString(),
        extracted_data: {
          grammar_points: ["文法分析中"],
          vocabulary: ["語彙分析中"],
          topic_category: "分析中",
          difficulty_level: "N3",
        },
        ai_generated_output: {
          suggested_questions: ["今日はどんな勉強をしましたか？"],
          learning_focus: "会話練習を頑張りましょう",
          praise_comment: "学習お疲れさまです！✨",
        },
      };

      const updatedLog = await prisma.studyLog.update({
        where: { id: logId },
        data: { analysisResult: fallbackAnalysis },
      });

      return NextResponse.json(updatedLog);
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
