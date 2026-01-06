import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 学習者の情報を取得
    const learner = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        textbook: true,
        currentLesson: true,
      },
    });

    // 直前の会話履歴を取得
    const previousHistory = await db.conversationHistory.findFirst({
      where: { learnerId: session.user.id },
      orderBy: { date: "desc" },
      select: {
        topic: true,
        grammarPoints: true,
        date: true,
      },
    });

    // 直前の完了した予約を取得（会話履歴がない場合）
    let previousReservation = null;
    if (!previousHistory) {
      previousReservation = await db.reservation.findFirst({
        where: {
          learnerId: session.user.id,
          status: "completed",
        },
        orderBy: { completedAt: "desc" },
        select: {
          selectedTopic: true,
          grammarToStudy: true,
          completedAt: true,
        },
      });
    }

    const previousSession = previousHistory
      ? {
          topic: previousHistory.topic,
          grammarPoints: previousHistory.grammarPoints,
          date: previousHistory.date,
          textbook: learner?.textbook,
          currentLesson: learner?.currentLesson,
        }
      : previousReservation
        ? {
            topic: previousReservation.selectedTopic,
            grammarPoints: previousReservation.grammarToStudy,
            date: previousReservation.completedAt,
            textbook: learner?.textbook,
            currentLesson: learner?.currentLesson,
          }
        : null;

    return NextResponse.json({ previousSession });
  } catch (error) {
    console.error("Previous session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch previous session" },
      { status: 500 }
    );
  }
}
