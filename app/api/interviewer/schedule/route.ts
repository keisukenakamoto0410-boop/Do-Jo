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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week"; // week, month, today

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      // Start of current week (Sunday)
      startDate.setHours(0, 0, 0, 0);
      startDate.setDate(now.getDate() - now.getDay());
      // End of current week
      endDate.setDate(startDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Fetch scheduled interviews
    const interviews = await db.interview.findMany({
      where: {
        interviewerId: session.user.id,
        status: "SCHEDULED",
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
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
        scheduledAt: "asc",
      },
    });

    // Format response
    const formattedInterviews = interviews.map((interview) => ({
      id: interview.id,
      scheduledAt: interview.scheduledAt,
      startTime: interview.slot.startTime,
      endTime: interview.slot.endTime,
      candidate: {
        id: interview.candidate.id,
        name: interview.candidate.name,
        email: interview.candidate.email,
        japaneseLevel: interview.candidate.japaneseLevel,
      },
      jobCategory: interview.slot.jobCategory,
      status: interview.status,
    }));

    return NextResponse.json({
      success: true,
      interviews: formattedInterviews,
      count: formattedInterviews.length,
      period,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error("Interviewer schedule error:", error);
    return NextResponse.json(
      { error: "スケジュールの取得に失敗しました" },
      { status: 500 }
    );
  }
}
