import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/interview-slots/bulk-create
 * Create multiple slots at once
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
    const { slots } = body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json(
        { error: "スロットデータが必要です" },
        { status: 400 }
      );
    }

    // Validate all slots
    for (const slot of slots) {
      if (!slot.startTime || !slot.endTime || !slot.jobCategory) {
        return NextResponse.json(
          { error: "各スロットに必須項目が必要です" },
          { status: 400 }
        );
      }

      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);

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
    }

    // Create all slots in a transaction
    const createdSlots = await db.$transaction(
      slots.map((slot) =>
        db.interviewSlot.create({
          data: {
            interviewerId: session.user.id,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            jobCategory: slot.jobCategory,
            notes: slot.notes || null,
            status: "AVAILABLE",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${createdSlots.length}件のスロットを作成しました`,
      count: createdSlots.length,
      slots: createdSlots.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        jobCategory: s.jobCategory,
      })),
    });
  } catch (error) {
    console.error("Bulk slot creation error:", error);
    return NextResponse.json(
      { error: "スロットの一括作成に失敗しました" },
      { status: 500 }
    );
  }
}
