import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateSessionToken, getClientIp } from "@/lib/session-token";

// POST - ユーザーがセッションに入室
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try token-based authentication first (for LINE users)
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

    if (sessionToken) {
      // Validate session token with IP address verification
      const clientIp = getClientIp(req);
      const tokenData = await validateSessionToken(sessionToken, clientIp);
      if (tokenData && tokenData.reservationId === id) {
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
      where: { id },
      select: {
        id: true,
        learnerId: true,
        hostId: true,
        learnerJoinedAt: true,
        hostJoinedAt: true,
        sessionStartedAt: true,
        status: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // ユーザーがこの予約に参加しているか確認
    const isLearner = reservation.learnerId === userId;
    const isHost = reservation.hostId === userId;

    console.log("[Join] Auth check:", {
      userId,
      learnerId: reservation.learnerId,
      hostId: reservation.hostId,
      isLearner,
      isHost,
    });

    if (!isLearner && !isHost) {
      console.log("[Join] 403 - User not authorized:", {
        userId,
        learnerId: reservation.learnerId,
        hostId: reservation.hostId,
      });
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const now = new Date();
    let updateData: Record<string, Date> = {};
    let bothJoined = false;

    if (isLearner && !reservation.learnerJoinedAt) {
      updateData.learnerJoinedAt = now;
      // ホストが既に入室していれば両者揃った
      if (reservation.hostJoinedAt) {
        updateData.sessionStartedAt = now;
        bothJoined = true;
      }
    } else if (isHost && !reservation.hostJoinedAt) {
      updateData.hostJoinedAt = now;
      // 学習者が既に入室していれば両者揃った
      if (reservation.learnerJoinedAt) {
        updateData.sessionStartedAt = now;
        bothJoined = true;
      }
    }

    // 更新がある場合のみDB更新
    let updatedReservation = reservation;
    if (Object.keys(updateData).length > 0) {
      updatedReservation = await prisma.reservation.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          learnerId: true,
          hostId: true,
          status: true,
          learnerJoinedAt: true,
          hostJoinedAt: true,
          sessionStartedAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      learnerJoined: !!updatedReservation.learnerJoinedAt,
      hostJoined: !!updatedReservation.hostJoinedAt,
      sessionStarted: !!updatedReservation.sessionStartedAt,
      sessionStartedAt: updatedReservation.sessionStartedAt,
      bothJoined,
    });
  } catch (error) {
    console.error("Join session error:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}

// GET - 入室状態を確認
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try token-based authentication first (for LINE users)
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

    if (sessionToken) {
      // Validate session token with IP address verification
      const clientIp = getClientIp(req);
      const tokenData = await validateSessionToken(sessionToken, clientIp);
      if (tokenData && tokenData.reservationId === id) {
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

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        learnerId: true,
        hostId: true,
        learnerJoinedAt: true,
        hostJoinedAt: true,
        sessionStartedAt: true,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // ユーザーがこの予約に参加しているか確認
    const isLearner = reservation.learnerId === userId;
    const isHost = reservation.hostId === userId;

    if (!isLearner && !isHost) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json({
      learnerJoined: !!reservation.learnerJoinedAt,
      hostJoined: !!reservation.hostJoinedAt,
      sessionStarted: !!reservation.sessionStartedAt,
      sessionStartedAt: reservation.sessionStartedAt,
    });
  } catch (error) {
    console.error("Get join status error:", error);
    return NextResponse.json(
      { error: "Failed to get join status" },
      { status: 500 }
    );
  }
}
