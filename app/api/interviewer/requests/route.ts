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
    const status = searchParams.get("status") || "all"; // pending, scheduled, rejected, all

    // Build where clause based on status filter
    const where: any = {
      interviewerId: session.user.id,
    };

    if (status === "pending") {
      where.status = "PENDING";
    } else if (status === "scheduled") {
      where.status = "SCHEDULED";
    } else if (status === "rejected") {
      where.status = "REJECTED";
    }
    // If status is "all", don't filter by status

    // Fetch booking requests
    const requests = await db.interview.findMany({
      where,
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
        createdAt: "desc",
      },
    });

    // Format response
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
      scheduledAt: request.scheduledAt,
      candidate: {
        id: request.candidate.id,
        name: request.candidate.name,
        email: request.candidate.email,
        japaneseLevel: request.candidate.japaneseLevel,
      },
      slot: {
        jobCategory: request.slot.jobCategory,
        startTime: request.slot.startTime,
        endTime: request.slot.endTime,
      },
    }));

    // Calculate counts for each status
    const allRequests = await db.interview.findMany({
      where: {
        interviewerId: session.user.id,
      },
      select: {
        status: true,
      },
    });

    const counts = {
      pending: allRequests.filter((r) => r.status === "PENDING").length,
      scheduled: allRequests.filter((r) => r.status === "SCHEDULED").length,
      rejected: allRequests.filter((r) => r.status === "REJECTED").length,
      all: allRequests.length,
    };

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      count: formattedRequests.length,
      counts,
      currentFilter: status,
    });
  } catch (error) {
    console.error("Booking requests error:", error);
    return NextResponse.json(
      { error: "予約リクエストの取得に失敗しました" },
      { status: 500 }
    );
  }
}
