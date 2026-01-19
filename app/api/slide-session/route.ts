import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: スライドセッション情報を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("reservationId");

    if (!reservationId) {
      return NextResponse.json(
        { error: "reservationId is required" },
        { status: 400 }
      );
    }

    // 予約の参加者かどうか確認
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { learnerId: true, hostId: true, slideTopic: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (
      reservation.learnerId !== session.user.id &&
      reservation.hostId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // スライドセッションを取得または作成
    let slideSession = await prisma.slideSession.findUnique({
      where: { reservationId },
    });

    if (!slideSession) {
      slideSession = await prisma.slideSession.create({
        data: {
          reservationId,
          currentSlide: 1,
          slideTopic: reservation.slideTopic,
        },
      });
    }

    return NextResponse.json({ slideSession });
  } catch (error) {
    console.error("Error fetching slide session:", error);
    return NextResponse.json(
      { error: "Failed to fetch slide session" },
      { status: 500 }
    );
  }
}

// POST: スライドセッションを更新（学習者のみ）
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reservationId, currentSlide, slideTopic } = body;

    if (!reservationId) {
      return NextResponse.json(
        { error: "reservationId is required" },
        { status: 400 }
      );
    }

    // 予約を取得して学習者かどうか確認
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { learnerId: true, hostId: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // 学習者のみスライド操作可能
    if (reservation.learnerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the learner can control slides" },
        { status: 403 }
      );
    }

    // スライドセッションを更新または作成
    const slideSession = await prisma.slideSession.upsert({
      where: { reservationId },
      update: {
        ...(currentSlide !== undefined && { currentSlide }),
        ...(slideTopic !== undefined && { slideTopic }),
      },
      create: {
        reservationId,
        currentSlide: currentSlide || 1,
        slideTopic: slideTopic || null,
      },
    });

    return NextResponse.json({ slideSession });
  } catch (error) {
    console.error("Error updating slide session:", error);
    return NextResponse.json(
      { error: "Failed to update slide session" },
      { status: 500 }
    );
  }
}
