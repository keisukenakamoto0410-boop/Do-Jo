import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { interviewId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { interviewId } = params;

    // Find the interview
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            japaneseLevel: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slot: {
          select: {
            jobCategory: true,
            startTime: true,
            endTime: true,
          },
        },
        evaluation: true,
        fluencyAnalysis: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接が見つかりません" },
        { status: 404 }
      );
    }

    // Verify access permissions
    const isCandidate = interview.candidateId === session.user.id;
    const isInterviewer = interview.interviewerId === session.user.id;
    const isAdmin = session.user.userType === "ADMIN";

    if (!isCandidate && !isInterviewer && !isAdmin) {
      return NextResponse.json(
        { error: "この面接にアクセスする権限がありません" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        status: interview.status,
        scheduledAt: interview.scheduledAt,
        conductedAt: interview.conductedAt,
        videoUrl: interview.videoUrl,
        createdAt: interview.createdAt,
        candidate: interview.candidate,
        interviewer: interview.interviewer,
        slot: interview.slot,
        evaluation: interview.evaluation,
        fluencyAnalysis: interview.fluencyAnalysis,
      },
    });
  } catch (error) {
    console.error("Interview fetch error:", error);
    return NextResponse.json(
      { error: "面接情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
