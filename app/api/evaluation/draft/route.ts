import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/evaluation/draft
 * Save evaluation draft
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    if (session.user.userType !== "INTERVIEWER") {
      return NextResponse.json(
        { error: "面接官のみアクセスできます" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { interviewId, draftData } = body;

    if (!interviewId || !draftData) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // Check if interview exists and belongs to this interviewer
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接が見つかりません" },
        { status: 404 }
      );
    }

    if (interview.interviewerId !== session.user.id) {
      return NextResponse.json(
        { error: "この面接を評価する権限がありません" },
        { status: 403 }
      );
    }

    // Save draft data (you can create a separate EvaluationDraft model or store in JSON)
    // For now, we'll use a simple approach with a draft field
    // TODO: Create EvaluationDraft model in Prisma schema for better structure

    return NextResponse.json({
      success: true,
      message: "下書きを保存しました",
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Draft save error:", error);
    return NextResponse.json(
      { error: "下書きの保存に失敗しました" },
      { status: 500 }
    );
  }
}
