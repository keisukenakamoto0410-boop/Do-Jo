import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Check if user is an interviewer
    if (session.user.userType !== "INTERVIEWER") {
      return NextResponse.json(
        { error: "面接官のみがアクセスできます" },
        { status: 403 }
      );
    }

    // Get current month date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get total interviews conducted this month
    const totalInterviews = await db.interview.count({
      where: {
        interviewerId: session.user.id,
        status: "COMPLETED",
        conductedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Get all completed interviews with evaluations for average score
    const completedWithEvaluations = await db.interview.findMany({
      where: {
        interviewerId: session.user.id,
        status: "COMPLETED",
        conductedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      include: {
        evaluation: true,
      },
    });

    // Calculate average evaluation score
    let averageScore = 0;
    if (completedWithEvaluations.length > 0) {
      const scoresArray = completedWithEvaluations
        .filter((interview) => interview.evaluation)
        .map((interview) => {
          const scores = interview.evaluation!.scores as any;
          // Calculate average of all 18 criteria
          const criteriaValues = Object.values(scores) as number[];
          const sum = criteriaValues.reduce((acc, val) => acc + val, 0);
          return sum / criteriaValues.length;
        });

      if (scoresArray.length > 0) {
        averageScore =
          scoresArray.reduce((acc, val) => acc + val, 0) / scoresArray.length;
      }
    }

    // Calculate completion rate (interviews with evaluations vs total completed)
    const totalCompleted = await db.interview.count({
      where: {
        interviewerId: session.user.id,
        status: "COMPLETED",
        conductedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    const completedWithEval = await db.interview.count({
      where: {
        interviewerId: session.user.id,
        status: "COMPLETED",
        conductedAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        evaluation: {
          isNot: null,
        },
      },
    });

    const completionRate =
      totalCompleted > 0 ? (completedWithEval / totalCompleted) * 100 : 0;

    // Get pending evaluations count
    const pendingEvaluations = await db.interview.count({
      where: {
        interviewerId: session.user.id,
        status: "COMPLETED",
        evaluation: null,
      },
    });

    // Get upcoming interviews count (this week)
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const upcomingThisWeek = await db.interview.count({
      where: {
        interviewerId: session.user.id,
        status: "SCHEDULED",
        scheduledAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalInterviewsThisMonth: totalInterviews,
        averageScore: Math.round(averageScore * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        pendingEvaluations,
        upcomingThisWeek,
      },
    });
  } catch (error) {
    console.error("Interviewer stats error:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
