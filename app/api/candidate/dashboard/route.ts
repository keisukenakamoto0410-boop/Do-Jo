import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/candidate/dashboard
 * Fetch dashboard data for the authenticated candidate
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    if (session.user.userType !== "CANDIDATE") {
      return NextResponse.json(
        { error: "候補者のみアクセスできます" },
        { status: 403 }
      );
    }

    const candidateId = session.user.id;

    // Get current month usage tracking
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usageTracking = await db.usageTracking.findUnique({
      where: {
        candidateId_month: {
          candidateId,
          month: currentMonth,
        },
      },
    });

    // Get next upcoming interview
    const nextInterview = await db.interview.findFirst({
      where: {
        candidateId,
        scheduledAt: {
          gte: new Date(),
        },
        status: {
          in: ["SCHEDULED"],
        },
      },
      include: {
        interviewer: {
          select: {
            name: true,
            expertise: true,
          },
        },
        slot: {
          select: {
            jobCategory: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    // Get recent completed interviews with feedback
    const recentFeedback = await db.interview.findMany({
      where: {
        candidateId,
        status: "COMPLETED",
        evaluation: {
          isNot: null,
        },
      },
      include: {
        evaluation: {
          select: {
            scores: true,
            createdAt: true,
          },
        },
        interviewer: {
          select: {
            name: true,
          },
        },
        slot: {
          select: {
            jobCategory: true,
          },
        },
      },
      orderBy: {
        conductedAt: "desc",
      },
      take: 5,
    });

    // Calculate overall statistics
    const totalInterviews = await db.interview.count({
      where: {
        candidateId,
        status: "COMPLETED",
      },
    });

    // Get pending interviews count
    const pendingInterviews = await db.interview.count({
      where: {
        candidateId,
        status: "PENDING",
      },
    });

    // Calculate average score from all evaluations
    const allEvaluations = await db.evaluation.findMany({
      where: {
        interview: {
          candidateId,
        },
      },
      select: {
        scores: true,
      },
    });

    let averageScore = 0;
    if (allEvaluations.length > 0) {
      const totalScore = allEvaluations.reduce((sum, evaluation) => {
        const scores = evaluation.scores as any;
        const sectionTotal = Object.values(scores).reduce(
          (sectionSum: number, section: any) => {
            return sectionSum + (section.total || 0);
          },
          0
        );
        return sum + sectionTotal;
      }, 0);
      const maxScore = allEvaluations.length * 100; // 5 sections × 20 points × number of evaluations
      averageScore = Math.round((totalScore / maxScore) * 100);
    }

    return NextResponse.json({
      usage: {
        used: usageTracking?.usageCount || 0,
        limit: usageTracking?.limit || 2,
        remaining: (usageTracking?.limit || 2) - (usageTracking?.usageCount || 0),
      },
      nextInterview: nextInterview
        ? {
            id: nextInterview.id,
            scheduledAt: nextInterview.scheduledAt,
            interviewer: nextInterview.interviewer,
            jobCategory: nextInterview.slot?.jobCategory,
            status: nextInterview.status,
          }
        : null,
      recentFeedback: recentFeedback.map((interview) => {
        const scores = interview.evaluation?.scores as any;
        const totalScore = Object.values(scores).reduce(
          (sum: number, section: any) => {
            return sum + (section.total || 0);
          },
          0
        );
        const overallPercentage = Math.round((totalScore / 100) * 100);

        return {
          id: interview.id,
          date: interview.conductedAt,
          interviewer: interview.interviewer.name,
          jobCategory: interview.slot?.jobCategory,
          score: overallPercentage,
          createdAt: interview.evaluation?.createdAt,
        };
      }),
      stats: {
        totalInterviews,
        pendingInterviews,
        averageScore,
        completedThisMonth: usageTracking?.usageCount || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return NextResponse.json(
      { error: "ダッシュボードデータの取得に失敗しました" },
      { status: 500 }
    );
  }
}
