import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 予約の存在と所有権を確認
    const existingReservation = await db.reservation.findUnique({
      where: { id },
      select: { learnerId: true },
    });

    if (!existingReservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // 現在のユーザーを取得
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser || existingReservation.learnerId !== currentUser.id) {
      return NextResponse.json({ error: "You can only prepare your own reservations" }, { status: 403 });
    }

    const body = await req.json();
    const {
      progressSinceLastSession,
      textbook,
      currentLesson,
      grammarToStudy,
      selectedTopic,
      slideTopic,
      targetWords,
      conversationGoal,
      additionalNotes,
    } = body;

    // ターゲット単語のバリデーション（最大5個）
    const validatedTargetWords = Array.isArray(targetWords)
      ? targetWords.filter((w: string) => typeof w === "string" && w.trim() !== "").slice(0, 5)
      : [];

    // 予約を更新
    const reservation = await db.reservation.update({
      where: { id },
      data: {
        progressSinceLastSession,
        selectedTopic,
        slideTopic,
        grammarToStudy,
        targetWords: validatedTargetWords,
        conversationGoal,
        additionalNotes,
      },
    });

    // 学習者の情報も更新
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: {
          textbook,
          currentLesson,
        },
      });
    }

    return NextResponse.json({ success: true, reservation });
  } catch (error) {
    console.error("Prepare error:", error);
    return NextResponse.json(
      { error: "Failed to save preparation" },
      { status: 500 }
    );
  }
}
