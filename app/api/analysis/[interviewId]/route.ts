import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getScoreInterpretation,
  getBenchmarkData,
} from "@/lib/analysis/fluency-analyzer";

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
        fluencyAnalysis: true,
        candidate: {
          select: {
            id: true,
            name: true,
            japaneseLevel: true,
          },
        },
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
        { error: "この分析結果にアクセスする権限がありません" },
        { status: 403 }
      );
    }

    // Check if analysis exists
    if (!interview.fluencyAnalysis) {
      return NextResponse.json(
        {
          success: false,
          message: "流暢性分析はまだ実施されていません",
          analysis: null,
        },
        { status: 404 }
      );
    }

    // Convert overallScore from 0-100 back to 1-5 scale for interpretation
    const scoreOn5Scale = interview.fluencyAnalysis.overallScore / 20;
    const interpretation = getScoreInterpretation(scoreOn5Scale);
    const benchmarks = getBenchmarkData();

    // Format response with detailed analysis
    return NextResponse.json({
      success: true,
      analysis: {
        id: interview.fluencyAnalysis.id,
        interviewId: interview.id,
        metrics: {
          speechRate: {
            value: interview.fluencyAnalysis.speechRate,
            unit: "モーラ/秒",
            benchmark: benchmarks.speechRate,
          },
          pauseFrequency: {
            value: interview.fluencyAnalysis.pauseFrequency,
            unit: "ポーズ/分",
            benchmark: benchmarks.pauseFrequency,
          },
          fillerCount: {
            value: interview.fluencyAnalysis.fillerCount,
            unit: "回",
            benchmark: benchmarks.fillerCount,
          },
          totalDuration: {
            value: interview.fluencyAnalysis.totalDuration,
            unit: "秒",
          },
        },
        overallScore: {
          value: interview.fluencyAnalysis.overallScore,
          scale: "0-100",
          scoreOn5Scale: scoreOn5Scale,
          interpretation: interpretation,
        },
        analyzedAt: interview.fluencyAnalysis.analyzedAt,
        candidate: {
          name: interview.candidate.name,
          japaneseLevel: interview.candidate.japaneseLevel,
        },
      },
    });
  } catch (error) {
    console.error("Get fluency analysis error:", error);
    return NextResponse.json(
      { error: "分析結果の取得に失敗しました" },
      { status: 500 }
    );
  }
}
