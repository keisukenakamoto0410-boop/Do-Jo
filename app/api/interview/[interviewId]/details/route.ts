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

    // Find the interview with all related data
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            japaneseLevel: true,
            profile: true,
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

    // Get candidate's latest resume
    const latestResume = await db.resume.findFirst({
      where: {
        userId: interview.candidateId,
        isLatest: true,
      },
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        uploadedAt: true,
      },
    });

    // Format response
    return NextResponse.json({
      success: true,
      interview: {
        id: interview.id,
        status: interview.status,
        scheduledAt: interview.scheduledAt,
        conductedAt: interview.conductedAt,
        videoUrl: interview.videoUrl,
        createdAt: interview.createdAt,
        candidate: {
          id: interview.candidate.id,
          name: interview.candidate.name,
          email: interview.candidate.email,
          japaneseLevel: interview.candidate.japaneseLevel,
          profile: interview.candidate.profile,
        },
        interviewer: {
          id: interview.interviewer.id,
          name: interview.interviewer.name,
          email: interview.interviewer.email,
        },
        slot: {
          jobCategory: interview.slot.jobCategory,
          startTime: interview.slot.startTime,
          endTime: interview.slot.endTime,
        },
        resume: latestResume,
        evaluation: interview.evaluation,
        fluencyAnalysis: interview.fluencyAnalysis
          ? {
              id: interview.fluencyAnalysis.id,
              speechRate: interview.fluencyAnalysis.speechRate,
              pauseFrequency: interview.fluencyAnalysis.pauseFrequency,
              fillerCount: interview.fluencyAnalysis.fillerCount,
              totalDuration: interview.fluencyAnalysis.totalDuration,
              overallScore: interview.fluencyAnalysis.overallScore,
              analyzedAt: interview.fluencyAnalysis.analyzedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Interview details fetch error:", error);
    return NextResponse.json(
      { error: "面接詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}
