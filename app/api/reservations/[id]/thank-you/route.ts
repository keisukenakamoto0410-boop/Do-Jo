import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - 学習者がホストにお礼メッセージを送信
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId } = await params;
    const { message, rating, emoji } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "メッセージを入力してください" },
        { status: 400 }
      );
    }

    // 予約を取得
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        learner: true,
        host: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "予約が見つかりません" },
        { status: 404 }
      );
    }

    // 学習者本人か確認
    if (reservation.learnerId !== session.user.id) {
      return NextResponse.json(
        { error: "この予約の学習者ではありません" },
        { status: 403 }
      );
    }

    // 既にお礼メッセージがあるか確認
    const existing = await prisma.thankYouMessage.findUnique({
      where: { reservationId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "既にお礼メッセージを送信済みです" },
        { status: 400 }
      );
    }

    // お礼メッセージを作成
    const thankYouMessage = await prisma.thankYouMessage.create({
      data: {
        reservationId,
        learnerId: session.user.id,
        learnerName: reservation.learner.name,
        hostId: reservation.hostId,
        message: message.trim(),
        rating: rating || null,
        emoji: emoji || null,
      },
    });

    return NextResponse.json({
      success: true,
      thankYouMessage,
    });
  } catch (error) {
    console.error("Failed to create thank you message:", error);
    return NextResponse.json(
      { error: "お礼メッセージの送信に失敗しました" },
      { status: 500 }
    );
  }
}

// GET - お礼メッセージを取得（学習者・ホスト両方から取得可能）
export async function GET(
  req: NextRequest,
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
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "予約が見つかりません" },
        { status: 404 }
      );
    }

    // 学習者またはホスト本人か確認
    if (
      reservation.learnerId !== session.user.id &&
      reservation.hostId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "この予約にアクセスする権限がありません" },
        { status: 403 }
      );
    }

    // お礼メッセージを取得
    const thankYouMessage = await prisma.thankYouMessage.findUnique({
      where: { reservationId },
    });

    return NextResponse.json({
      thankYouMessage,
    });
  } catch (error) {
    console.error("Failed to get thank you message:", error);
    return NextResponse.json(
      { error: "お礼メッセージの取得に失敗しました" },
      { status: 500 }
    );
  }
}
