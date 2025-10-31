import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/evaluation/draft/[interviewId]
 * Load existing draft
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { interviewId: string } }
) {
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

    const interviewId = params.interviewId;

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

    // TODO: Retrieve draft from database
    // For now, return null (client will use localStorage)
    return NextResponse.json({
      draft: null,
    });
  } catch (error) {
    console.error("Draft load error:", error);
    return NextResponse.json(
      { error: "下書きの読み込みに失敗しました" },
      { status: 500 }
    );
  }
}
