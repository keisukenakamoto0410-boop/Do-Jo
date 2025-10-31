import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/interview-slots/create
 * Create a new availability slot
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { startTime, endTime, jobCategory, notes } = body;

    if (!startTime || !endTime || !jobCategory) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // Validate time slot
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: "終了時刻は開始時刻より後である必要があります" },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "過去の時間にスロットを作成することはできません" },
        { status: 400 }
      );
    }

    // Check for overlapping slots
    const overlapping = await db.interviewSlot.findFirst({
      where: {
        interviewerId: session.user.id,
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } },
            ],
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } },
            ],
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "この時間帯には既にスロットが存在します" },
        { status: 400 }
      );
    }

    // Create slot
    const slot = await db.interviewSlot.create({
      data: {
        interviewerId: session.user.id,
        startTime: start,
        endTime: end,
        jobCategory,
        notes: notes || null,
        status: "AVAILABLE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "スロットを作成しました",
      slot: {
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        jobCategory: slot.jobCategory,
        status: slot.status,
      },
    });
  } catch (error) {
    console.error("Slot creation error:", error);
    return NextResponse.json(
      { error: "スロットの作成に失敗しました" },
      { status: 500 }
    );
  }
}
