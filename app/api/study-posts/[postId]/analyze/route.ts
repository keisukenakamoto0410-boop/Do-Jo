import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🤖 Starting AI analysis for post:", params.postId);

    // 投稿を取得
    const post = await prisma.studyPost.findUnique({
      where: { id: params.postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    console.log("📷 Analyzing image...");

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      throw new Error("AI service not configured");
    }

    // OpenAIクライアントを関数内で初期化（ビルド時エラー回避）
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // OpenAI Vision APIで画像を分析
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are analyzing a Japanese language learner's study notes.

Analyze this image and provide a detailed JSON response with the following structure:

{
  "extracted_data": {
    "grammar_points": ["list of grammar patterns found, e.g., 〜てしまう, 受身形"],
    "vocabulary": ["list of 8-12 important vocabulary words found"],
    "kanji": ["list of kanji characters found"],
    "topic_category": "main topic (e.g., Business, Daily Conversation, Interview)",
    "difficulty_level": "JLPT level (N5, N4, N3, N2, or N1)",
    "content_summary": "2-3 sentence summary of what the learner studied"
  },
  "ai_generated_output": {
    "praise_comment": "Encouraging 1-2 sentence comment in English about their study effort",
    "suggested_questions": [
      "3-4 natural conversation questions a Japanese host could ask to practice this content",
      "Questions should be in Japanese with English translation in parentheses"
    ],
    "learning_focus": "1 sentence describing the main learning objective",
    "conversation_scenarios": [
      "2-3 realistic scenarios where this content would be used"
    ]
  }
}

Be specific and detailed. Extract as much information as possible from the image.`,
            },
            {
              type: "image_url",
              image_url: {
                url: post.imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    console.log("✅ AI analysis complete");

    const content = response.choices[0].message.content;

    // JSONをパース
    let analysisResult;
    try {
      // JSONコードブロックから抽出
      const jsonMatch =
        content?.match(/```json\n([\s\S]*?)\n```/) ||
        content?.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      analysisResult = JSON.parse(jsonStr || "{}");
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // フォールバック
      analysisResult = {
        extracted_data: {
          grammar_points: ["Analysis in progress"],
          vocabulary: ["Content detected"],
          kanji: [],
          topic_category: "General Study",
          difficulty_level: "N3",
          content_summary: post.caption || "Study content uploaded",
        },
        ai_generated_output: {
          praise_comment: "Great work on your studies!",
          suggested_questions: ["What did you find most interesting?"],
          learning_focus: "Continue building your Japanese skills",
          conversation_scenarios: ["Daily conversation practice"],
        },
      };
    }

    // 分析結果をDBに保存
    const updatedPost = await prisma.studyPost.update({
      where: { id: params.postId },
      data: {
        analysisResult: {
          post_id: params.postId,
          analyzed_at: new Date().toISOString(),
          ...analysisResult,
        },
      },
    });

    console.log("💾 Analysis saved to database");

    return NextResponse.json({
      success: true,
      analysis: updatedPost.analysisResult,
    });
  } catch (error) {
    console.error("❌ AI analysis error:", error);

    // エラー時のフォールバック
    const fallbackAnalysis = {
      post_id: params.postId,
      analyzed_at: new Date().toISOString(),
      extracted_data: {
        grammar_points: ["Content analysis pending"],
        vocabulary: ["Study content detected"],
        kanji: [],
        topic_category: "General",
        difficulty_level: "N3",
        content_summary: "Your study content has been uploaded successfully",
      },
      ai_generated_output: {
        praise_comment: "Keep up the great work with your studies!",
        suggested_questions: ["Tell me about what you studied today"],
        learning_focus: "Building Japanese language skills",
        conversation_scenarios: ["General conversation practice"],
      },
    };

    // フォールバックをDBに保存
    await prisma.studyPost.update({
      where: { id: params.postId },
      data: {
        analysisResult: fallbackAnalysis,
      },
    });

    return NextResponse.json({
      success: true,
      analysis: fallbackAnalysis,
      warning: "Using fallback analysis due to API error",
    });
  }
}
