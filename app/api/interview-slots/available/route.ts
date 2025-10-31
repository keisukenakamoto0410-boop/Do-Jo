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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const interviewerId = searchParams.get("interviewerId");

    // Build filter conditions
    const where: any = {
      status: "AVAILABLE",
      startTime: {
        gte: startDate ? new Date(startDate) : new Date(),
      },
    };

    if (endDate) {
      where.startTime.lte = new Date(endDate);
    }

    if (category && category !== "all") {
      where.jobCategory = category;
    }

    if (interviewerId) {
      where.interviewerId = interviewerId;
    }

    // Fetch available slots with interviewer info
    const slots = await db.interviewSlot.findMany({
      where,
      include: {
        interviewer: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
        interviews: {
          where: {
            status: {
              in: ["SCHEDULED", "COMPLETED"],
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Filter out slots that already have interviews
    const availableSlots = slots.filter((slot) => slot.interviews.length === 0);

    // Format response
    const formattedSlots = availableSlots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      jobCategory: slot.jobCategory,
      interviewer: {
        id: slot.interviewer.id,
        name: slot.interviewer.name,
        expertise: slot.interviewer.profile
          ? (slot.interviewer.profile as any).specialties || []
          : [],
        bio: slot.interviewer.profile
          ? (slot.interviewer.profile as any).bio || ""
          : "",
      },
    }));

    return NextResponse.json({
      success: true,
      slots: formattedSlots,
      count: formattedSlots.length,
    });
  } catch (error) {
    console.error("Available slots error:", error);
    return NextResponse.json(
      { error: "スロットの取得に失敗しました" },
      { status: 500 }
    );
  }
}
