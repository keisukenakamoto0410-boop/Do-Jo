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

    // Fetch completed interviews without evaluations
    const pendingInterviews = await db.interview.findMany({
      where: {
        interviewerId: session.user.id,
        status: "COMPLETED",
        evaluation: null,
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            japaneseLevel: true,
          },
        },
        slot: {
          select: {
            jobCategory: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        conductedAt: "asc", // Oldest first (priority)
      },
    });

    // Calculate days since interview for priority
    const now = new Date();
    const formattedPending = pendingInterviews.map((interview) => {
      const conductedDate = interview.conductedAt || interview.scheduledAt;
      const daysSince = Math.floor(
        (now.getTime() - new Date(conductedDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine priority based on days since interview
      let priority: "high" | "medium" | "low" = "low";
      if (daysSince > 7) {
        priority = "high";
      } else if (daysSince > 3) {
        priority = "medium";
      }

      return {
        id: interview.id,
        conductedAt: conductedDate,
        daysSince,
        priority,
        candidate: {
          id: interview.candidate.id,
          name: interview.candidate.name,
          email: interview.candidate.email,
          japaneseLevel: interview.candidate.japaneseLevel,
        },
        jobCategory: interview.slot.jobCategory,
        interviewTime: {
          start: interview.slot.startTime,
          end: interview.slot.endTime,
        },
      };
    });

    return NextResponse.json({
      success: true,
      pendingEvaluations: formattedPending,
      count: formattedPending.length,
      priorityCounts: {
        high: formattedPending.filter((p) => p.priority === "high").length,
        medium: formattedPending.filter((p) => p.priority === "medium").length,
        low: formattedPending.filter((p) => p.priority === "low").length,
      },
    });
  } catch (error) {
    console.error("Pending evaluations error:", error);
    return NextResponse.json(
      { error: "評価待ちの取得に失敗しました" },
      { status: 500 }
    );
  }
}
