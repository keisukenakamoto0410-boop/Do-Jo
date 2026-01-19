import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - ユーザーがセッションに入室
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

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

    if (!isLearner && !isHost) {
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
    const isLearner = reservation.learnerId === session.user.id;
    const isHost = reservation.hostId === session.user.id;

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
