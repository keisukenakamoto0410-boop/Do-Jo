import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateSessionToken, getClientIp } from "@/lib/session-token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params;

    // Try token-based authentication first (for LINE users)
    const authHeader = request.headers.get("Authorization");
    const sessionToken = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

    if (sessionToken) {
      // Validate session token with IP address verification
      const clientIp = getClientIp(request);
      const tokenData = await validateSessionToken(sessionToken, clientIp);
      if (tokenData && tokenData.reservationId === reservationId) {
        userId = tokenData.userId;
      }
    }

    // Fall back to NextAuth session if no token
    if (!userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
    }

    // 予約を取得
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        slot: true,
        learner: {
          select: { totalSessions: true },
        },
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
      reservation.learnerId !== userId &&
      reservation.hostId !== userId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 重複実行チェック：既に完了している場合は既存のメダルを返す
    if (reservation.status === "completed") {
      console.log("[Complete] Session already completed, returning existing medals");
      const existingMedals = await prisma.userMedal.findMany({
        where: {
          userId: reservation.learnerId,
          reservationId,
        },
      });
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        completedAt: reservation.completedAt,
        earnedMedals: existingMedals.map((m) => m.medalType),
      });
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

      // メダル付与処理
      const medalsToAward: string[] = [];

      // 初回セッション完了メダル
      if (reservation.learner.totalSessions === 0) {
        medalsToAward.push("first_session");
      }

      // スライドトピック別メダル
      if (reservation.slideTopic) {
        medalsToAward.push(`topic_${reservation.slideTopic}`);
      }

      // セッション数に応じたメダル
      const newSessionCount = reservation.learner.totalSessions + 1;
      if (newSessionCount === 5) {
        medalsToAward.push("sessions_5");
      } else if (newSessionCount === 10) {
        medalsToAward.push("sessions_10");
      } else if (newSessionCount === 25) {
        medalsToAward.push("sessions_25");
      } else if (newSessionCount === 50) {
        medalsToAward.push("sessions_50");
      }

      // メダルを付与（既存のものは無視）
      for (const medalType of medalsToAward) {
        await tx.userMedal.upsert({
          where: {
            userId_medalType: {
              userId: reservation.learnerId,
              medalType,
            },
          },
          create: {
            userId: reservation.learnerId,
            medalType,
            reservationId,
          },
          update: {}, // 既に存在する場合は何もしない
        });
      }
    });

    // 付与されたメダルを取得して返す
    const earnedMedals = await prisma.userMedal.findMany({
      where: {
        userId: reservation.learnerId,
        reservationId,
      },
    });

    return NextResponse.json({
      success: true,
      completedAt,
      earnedMedals: earnedMedals.map((m) => m.medalType),
    });
  } catch (error) {
    console.error("Session completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
