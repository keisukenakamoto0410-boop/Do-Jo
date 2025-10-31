import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeFluency } from "@/lib/analysis/fluency-analyzer";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { interviewId } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: "面接IDが必要です" },
        { status: 400 }
      );
    }

    // Find the interview
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        fluencyAnalysis: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接が見つかりません" },
        { status: 404 }
      );
    }

    // Check if video exists
    if (!interview.videoUrl) {
      return NextResponse.json(
        { error: "動画がアップロードされていません" },
        { status: 400 }
      );
    }

    // Check if analysis already exists
    if (interview.fluencyAnalysis) {
      return NextResponse.json(
        {
          success: true,
          message: "分析は既に完了しています",
          analysis: interview.fluencyAnalysis,
        },
        { status: 200 }
      );
    }

    // Verify access (only candidate, interviewer, or admin can trigger)
    const isCandidate = interview.candidateId === session.user.id;
    const isInterviewer = interview.interviewerId === session.user.id;
    const isAdmin = session.user.userType === "ADMIN";

    if (!isCandidate && !isInterviewer && !isAdmin) {
      return NextResponse.json(
        { error: "この面接の分析を実行する権限がありません" },
        { status: 403 }
      );
    }

    console.log(
      `🔍 Starting fluency analysis for interview ${interviewId}...`
    );

    // Run fluency analysis (mock for MVP)
    const analysisResult = await analyzeFluency(
      interview.videoUrl,
      interviewId
    );

    // Save analysis results to database
    const fluencyAnalysis = await db.fluencyAnalysis.create({
      data: {
        interviewId: interviewId,
        speechRate: analysisResult.speechRate,
        pauseFrequency: analysisResult.pauseFrequency,
        fillerCount: analysisResult.fillerCount,
        totalDuration: analysisResult.totalDuration,
        overallScore: Math.round(analysisResult.overallScore * 20), // Convert 1-5 scale to 0-100
      },
    });

    console.log(`✅ Fluency analysis saved for interview ${interviewId}`);

    // Send notification to interviewer (mock)
    console.log("📧 [Mock Email] Fluency Analysis Complete");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Subject: 流暢性分析が完了しました`);
    console.log(`\n面接ID: ${interviewId}`);
    console.log(`候補者: ${interview.candidate.name}`);
    console.log(`総合スコア: ${analysisResult.overallScore}/5`);
    console.log("\n詳細はダッシュボードからご確認ください。");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return NextResponse.json({
      success: true,
      message: "流暢性分析が完了しました",
      analysis: {
        id: fluencyAnalysis.id,
        speechRate: fluencyAnalysis.speechRate,
        pauseFrequency: fluencyAnalysis.pauseFrequency,
        fillerCount: fluencyAnalysis.fillerCount,
        totalDuration: fluencyAnalysis.totalDuration,
        overallScore: fluencyAnalysis.overallScore,
        analyzedAt: fluencyAnalysis.analyzedAt,
      },
    });
  } catch (error) {
    console.error("Fluency analysis error:", error);
    return NextResponse.json(
      { error: "流暢性分析に失敗しました" },
      { status: 500 }
    );
  }
}
