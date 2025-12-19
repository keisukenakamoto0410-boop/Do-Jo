import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId } = await params;

    // 予約を取得
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        slot: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // ユーザーが参加者か確認
    if (
      reservation.learnerId !== session.user.id &&
      reservation.hostId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // セッション完了処理
    const completedAt = new Date();

    await prisma.$transaction(async (tx) => {
      // 予約を完了状態に更新
      await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: "completed",
          completedAt,
        },
      });

      // スロットも完了状態に
      await tx.slot.update({
        where: { id: reservation.slotId },
        data: {
          status: "completed",
        },
      });

      // 両ユーザーのセッション数を更新
      await tx.user.update({
        where: { id: reservation.learnerId },
        data: {
          totalSessions: { increment: 1 },
          totalTalkTime: { increment: 25 }, // 25分追加
        },
      });

      await tx.user.update({
        where: { id: reservation.hostId },
        data: {
          totalSessions: { increment: 1 },
          totalTalkTime: { increment: 25 },
        },
      });
    });

    return NextResponse.json({
      success: true,
      completedAt,
    });
  } catch (error) {
    console.error("Session completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
