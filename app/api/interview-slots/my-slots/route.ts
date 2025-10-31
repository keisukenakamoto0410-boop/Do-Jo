import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/interview-slots/my-slots
 * Get all slots for the authenticated interviewer
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {
      interviewerId: session.user.id,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lt: new Date(endDate),
      };
    }

    // Fetch slots with interview details
    const slots = await db.interviewSlot.findMany({
      where,
      include: {
        interviews: {
          where: {
            status: {
              in: ["PENDING", "SCHEDULED", "COMPLETED"],
            },
          },
          select: {
            id: true,
            status: true,
            candidate: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Transform slots to include booking status
    const transformedSlots = slots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      jobCategory: slot.jobCategory,
      notes: slot.notes,
      status: slot.status,
      isBooked: slot.interviews.length > 0,
      interview: slot.interviews.length > 0 ? slot.interviews[0] : null,
    }));

    // Calculate statistics
    const now = new Date();
    const stats = {
      totalSlots: transformedSlots.length,
      availableSlots: transformedSlots.filter(
        (s) => !s.isBooked && new Date(s.startTime) > now
      ).length,
      bookedSlots: transformedSlots.filter((s) => s.isBooked).length,
      pastSlots: transformedSlots.filter(
        (s) => new Date(s.startTime) < now
      ).length,
    };

    return NextResponse.json({
      slots: transformedSlots,
      stats,
    });
  } catch (error) {
    console.error("Fetch slots error:", error);
    return NextResponse.json(
      { error: "スロットの取得に失敗しました" },
      { status: 500 }
    );
  }
}
