import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * DELETE /api/interview-slots/[id]
 * Delete an availability slot
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const slotId = params.id;

    // Find the slot
    const slot = await db.interviewSlot.findUnique({
      where: { id: slotId },
      include: {
        interviews: {
          where: {
            status: {
              in: ["PENDING", "SCHEDULED"],
            },
          },
        },
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: "スロットが見つかりません" },
        { status: 404 }
      );
    }

    // Check ownership
    if (slot.interviewerId !== session.user.id) {
      return NextResponse.json(
        { error: "このスロットを削除する権限がありません" },
        { status: 403 }
      );
    }

    // Check if slot is booked
    if (slot.interviews.length > 0) {
      return NextResponse.json(
        { error: "予約済みのスロットは削除できません" },
        { status: 400 }
      );
    }

    // Delete the slot
    await db.interviewSlot.delete({
      where: { id: slotId },
    });

    return NextResponse.json({
      success: true,
      message: "スロットを削除しました",
    });
  } catch (error) {
    console.error("Slot deletion error:", error);
    return NextResponse.json(
      { error: "スロットの削除に失敗しました" },
      { status: 500 }
    );
  }
}
